<?php

namespace Database\Factories;

use App\Models\Question;
use App\Models\Subject;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Question>
 *
 * topic_id is NOT NULL, so it defaults to its own Topic. That topic belongs
 * to a different subject than the question — pass an explicit topic
 * whenever the test cares that they match.
 */
class QuestionFactory extends Factory
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
            'statement' => rtrim(fake()->sentence(6), '.').'?',
            'explanation' => fake()->sentence(8),
        ];
    }
}
