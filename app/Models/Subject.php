<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'slug', 'status', 'topics_generated_at', 'questions_status', 'topics_error', 'questions_error'];

    protected $casts = [
        'topics_generated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class);
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class);
    }

    public function flashcards(): HasMany
    {
        return $this->hasMany(Flashcard::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function dependentContentCounts(): array
    {
        return [
            'flashcards' => $this->flashcards()->count(),
            'questions' => $this->questions()->count(),
            'reviews' => FlashcardReview::whereIn(
                'flashcard_id',
                $this->flashcards()->select('id'),
            )->count(),
            'attempts' => QuestionAttempt::whereIn(
                'question_id',
                $this->questions()->select('id'),
            )->count(),
        ];
    }

    public function hasDependentContent(): bool
    {
        $counts = $this->dependentContentCounts();

        return $counts['flashcards'] > 0 || $counts['questions'] > 0;
    }
}
