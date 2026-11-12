<?php

namespace App\Jobs;

use App\Jobs\Concerns\ParsesAiJson;
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
use Illuminate\Support\Str;
use Throwable;

use function Laravel\Ai\agent;

class GenerateTopics implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, ParsesAiJson, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 3600;

    /**
     * Slugs already taken in this subject while the tree is being written.
     *
     * @var array<string, true>
     */
    protected array $usedSlugs = [];

    public function __construct(
        protected Subject $subject,
        protected bool $allowDestructive = false,
    ) {}

    public function allowsDestructive(): bool
    {
        return $this->allowDestructive;
    }

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function uniqueId(): string
    {
        return (string) $this->subject->id;
    }

    public function handle(AiProviderService $aiProviderService): void
    {
        if ($this->subject->hasDependentContent() && ! $this->allowDestructive) {
            $this->abortBecauseContentWouldBeLost();

            return;
        }

        try {
            $materials = $this->subject->materials()->whereNotNull('ai_summary')->get();

            if ($materials->isEmpty()) {
                $this->subject->update(['status' => 'ready']);

                return;
            }

            $content = $materials->map(fn ($m) => "## Material: {$m->title}\n\n{$m->ai_summary}")->implode("\n\n---\n\n");

            $tree = $this->requestTree(
                $content,
                $aiProviderService->promptOptions($this->subject->user),
            );

            DB::transaction(function () use ($tree) {
                $this->subject->topics()->delete();

                $this->usedSlugs = [];

                $this->saveTree($tree, parentId: null, depth: 0);
            });

            $this->subject->update([
                'status' => 'ready',
                'topics_generated_at' => now(),
            ]);
        } catch (Throwable $e) {
            // The subject stays "processing" between attempts. Marking it
            // "failed" here would show a false failure while up to two
            // retries are still pending, and it would also stop the frontend
            // from polling, leaving the UI stale even if a retry succeeds.
            // failed() owns the final "failed" state.
            throw $e;
        }
    }

    protected function abortBecauseContentWouldBeLost(): void
    {
        Log::warning('Regeneração de tópicos cancelada para não apagar conteúdo gerado.', [
            'subject_id' => $this->subject->id,
            'counts' => $this->subject->dependentContentCounts(),
        ]);

        $this->subject->update(['status' => 'ready']);
    }

    protected function requestTree(string $content, array $options): array
    {
        $response = agent(
            instructions: <<<'PROMPT'
                Você organiza o conteúdo de materiais de estudo em uma árvore de TÓPICOS DE ESTUDO
                (conceitos que o aluno precisa entender), não um índice do documento.

                Regras de conteúdo:
                - Limite a profundidade da árvore a no máximo 3 níveis.
                - Cada nó folha deve representar um CONCEITO a ser estudado, nunca uma citação
                  bibliográfica, referência, nome de autor, ou item de lista burocrática
                  (ex: "assinatura e data", "carga horária") — ignore esse tipo de conteúdo.
                - Não crie um nó para cada exemplo/aplicação citado no material — agrupe exemplos
                  semelhantes em um único nó.
                - Nomes de nós devem ter no máximo ~8 palavras.

                Cada nó deve ter também uma "description": um resumo explicativo do tópico,
                em português do Brasil, com 2 a 4 frases, escrito para o ALUNO entender o
                conceito sem precisar ler o material original. Seja didático e claro, explique
                do que se trata o tópico e por que ele é importante, mesmo que o material fonte
                seja só um título ou uma menção rápida. Nós-pai (que têm filhos) também devem ter
                uma description, resumindo o que os subtópicos abordam em conjunto.

                Formato de resposta:
                - Responda APENAS com um JSON válido, sem texto antes ou depois, sem blocos de
                  código markdown (```).
                - Formato: um array de nós. Cada nó tem "name", "description" e "children" (array,
                  pode ser vazio).
            PROMPT,
        )->prompt(
            "Gere a árvore de tópicos a partir do conteúdo de todos os materiais desta disciplina:\n\n{$content}",
            provider: $options['provider'],
            model: $options['model'],
            timeout: 3600,
        );

        return $this->decodeAiJson($response->text, 'tópicos');
    }

    /**
     * Build a slug that is unique within the subject.
     *
     * The AI can return sibling nodes with the same name, and topics.slug is
     * unique per subject, so a plain Str::slug() would abort the whole
     * transaction on a duplicate.
     */
    protected function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (isset($this->usedSlugs[$slug])) {
            $suffix++;
            $slug = $base.'-'.$suffix;
        }

        $this->usedSlugs[$slug] = true;

        return $slug;
    }

    protected function saveTree(array $nodes, ?int $parentId, int $depth): void
    {
        foreach ($nodes as $index => $node) {
            $topic = $this->subject->topics()->create([
                'parent_id' => $parentId,
                'name' => $node['name'],
                'slug' => $this->uniqueSlug($node['name']),
                'description' => $node['description'] ?? null,
                'order' => $index,
                'depth' => $depth,
            ]);

            if (! empty($node['children'])) {
                $this->saveTree($node['children'], $topic->id, $depth + 1);
            }
        }
    }

    public function failed(Throwable $exception): void
    {
        $this->subject->update([
            'status' => 'failed',
            'topics_error' => app(AiFailureMessageService::class)->messageFor($exception),
        ]);

        Log::error('Falha ao gerar tópicos da disciplina', [
            'subject_id' => $this->subject->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
