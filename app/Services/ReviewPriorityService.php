<?php

namespace App\Services;

use App\Models\QuestionAttempt;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Prioridade de revisão de cada tópico, por inferência fuzzy de Mamdani.
 *
 * Entradas: a taxa de acerto do aluno no tópico (0 a 100%) e os dias desde a última tentativa (0 a 30).
 * Saída: a prioridade de revisão (0 a 100).
 *
 * Tópicos nunca praticados ficam de fora: sem tentativas, não há taxa de acerto para fuzzificar.
 */
class ReviewPriorityService
{
    /**
     * As variáveis linguísticas: o universo de cada uma e os 4 pontos [a, b, c, d] de cada termo.
     *
     * O grau sobe de a até b, fica em 1 de b até c e desce até d. No triângulo, b = c; nas bordas
     * do universo, o termo começa ou termina no topo (a = b ou c = d). Os termos vizinhos somam 1
     * em todo o universo, então todo valor pertence a pelo menos um termo.
     */
    private const VARIABLES = [
        'acerto' => ['min' => 0, 'max' => 100, 'terms' => [
            'baixo' => [0, 0, 25, 50],
            'medio' => [25, 50, 50, 75],
            'alto' => [50, 75, 100, 100],
        ]],
        'recencia' => ['min' => 0, 'max' => 30, 'terms' => [
            'recente' => [0, 0, 3, 10],
            'media' => [3, 10, 10, 17],
            'antiga' => [10, 17, 30, 30],
        ]],
        'prioridade' => ['min' => 0, 'max' => 100, 'terms' => [
            'baixa' => [0, 0, 25, 50],
            'media' => [25, 50, 50, 75],
            'alta' => [50, 75, 100, 100],
        ]],
    ];

    /**
     * Matriz de regras: linha = acerto, coluna = recência, célula = prioridade.
     *
     * Cada célula é a regra "SE acerto é X E recência é Y ENTÃO prioridade é Z". As 9 células
     * cobrem todas as combinações, então qualquer entrada dispara ao menos uma regra.
     */
    public const RULES = [
        'baixo' => ['recente' => 'media', 'media' => 'alta', 'antiga' => 'alta'],
        'medio' => ['recente' => 'baixa', 'media' => 'media', 'antiga' => 'alta'],
        'alto' => ['recente' => 'baixa', 'media' => 'baixa', 'antiga' => 'media'],
    ];

    /**
     * A inferência de Mamdani em 4 passos, com tudo o que a tela precisa para explicá-la.
     *
     * @return array{
     *     fuzzified: array{acerto: array<string, float>, recencia: array<string, float>},
     *     rules: list<array{acerto: string, recencia: string, prioridade: string, strength: float}>,
     *     activation: array<string, float>,
     *     aggregated: list<array{z: int, degree: float}>,
     *     centroid: float,
     *     output_degrees: array<string, float>,
     *     label: string,
     * }
     */
    public function evaluate(float $accuracy, float $daysSinceLastAttempt): array
    {
        // Passo 1, fuzzificação: o grau de cada entrada em cada um dos seus termos.
        $fuzzified = [
            'acerto' => $this->fuzzify('acerto', $accuracy),
            'recencia' => $this->fuzzify('recencia', $daysSinceLastAttempt),
        ];

        // Passo 2, regras: o E é o mínimo, e cada termo de saída fica com o maior grau
        // entre as regras que levam a ele.
        $rules = [];
        $activation = ['baixa' => 0.0, 'media' => 0.0, 'alta' => 0.0];

        foreach (self::RULES as $accuracyTerm => $row) {
            foreach ($row as $recencyTerm => $priorityTerm) {
                $strength = min($fuzzified['acerto'][$accuracyTerm], $fuzzified['recencia'][$recencyTerm]);
                $rules[] = ['acerto' => $accuracyTerm, 'recencia' => $recencyTerm, 'prioridade' => $priorityTerm, 'strength' => $strength];
                $activation[$priorityTerm] = max($activation[$priorityTerm], $strength);
            }
        }

        // Passo 3, agregação: em cada ponto z da saída, cada termo é cortado no grau da sua
        // ativação (mínimo) e os cortes são unidos (máximo).
        $aggregated = [];

        foreach (range(0, 100) as $z) {
            $degree = 0.0;

            foreach ($activation as $term => $strength) {
                $degree = max($degree, min($strength, $this->degree($z, self::VARIABLES['prioridade']['terms'][$term])));
            }

            $aggregated[] = ['z' => $z, 'degree' => $degree];
        }

        // Passo 4, defuzzificação pelo centróide: Σ z·μ(z) / Σ μ(z) nos pontos do passo 3.
        $weighted = array_sum(array_map(fn (array $point): float => $point['z'] * $point['degree'], $aggregated));
        $centroid = $weighted / array_sum(array_column($aggregated, 'degree'));
        $outputDegrees = $this->fuzzify('prioridade', $centroid);

        return [
            'fuzzified' => $fuzzified,
            'rules' => $rules,
            'activation' => $activation,
            'aggregated' => $aggregated,
            'centroid' => $centroid,
            'output_degrees' => $outputDegrees,
            'label' => array_search(max($outputDegrees), $outputDegrees, true),
        ];
    }

