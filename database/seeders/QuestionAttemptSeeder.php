<?php

namespace Database\Seeders;

use App\Models\Question;
use App\Models\QuestionAttempt;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class QuestionAttemptSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the answer history.
     *
     * These rows are destroyed together with the questions when topics are
     * regenerated, so the confirmation has to be able to report them.
     */
    public function run(): void
    {
        $user = User::first();

        if (! $user) {
            return;
        }

        foreach (Question::query()->with('options')->get() as $index => $question) {
            $options = $question->options;

            if ($options->isEmpty()) {
                continue;
            }

            $correct = $options->firstWhere('is_correct', true) ?? $options->first();
            $wrong = $options->firstWhere('is_correct', false) ?? $correct;

            // Every third question was answered wrong, so the history is not uniform.
            $selected = $index % 3 === 0 ? $wrong : $correct;

            QuestionAttempt::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'question_id' => $question->id,
                    'selected_option_id' => $selected->id,
                ],
                [
                    'is_correct' => (bool) $selected->is_correct,
                    'answered_at' => now()->subDays($index),
                ],
            );
        }
    }
}
