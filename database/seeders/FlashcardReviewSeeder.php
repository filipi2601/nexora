<?php

namespace Database\Seeders;

use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FlashcardReviewSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the spaced-repetition history.
     *
     * Without these rows the "regenerate topics" confirmation would report zero
     * reviews, hiding the fact that regenerating also destroys the student's
     * review schedule.
     */
    public function run(): void
    {
        $user = User::first();

        if (! $user) {
            return;
        }

        foreach (Flashcard::query()->get() as $index => $flashcard) {
            $reviewed = $index % 3 !== 0;

            FlashcardReview::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'flashcard_id' => $flashcard->id,
                ],
                [
                    'ease_factor' => $reviewed ? 2.6 : 2.5,
                    'interval_days' => $reviewed ? 6 : 0,
                    'repetitions' => $reviewed ? 3 : 0,
                    'due_date' => $reviewed ? now()->addDays(6)->toDateString() : now()->toDateString(),
                    'last_reviewed_at' => $reviewed ? now()->subDays(6) : null,
                ],
            );
        }
    }
}
