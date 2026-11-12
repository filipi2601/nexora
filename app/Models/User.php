<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Carbon\Carbon;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'avatar_url', 'current_streak', 'last_study_date', 'study_reminder_time', 'study_reminder_enabled'])]
#[Hidden(['password', 'remember_token', 'ai_api_key'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'current_streak' => 'integer',
            'last_study_date' => 'date',
            'study_reminder_enabled' => 'boolean',
            'study_reminder_time' => 'string',
            // A chave de IA do próprio aluno, para o provedor em ai_provider.
            'ai_api_key' => 'encrypted',
        ];
    }

    public function registerStudyDay(): void
    {
        $today = Carbon::today();

        if ($this->last_study_date?->isSameDay($today)) {
            return;
        }

        if ($this->last_study_date?->isSameDay($today->copy()->subDay())) {
            $this->increment('current_streak');
        } else {
            $this->update([
                'current_streak' => 1,
            ]);
        }

        $this->update([
            'last_study_date' => $today,
        ]);
    }
}
