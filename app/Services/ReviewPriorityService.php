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
 */
class ReviewPriorityService
{
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

    public const RULES = [
        'baixo' => ['recente' => 'media', 'media' => 'alta', 'antiga' => 'alta'],
        'medio' => ['recente' => 'baixa', 'media' => 'media', 'antiga' => 'alta'],
        'alto' => ['recente' => 'baixa', 'media' => 'baixa', 'antiga' => 'media'],
    ];

    public function evaluate(float $accuracy, float $daysSinceLastAttempt): array
    {
        $fuzzified = [
            'acerto' => $this->fuzzify('acerto', $accuracy),
            'recencia' => $this->fuzzify('recencia', $daysSinceLastAttempt),
        ];

        $rules = [];
        $activation = ['baixa' => 0.0, 'media' => 0.0, 'alta' => 0.0];

        foreach (self::RULES as $accuracyTerm => $row) {
            foreach ($row as $recencyTerm => $priorityTerm) {
                $strength = min($fuzzified['acerto'][$accuracyTerm], $fuzzified['recencia'][$recencyTerm]);
                $rules[] = ['acerto' => $accuracyTerm, 'recencia' => $recencyTerm, 'prioridade' => $priorityTerm, 'strength' => $strength];
                $activation[$priorityTerm] = max($activation[$priorityTerm], $strength);
            }
        }

        $aggregated = [];

        foreach (range(0, 100) as $z) {
            $degree = 0.0;

            foreach ($activation as $term => $strength) {
                $degree = max($degree, min($strength, $this->degree($z, self::VARIABLES['prioridade']['terms'][$term])));
            }

            $aggregated[] = ['z' => $z, 'degree' => $degree];
        }

        $weighted = array_sum(array_map(fn(array $point): float => $point['z'] * $point['degree'], $aggregated));
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

    private function degree(float $x, array $points): float
    {
        [$a, $b, $c, $d] = $points;
        if ($x >= $b && $x <= $c) return 1.0;
        if ($x > $a && $x < $b) return ($x - $a) / ($b - $a);
        if ($x > $c && $x < $d) return ($d - $x) / ($d - $c);
        return 0.0;
    }

    private function fuzzify(string $variable, float $value): array
    {
        ['min' => $min, 'max' => $max, 'terms' => $terms] = self::VARIABLES[$variable];
        $value = max($min, min($max, $value));

        return array_map(fn(array $points): float => $this->degree($value, $points), $terms);
    }

    private function variable(string $name): array
    {
        $terms = [];

        foreach (self::VARIABLES[$name]['terms'] as $term => $points) {
            $terms[] = ['name' => $term, 'points' => $points];
        }

        return ['name' => $name, 'min' => self::VARIABLES[$name]['min'], 'max' => self::VARIABLES[$name]['max'], 'terms' => $terms];
    }
}
