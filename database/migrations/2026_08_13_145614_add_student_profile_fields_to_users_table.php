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
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_url')->nullable()->after('password');
            $table->unsignedInteger('current_streak')->default(0)->after('avatar_url');
            $table->date('last_study_date')->nullable()->after('current_streak');
            $table->time('study_reminder_time')->nullable()->after('last_study_date');
            $table->boolean('study_reminder_enabled')->default(true)->after('study_reminder_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar_url',
                'current_streak',
                'last_study_date',
                'study_reminder_time',
                'study_reminder_enabled',
            ]);
        });
    }
};
