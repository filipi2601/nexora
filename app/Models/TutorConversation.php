<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $subject_id
 * @property int|null $topic_id
 * @property string|null $title
 * @property Carbon|null $last_message_at
 */
class TutorConversation extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'subject_id', 'topic_id', 'title', 'last_message_at'];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(TutorMessage::class)->orderBy('created_at');
    }
}
