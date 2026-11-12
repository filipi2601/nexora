<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Material extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'subject_id', 'title', 'original_name', 'storage_path', 'mime_type', 'extracted_text', 'ai_summary', 'uploaded_at', 'status'];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    protected $appends = [
        'file_url',
    ];

    protected function fileUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => Storage::url($this->storage_path),
        );
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
