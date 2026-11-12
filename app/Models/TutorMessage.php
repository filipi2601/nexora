<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tutor_conversation_id
 * @property string $role
 * @property string $content
 */
class TutorMessage extends Model
{
    use HasFactory;

    protected $fillable = ['tutor_conversation_id', 'role', 'content'];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(TutorConversation::class, 'tutor_conversation_id');
    }
}
