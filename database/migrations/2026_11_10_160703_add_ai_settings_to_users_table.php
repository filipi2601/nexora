<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Um provedor de IA ativo por aluno, com a chave dele, no lugar de uma escolha de provedor
 * por tarefa (user_ai_preferences) e de uma chave por provedor (user_ai_keys).
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Null: o aluno segue o padrão do app (AI_PROVIDER no .env).
            $table->string('ai_provider', 32)->nullable();
            // Guardada criptografada (cast "encrypted" do model), nunca em texto puro.
            $table->text('ai_api_key')->nullable();
        });

        Schema::dropIfExists('user_ai_preferences');
        Schema::dropIfExists('user_ai_keys');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('user_ai_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 32);
            $table->text('api_key');
            $table->timestamps();

            $table->unique(['user_id', 'provider']);
        });

        Schema::create('user_ai_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('task', 32);
            $table->string('provider', 32);
            $table->timestamps();

            $table->unique(['user_id', 'task']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['ai_provider', 'ai_api_key']);
        });
    }
};
