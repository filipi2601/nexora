<?php

namespace Database\Factories;

use App\Models\Subject;
use App\Models\TutorConversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TutorConversation>
 */
class TutorConversationFactory extends Factory
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
            'subject_id' => Subject::factory(),
            'topic_id' => null,
            'title' => null,
            'last_message_at' => now(),
        ];
    }
}
