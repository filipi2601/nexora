<?php

namespace App\Jobs;

use App\Jobs\Concerns\ParsesAiJson;
use App\Models\Topic;
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

class GenerateFlashcards implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, ParsesAiJson, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public int $uniqueFor = 600;

    public function uniqueId(): string
    {
        return (string) $this->topic->id;
    }

    public function __construct(
        protected Topic $topic,
        protected int $count = 3,
    ) {}

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function handle(AiProviderService $aiProviderService): void
    {
        $options = $aiProviderService->promptOptions($this->topic->subject->user);

        $response = agent(
            instructions: <<<'PROMPT'
                Você cria flashcards de estudo (pergunta/resposta) a partir de um tópico.

                Regras:
                - "front" deve ser uma pergunta clara e objetiva, sem ambiguidade.
                - "back" deve ser a resposta, curta e direta (1-3 frases) — não copie o texto
                  fonte literalmente, explique com suas próprias palavras.
                - Não repita conceitos entre os flashcards gerados; cada um deve cobrir um
                  aspecto diferente do tópico.
                - Responda APENAS com um JSON válido: um array de objetos com "front" e "back".
                - NÃO envolva a resposta em blocos de código markdown (```).
            PROMPT,
        )->prompt(
            <<<PROMPT
                Disciplina: {$this->topic->subject->name}
                Tópico: {$this->topic->name}
                Descrição do tópico: {$this->topic->description}

                Gere {$this->count} flashcards sobre esse tópico.
            PROMPT,
            provider: $options['provider'],
            model: $options['model'],
        );

        $cards = $this->decodeAiJson($response->text, 'flashcards');

        DB::transaction(function () use ($cards) {
            foreach ($cards as $card) {
                $this->topic->flashcards()->create([
                    'subject_id' => $this->topic->subject_id,
                    'front' => $card['front'],
                    'back' => $card['back'],
                ]);
            }
        });

        $this->topic->update(['flashcards_status' => 'ready']);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Falha ao gerar flashcards', [
            'topic_id' => $this->topic->id,
            'error' => $exception->getMessage(),
        ]);

        $this->topic->update([
            'flashcards_status' => 'failed',
            'flashcards_error' => app(AiFailureMessageService::class)->messageFor($exception),
        ]);
    }
}
