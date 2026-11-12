<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(UserSeeder::class);
        // $this->call(SubjectSeeder::class);
        // $this->call(TopicSeeder::class);
        // $this->call(FlashcardSeeder::class);
        // $this->call(QuestionSeeder::class);
        // $this->call(FlashcardReviewSeeder::class);
        // $this->call(QuestionAttemptSeeder::class);
    }
}
