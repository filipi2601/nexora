<?php

namespace Database\Factories;

use App\Models\Question;
use App\Models\QuestionAttempt;
use App\Models\QuestionOption;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuestionAttempt>
 *
 * selected_option_id is NOT NULL, so it defaults to its own QuestionOption.
 * Pass the real option when the attempt must reference its own question.
 */
class QuestionAttemptFactory extends Factory
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
            'question_id' => Question::factory(),
            'selected_option_id' => QuestionOption::factory(),
            'is_correct' => fake()->boolean(),
            'answered_at' => now(),
        ];
    }

    /**
     * Indicate the student answered correctly.
     */
    public function correct(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_correct' => true,
        ]);
    }

    /**
     * Indicate the student answered incorrectly.
     */
    public function incorrect(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_correct' => false,
        ]);
    }
}
