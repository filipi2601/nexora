<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tutor_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_conversation_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['user', 'ai']);
            $table->text('content');
            $table->timestamps();

            $table->index(['tutor_conversation_id', 'created_at']); // pra buscar as últimas N mensagens em ordem
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tutor_messages');
    }
};
