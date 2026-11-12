<?php

namespace App\Services;

use App\Models\Flashcard;
use App\Models\FlashcardReview;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class FlashcardService
{
    public function getFlashcardsToReview(int $userId, ?string $subjectSlug = null, ?int $limit = null): Collection
    {
        return $this->dueFlashcardsQuery($userId, $subjectSlug)
            ->with(['subject', 'topic'])
            ->inRandomOrder()
            ->when($limit, fn ($query) => $query->limit($limit))
            ->get();
    }

    public function getDueCount(int $userId, ?string $subjectSlug = null): int
    {
        return $this->dueFlashcardsQuery($userId, $subjectSlug)->count();
    }

    private function dueFlashcardsQuery(int $userId, ?string $subjectSlug = null): Builder
    {
        return Flashcard::query()
            ->whereHas('subject', fn ($subject) => $subject->where('user_id', $userId))
            ->where(function ($query) use ($userId) {
                $query->whereDoesntHave('reviews', fn ($reviews) => $reviews->where('user_id', $userId))
                    ->orWhereHas('reviews', fn ($reviews) => $reviews
                        ->where('user_id', $userId)
                        ->whereDate('due_date', '<=', now()));
            })
            ->when($subjectSlug, fn ($query) => $query
                ->whereHas('subject', fn ($subject) => $subject->where('slug', $subjectSlug)));
    }

    // Registra a avaliação do aluno e recalcula o estado de repetição espaçada (SM-2)
    public function reviewFlashcard(Flashcard $flashcard, int $userId, string $rating): FlashcardReview
    {
        $review = FlashcardReview::firstOrNew([
            'user_id' => $userId,
            'flashcard_id' => $flashcard->id,
        ]);

        if (! $review->exists) {
            $review->ease_factor = 2.5;
            $review->interval_days = 0;
            $review->repetitions = 0;
        }

        $quality = match ($rating) {
            'again' => 0,
            'hard' => 3,
            'good' => 4,
            'easy' => 5,
            default => throw new \InvalidArgumentException("Rating inválido: {$rating}"),
        };

        if ($quality < 3) {
            $review->repetitions = 0;
            $review->interval_days = 1;
        } else {
            $review->repetitions += 1;

            $review->interval_days = match ($review->repetitions) {
                1 => 1,
                2 => 6,
                default => (int) round($review->interval_days * $review->ease_factor),
            };
        }

        $newEase = $review->ease_factor + (0.1 - (5 - $quality) * (0.08 + (5 - $quality) * 0.02));
        $review->ease_factor = max(1.3, $newEase);

        $review->due_date = now()->addDays($review->interval_days)->toDateString();
        $review->last_reviewed_at = now();

        $review->save();

        return $review;
    }
}
