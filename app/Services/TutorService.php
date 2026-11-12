<?php

namespace App\Services;

use App\Models\TutorConversation;
use App\Models\TutorMessage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

use function Laravel\Ai\agent;

class TutorService
{
    protected const HISTORY_LIMIT = 20;

    public function __construct(private AiProviderService $aiProviderService) {}

    public function getConversations(int $userId, ?int $subjectId = null): Collection
    {
        $query = TutorConversation::where('user_id', $userId)
            ->with(['subject:id,name,slug', 'topic:id,name'])
            ->orderByDesc('last_message_at');

        if ($subjectId) {
            $query->where('subject_id', $subjectId);
        }

        return $query->get();
    }

    public function getConversation(int $conversationId, int $userId): ?TutorConversation
    {
        return TutorConversation::where('id', $conversationId)
            ->where('user_id', $userId)
            ->with(['subject', 'topic', 'messages'])
            ->first();
    }

    public function startConversation(int $userId, int $subjectId, ?int $topicId = null): TutorConversation
    {
        return TutorConversation::create([
            'user_id' => $userId,
            'subject_id' => $subjectId,
            'topic_id' => $topicId,
            'last_message_at' => now(),
        ]);
    }

    public function sendMessage(TutorConversation $conversation, string $userMessage): TutorMessage
    {
        TutorMessage::create([
            'tutor_conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $userMessage,
        ]);

        // The messages() relation already orders by created_at, so chaining
        // orderByDesc() would be a no-op and the limit would keep the OLDEST
        // messages. created_at also ties within the same second, so sort by id.
        $history = $conversation->messages()
            ->reorderDesc('id')
            ->limit(self::HISTORY_LIMIT)
            ->get()
            ->sortBy('id')
            ->values();

        $context = $this->buildContext($conversation);
        $aiText = $this->requestAiReply(
            $context,
            $history,
            $this->aiProviderService->promptOptions($conversation->user),
        );

        $aiMessage = TutorMessage::create([
            'tutor_conversation_id' => $conversation->id,
            'role' => 'ai',
            'content' => $aiText,
        ]);

        $conversation->update(['last_message_at' => now()]);

        if (is_null($conversation->title)) {
            $conversation->update(['title' => Str::limit($userMessage, 50)]);
        }

        return $aiMessage;
    }

    protected function buildContext(TutorConversation $conversation): string
    {
        $subject = $conversation->subject;

        $materialsContext = $subject->materials()
            ->whereNotNull('ai_summary')
            ->get()
            ->map(fn ($m) => "## {$m->title}\n\n{$m->ai_summary}")
            ->implode("\n\n---\n\n");

        $focus = '';
        if ($conversation->topic_id) {
            $topic = $conversation->topic;
            $focus = "\n\nO aluno está estudando especificamente o tópico \"{$topic->name}\" agora. "
                .'Priorize respostas relacionadas a esse tópico, mas use o contexto da disciplina '
                .'inteira se a pergunta do aluno for além dele.';
        }

        return "Disciplina: {$subject->name}\n\nConteúdo da disciplina:\n{$materialsContext}{$focus}";
    }

    protected function requestAiReply(string $context, Collection $history, array $options): string
    {
        $conversationText = $history->map(function ($m) {
            $speaker = $m->role === 'ai' ? 'Tutor' : 'Aluno';

            return "{$speaker}: {$m->content}";
        })->implode("\n\n");

        $response = agent(
            instructions: <<<PROMPT
                Você é o Tutor IA de uma plataforma de estudos. Responda em português do Brasil,
                de forma didática, concisa e socrática — guie o raciocínio do aluno em vez de só
                entregar a resposta pronta, quando fizer sentido pedagogicamente.

                Contexto da disciplina que o aluno está estudando:
                {$context}

                Use esse contexto para responder com precisão. Se a pergunta fugir totalmente do
                escopo da disciplina, redirecione o aluno educadamente de volta ao tema.

                Abaixo está o histórico da conversa até agora. Responda à ÚLTIMA mensagem do aluno,
                levando em conta o que já foi dito antes.
            PROMPT,
        )->prompt(
            $conversationText,
            provider: $options['provider'],
            model: $options['model'],
        );

        return $response->text;
    }
}
