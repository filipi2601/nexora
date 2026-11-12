<?php

namespace Database\Factories;

use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FlashcardReview>
 */
class FlashcardReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'flashcard_id' => Flashcard::factory(),
            'ease_factor' => 2.5,
            'interval_days' => 0,
            'repetitions' => 0,
            'due_date' => now()->toDateString(),
            'last_reviewed_at' => null,
        ];
    }

    /**
     * Indicate a card already scheduled to be reviewed later.
     */
    public function scheduled(int $repetitions = 3): static
    {
        return $this->state(fn (array $attributes) => [
            'ease_factor' => 2.6,
            'interval_days' => 6,
            'repetitions' => $repetitions,
            'due_date' => now()->addDays(6)->toDateString(),
            'last_reviewed_at' => now()->subDays(6),
        ]);
    }

    /**
     * Indicate a card that is overdue for review.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'due_date' => now()->subDays(3)->toDateString(),
            'last_reviewed_at' => now()->subDays(10),
        ]);
    }
}
