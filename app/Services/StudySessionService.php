<?php

namespace App\Services;

use App\Models\Flashcard;
use App\Models\Question;
use App\Models\StudySession;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudySessionService
{
    public function __construct(private FlashcardService $flashcardService, private QuestionService $questionService) {}

    public function start(int $userId, ?Subject $subject, int $flashcardCount, int $questionCount): array
    {
        $flashcards = $this->flashcardService->getFlashcardsToReview($userId, $subject?->slug, $flashcardCount)
            ->take($flashcardCount)->values();

        $questions = $this->questionsForSession($userId, $subject?->id, $questionCount);
        $itemOrder = collect()
            ->concat($flashcards->map(fn (Flashcard $card) => ['type' => 'flashcard', 'id' => $card->id]))
            ->concat($questions->map(fn (Question $question) => ['type' => 'question', 'id' => $question->id]))
            ->shuffle()->values()->all();

        $session = StudySession::create([
            'user_id' => $userId,
            'subject_id' => $subject?->id,
            'type' => 'mixed',
            'items' => $itemOrder,
            'started_at' => now(),
            'items_count' => count($itemOrder),
        ]);

        return ['session' => $session, 'items' => $this->serializeItems($flashcards, $questions, $itemOrder)];
    }

    public function answerQuestion(StudySession $session, int $questionId, int $selectedOptionId): bool
    {
        return DB::transaction(function () use ($session, $questionId, $selectedOptionId): bool {
            $session = StudySession::query()->lockForUpdate()->findOrFail($session->id);
            $this->ensureOpenAndPending($session, 'question', $questionId);

            $question = Question::query()
                ->whereKey($questionId)
                ->whereHas('subject', fn ($query) => $query->where('user_id', $session->user_id))
                ->firstOrFail();

            $attempt = $this->questionService->answer($question, $selectedOptionId, $session->user_id);
            $this->markAnswered($session, 'question', $questionId);

            $session->increment('answered_count');
            $session->increment('questions_answered');

            if ($attempt->is_correct) {
                $session->increment('correct_answers');
            }

            return $attempt->is_correct;
        });
    }

    public function reviewFlashcard(StudySession $session, int $flashcardId, string $rating): void
    {
        DB::transaction(function () use ($session, $flashcardId, $rating): void {
            $session = StudySession::query()->lockForUpdate()->findOrFail($session->id);
            $this->ensureOpenAndPending($session, 'flashcard', $flashcardId);

            $flashcard = Flashcard::query()
                ->whereKey($flashcardId)
                ->whereHas('subject', fn ($query) => $query->where('user_id', $session->user_id))
                ->firstOrFail();

            $this->flashcardService->reviewFlashcard($flashcard, $session->user_id, $rating);
            $this->markAnswered($session, 'flashcard', $flashcardId);

            $session->increment('answered_count');
            $session->increment('flashcards_reviewed');
        });
    }

    public function finish(StudySession $session): StudySession
    {
        return DB::transaction(function () use ($session): StudySession {
            $session = StudySession::query()
                ->lockForUpdate()
                ->findOrFail($session->id);

            if ($session->finished_at === null) {
                $finishedAt = now();

                $session->update([
                    'finished_at' => $finishedAt,
                    'duration_seconds' => $session->started_at->diffInSeconds($finishedAt),
                ]);

                $user = $session->user()->lockForUpdate()->firstOrFail();

                $user->registerStudyDay();
            }

            return $session->fresh();
        });
    }

    private function questionsForSession(int $userId, ?int $subjectId, int $count): Collection
    {
        return Question::query()
            ->select(['id', 'subject_id', 'topic_id', 'statement', 'explanation'])
            ->with(['options:id,question_id,text,is_correct,order', 'subject:id,name,slug'])
            ->whereHas('subject', fn ($query) => $query->where('user_id', $userId))
            ->when($subjectId, fn ($query) => $query->where('subject_id', $subjectId))
            ->where(function ($query) use ($userId): void {
                $query->whereDoesntHave('attempts', fn ($attempts) => $attempts->where('user_id', $userId))
                    ->orWhereHas('attempts', fn ($attempts) => $attempts
                        ->where('user_id', $userId)
                        ->where('is_correct', false)
                        ->where('answered_at', '>=', now()->subDays(30)));
            })
            ->inRandomOrder()
            ->limit($count)
            ->get();
    }

    private function serializeItems(Collection $flashcards, Collection $questions, array $itemOrder): array
    {
        $flashcards = $flashcards->keyBy('id');
        $questions = $questions->keyBy('id');

        return collect($itemOrder)->map(function (array $item) use ($flashcards, $questions): array {
            if ($item['type'] === 'flashcard') {
                $card = $flashcards->get($item['id']);

                return [
                    'type' => 'flashcard',
                    'id' => $card->id,
                    'front' => $card->front,
                    'back' => $card->back,
                    'subject' => $card->subject?->only(['id', 'name', 'slug']),
                ];
            }

            $question = $questions->get($item['id']);

            return [
                'type' => 'question',
                'id' => $question->id,
                'statement' => $question->statement,
                'explanation' => $question->explanation,
                'options' => $question->options->map->only(['id', 'text', 'is_correct', 'order'])->values(),
                'subject' => $question->subject?->only(['id', 'name', 'slug']),
            ];
        })->all();
    }

    private function ensureOpenAndPending(StudySession $session, string $type, int $itemId): void
    {
        $item = collect($session->items)->first(
            fn (array $item) => $item['type'] === $type && $item['id'] === $itemId
        );

        if ($session->finished_at !== null || $item === null) {
            throw ValidationException::withMessages(['session' => 'Este item não está disponível nesta sessão.']);
        }

        if ($item['answered'] ?? false) {
            throw ValidationException::withMessages(['session' => 'Este item já foi respondido nesta sessão.']);
        }
    }

    private function markAnswered(StudySession $session, string $type, int $itemId): void
    {
        $session->update([
            'items' => collect($session->items)->map(function (array $item) use ($type, $itemId): array {
                if ($item['type'] === $type && $item['id'] === $itemId) {
                    $item['answered'] = true;
                }

                return $item;
            })->all(),
        ]);
    }
}
