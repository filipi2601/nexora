<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudySession extends Model
{
    protected $fillable = [
        'user_id', 'subject_id', 'type', 'items', 'started_at', 'finished_at',
        'duration_seconds', 'items_count', 'answered_count', 'questions_answered',
        'flashcards_reviewed', 'correct_answers',
    ];

    protected function casts(): array
    {
        return ['items' => 'array', 'started_at' => 'datetime', 'finished_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