    /**
     * O sistema como dados, para desenhar os gráficos e a tabela de regras na tela.
     *
     * @return array{inputs: list<array<string, mixed>>, output: array<string, mixed>, rules: list<array{acerto: string, recencia: string, prioridade: string}>}
     */
    public function describe(): array
    {
        $rules = [];

        foreach (self::RULES as $accuracyTerm => $row) {
            foreach ($row as $recencyTerm => $priorityTerm) {
                $rules[] = ['acerto' => $accuracyTerm, 'recencia' => $recencyTerm, 'prioridade' => $priorityTerm];
            }
        }

        return [
            'inputs' => [$this->variable('acerto'), $this->variable('recencia')],
            'output' => $this->variable('prioridade'),
            'rules' => $rules,
        ];
    }

    /**
     * A prioridade de cada tópico que o aluno já praticou, da maior para a menor.
     *
     * Com $withExplanation, cada tópico traz também a inferência passo a passo, com os mesmos
     * números usados para ordenar.
     *
     * @return Collection<int, array{topic_id: int, topic: string, subject: string, attempts: int, accuracy: float, days_since_last_attempt: float, priority: int, label: string}>
     */
    public function forUser(int $userId, bool $withExplanation = false): Collection
    {
        return QuestionAttempt::query()
            ->join('questions', 'questions.id', '=', 'question_attempts.question_id')
            ->join('topics', 'topics.id', '=', 'questions.topic_id')
            ->join('subjects', 'subjects.id', '=', 'topics.subject_id')
            ->where('subjects.user_id', $userId)
            ->where('question_attempts.user_id', $userId)
            ->groupBy('topics.id', 'topics.name', 'subjects.name')
            ->selectRaw('topics.id as topic_id, topics.name as topic, subjects.name as subject')
            ->selectRaw('COUNT(*) as attempts, SUM(question_attempts.is_correct) as correct, MAX(question_attempts.answered_at) as last_answered_at')
            ->get()
            ->map(function ($row) use ($withExplanation): array {
                $accuracy = $row->correct / $row->attempts * 100;
                $days = Carbon::parse($row->last_answered_at)->diffInDays(now(), true);
                $inference = $this->evaluate($accuracy, $days);

                return [
                    'topic_id' => (int) $row->topic_id,
                    'topic' => $row->topic,
                    'subject' => $row->subject,
                    'attempts' => (int) $row->attempts,
                    'accuracy' => round($accuracy, 1),
                    'days_since_last_attempt' => round($days, 1),
                    'priority' => (int) round($inference['centroid']),
                    'label' => $inference['label'],
                ] + ($withExplanation ? ['explanation' => $inference] : []);
            })
            ->sortByDesc('priority')
            ->values();
    }

    /**
     * Grau de pertinência de x num termo [a, b, c, d]: 1 no topo, (x − a)/(b − a) na subida,
     * (d − x)/(d − c) na descida e 0 fora.
     *
     * @param  array{0: int, 1: int, 2: int, 3: int}  $points
     */
    private function degree(float $x, array $points): float
    {
        [$a, $b, $c, $d] = $points;

        if ($x >= $b && $x <= $c) {
            return 1.0;
        }

        if ($x > $a && $x < $b) {
            return ($x - $a) / ($b - $a);
        }

        if ($x > $c && $x < $d) {
            return ($d - $x) / ($d - $c);
        }

        return 0.0;
    }

    /**
     * O grau de um valor em cada termo da variável. Valores fora do universo vão para a borda
     * mais próxima: 45 dias contam como 30.
     *
     * @return array<string, float>
     */
    private function fuzzify(string $variable, float $value): array
    {
        ['min' => $min, 'max' => $max, 'terms' => $terms] = self::VARIABLES[$variable];
        $value = max($min, min($max, $value));

        return array_map(fn (array $points): float => $this->degree($value, $points), $terms);
    }

    /**
     * Uma variável no formato da tela: nome, universo e a lista de termos com seus pontos.
     *
     * @return array{name: string, min: int, max: int, terms: list<array{name: string, points: array{0: int, 1: int, 2: int, 3: int}}>}
     */
    private function variable(string $name): array
    {
        $terms = [];

        foreach (self::VARIABLES[$name]['terms'] as $term => $points) {
            $terms[] = ['name' => $term, 'points' => $points];
        }

        return ['name' => $name, 'min' => self::VARIABLES[$name]['min'], 'max' => self::VARIABLES[$name]['max'], 'terms' => $terms];
    }
}
