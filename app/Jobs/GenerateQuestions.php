<?php

namespace App\Jobs;

use App\Jobs\Concerns\ParsesAiJson;
use App\Models\Question;
use App\Models\Subject;
use App\Services\AiFailureMessageService;
use App\Services\AiProviderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

use function Laravel\Ai\agent;

class GenerateQuestions implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, ParsesAiJson, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 180;

    public int $uniqueFor = 600;

    public function uniqueId(): string
    {
        return (string) $this->subject->id;
    }

    public function __construct(protected Subject $subject, protected int $count = 5) {}

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function handle(AiProviderService $aiProviderService): void
    {
        $topics = $this->subject
            ->topics()
            ->whereDoesntHave('children')
            ->whereNotNull('description')
            ->get(['id', 'name', 'description']);

        if ($topics->isEmpty()) {
            Log::warning('Nenhum tópico disponível para gerar questões', [
                'subject_id' => $this->subject->id,
            ]);

            $this->subject->update(['questions_status' => 'ready']);

            return;
        }

        $options = $aiProviderService->promptOptions($this->subject->user);

        $topicsContext = $topics->map(fn ($t) => "- [id: {$t->id}] {$t->name}: {$t->description}")->implode("\n");

        $response = agent(
            instructions: <<<'PROMPT'
                Você cria questões de múltipla escolha para prática de estudo, a partir de uma
                lista de tópicos de uma disciplina.

                Regras:
                - Gere a quantidade de questões solicitada no prompt, distribuídas entre os
                  tópicos fornecidos (não precisa ser uma por tópico — priorize os tópicos mais
                  relevantes/densos).
                - Cada questão deve ter "topic_id" IGUAL a um dos ids fornecidos na lista de tópicos.
                - Cada questão deve ter exatamente 4 alternativas ("options"), sendo apenas UMA
                  correta ("is_correct": true nela, false nas outras).
                - "statement" deve ser claro, objetivo, e testar compreensão do conceito — não
                  decoreba de trivialidades nem pegadinha de redação.
                - "explanation" deve explicar por que a alternativa correta está certa, em 1-3 frases.
                - Não repita o mesmo conceito em mais de uma questão.
                - Responda APENAS com um JSON válido: um array de objetos com "topic_id", "statement",
                  "explanation" e "options" (array de objetos com "text" e "is_correct").
                - NÃO envolva a resposta em blocos de código markdown (```).
            PROMPT,
        )->prompt(
            <<<PROMPT
                Disciplina: {$this->subject->name}

                Tópicos disponíveis:
                {$topicsContext}

                Gere {$this->count} questões de múltipla escolha com base nesses tópicos.
            PROMPT,
            provider: $options['provider'],
            model: $options['model'],
        );

        $questions = $this->decodeAiJson($response->text, 'questões');

        $validTopicIds = $topics->pluck('id')->all();

        DB::transaction(function () use ($questions, $validTopicIds) {
            foreach ($questions as $q) {
                if (! in_array($q['topic_id'] ?? null, $validTopicIds, true)) {
                    Log::warning('Questão da IA veio com topic_id inválido, ignorando', ['question' => $q]);

                    continue;
                }

                if (count($q['options'] ?? []) < 2) {
                    Log::warning('Questão da IA veio sem opções suficientes, ignorando', ['question' => $q]);

                    continue;
                }

                if (! collect($q['options'])->contains(fn ($o) => $o['is_correct'] ?? false)) {
                    Log::warning('Questão da IA veio sem nenhuma opção correta, ignorando', ['question' => $q]);

                    continue;
                }

                $question = Question::create([
                    'subject_id' => $this->subject->id,
                    'topic_id' => $q['topic_id'],
                    'statement' => $q['statement'],
                    'explanation' => $q['explanation'] ?? null,
                ]);

                foreach ($q['options'] as $index => $option) {
                    $question->options()->create([
                        'text' => $option['text'],
                        'is_correct' => (bool) ($option['is_correct'] ?? false),
                        'order' => $index,
                    ]);
                }
            }
        });

        $this->subject->update(['questions_status' => 'ready']);
    }

    public function failed(Throwable $exception): void
    {
        $this->subject->update([
            'questions_status' => 'failed',
            'questions_error' => app(AiFailureMessageService::class)->messageFor($exception),
        ]);

        Log::error('Falha ao gerar questões da disciplina', [
            'subject_id' => $this->subject->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
