<?php

namespace App\Policies;

use App\Models\Flashcard;
use App\Models\User;

class FlashcardPolicy
{
    public function view(User $user, Flashcard $flashcard): bool
    {
        return $flashcard->subject->user_id === $user->id;
    }

    public function update(User $user, Flashcard $flashcard): bool
    {
        return $this->view($user, $flashcard);
    }

    public function delete(User $user, Flashcard $flashcard): bool
    {
        return $this->view($user, $flashcard);
    }
}
