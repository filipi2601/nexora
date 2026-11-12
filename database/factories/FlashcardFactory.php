<?php

namespace Database\Factories;

use App\Models\Flashcard;
use App\Models\Subject;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Flashcard>
 *
 * topic_id is NOT NULL, so it defaults to its own Topic. That topic belongs
 * to a different subject than the flashcard — pass an explicit topic
 * whenever the test cares that they match.
 */
class FlashcardFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject_id' => Subject::factory(),
            'topic_id' => Topic::factory(),
            'front' => rtrim(fake()->sentence(4), '.').'?',
            'back' => fake()->paragraph(2),
        ];
    }
}
