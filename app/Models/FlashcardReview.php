<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FlashcardReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'flashcard_id', 'ease_factor',
        'interval_days', 'repetitions', 'due_date', 'last_reviewed_at',
    ];

    protected $casts = [
        'due_date' => 'date',
        'last_reviewed_at' => 'datetime',
        'ease_factor' => 'float',
    ];

    public function flashcard()
    {
        return $this->belongsTo(Flashcard::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
