<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('study_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type')->default('mixed');
            $table->json('items');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->unsignedInteger('items_count')->default(0);
            $table->unsignedInteger('answered_count')->default(0);
            $table->unsignedInteger('questions_answered')->default(0);
            $table->unsignedInteger('flashcards_reviewed')->default(0);
            $table->unsignedInteger('correct_answers')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'finished_at']);
            $table->index(['subject_id', 'finished_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_sessions');
    }
};
