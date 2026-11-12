<?php

namespace Database\Factories;

use App\Models\TutorConversation;
use App\Models\TutorMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TutorMessage>
 */
class TutorMessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tutor_conversation_id' => TutorConversation::factory(),
            'role' => 'user',
            'content' => fake()->sentence(),
        ];
    }

    /**
     * Indicate that the message was sent by the tutor.
     */
    public function fromAi(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'ai',
        ]);
    }
}
