<?php

namespace App\Services;

use App\Models\Question;
use App\Models\QuestionAttempt;
use App\Models\QuestionOption;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class QuestionService
{
    public const PRACTICE_LIMIT = 10;

    public function __construct(private ReviewPriorityService $reviewPriority) {}

    /**
     * Questões recomendadas, na ordem da prioridade de revisão calculada por lógica fuzzy:
     * primeiro os tópicos de prioridade alta, depois os tópicos ainda não praticados e,
     * por fim, os demais tópicos praticados, da maior para a menor prioridade.
     *
     * @return Collection<int, Question>
     */
    public function getRecommended(int $userId): Collection
    {
        $priorities = $this->reviewPriority->forUser($userId)->keyBy('topic_id');

        $ids = $this->ownedQuestions($userId)
            ->get(['id', 'topic_id'])
            ->sortBy(fn (Question $question): array => $this->recommendationRank($priorities->get($question->topic_id), $question->id))
            ->take(self::PRACTICE_LIMIT)
            ->pluck('id');

        return $this->practiceQuery()
            ->whereKey($ids)
            ->get()
            ->sortBy(fn (Question $question): int => $ids->search($question->id))
            ->values();
    }

    public function countRecommended(int $userId): int
    {
        return min(self::PRACTICE_LIMIT, $this->ownedQuestions($userId)->count());
    }

    public function getRecentlyWrong(int $userId, int $days = 30): Collection
    {
        return $this->practiceQuery()
            ->whereHas('attempts', function ($attempts) use ($userId, $days) {
                $attempts->where('user_id', $userId)
                    ->where('is_correct', false)
                    ->where('answered_at', '>=', now()->subDays($days))
                    ->whereNotExists(function ($later) use ($userId) {
                        $later->selectRaw('1')
                            ->from('question_attempts as later_attempts')
                            ->whereColumn('later_attempts.question_id', 'question_attempts.question_id')
                            ->where('later_attempts.user_id', $userId)
                            ->where('later_attempts.is_correct', true)
                            ->whereColumn('later_attempts.answered_at', '>', 'question_attempts.answered_at');
                    });
            })
            ->limit(self::PRACTICE_LIMIT)
            ->get();
    }

    public function getBySubject(string $slug, int $userId): Collection
    {
        return $this->practiceQuery()
            ->whereHas('subject', fn ($subject) => $subject->where('slug', $slug)->where('user_id', $userId))
            ->inRandomOrder()
            ->limit(self::PRACTICE_LIMIT)
            ->get();
    }

    public function answer(Question $question, int $selectedOptionId, int $userId): QuestionAttempt
    {
        $option = QuestionOption::query()
            ->whereKey($selectedOptionId)
            ->where('question_id', $question->id)
            ->firstOrFail();

        return QuestionAttempt::create([
            'user_id' => $userId,
            'question_id' => $question->id,
            'selected_option_id' => $option->id,
            'is_correct' => $option->is_correct,
            'answered_at' => now(),
        ]);
    }

    private function practiceQuery(): Builder
    {
        return Question::query()->with([
            'options:id,question_id,text,is_correct,order',
            'subject:id,name,slug',
            'topic:id,name',
        ]);
    }

    /**
     * Questões das disciplinas do aluno, sem carregar relações (servem para contar e ordenar).
     */
    private function ownedQuestions(int $userId): Builder
    {
        return Question::query()
            ->whereHas('subject', fn ($subject) => $subject->where('user_id', $userId));
    }

    /**
     * Chave de ordenação das recomendadas: [grupo, −prioridade, id].
     * Grupo 0 = tópico de prioridade alta; 1 = tópico nunca praticado; 2 = os demais praticados.
     *
     * @param  array{priority: int, label: string}|null  $topic
     * @return array{0: int, 1: int, 2: int}
     */
    private function recommendationRank(?array $topic, int $questionId): array
    {
        return match (true) {
            $topic === null => [1, 0, $questionId],
            $topic['label'] === 'alta' => [0, -$topic['priority'], $questionId],
            default => [2, -$topic['priority'], $questionId],
        };
    }
}
