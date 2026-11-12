<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->unique(['user_id', 'slug']);
            $table->enum('status', ['pending', 'processing', 'ready', 'failed'])->default('pending');
            $table->dateTime('topics_generated_at')->nullable();
            $table->string('questions_status')->nullable();
            $table->string('topics_error')->nullable();
            $table->string('questions_error')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
