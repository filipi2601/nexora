<?php

namespace App\Policies;

use App\Models\TutorConversation;
use App\Models\User;

class TutorConversationPolicy
{
    public function view(User $user, TutorConversation $conversation): bool
    {
        return $conversation->user_id === $user->id;
    }

    public function update(User $user, TutorConversation $conversation): bool
    {
        return $this->view($user, $conversation);
    }

    public function delete(User $user, TutorConversation $conversation): bool
    {
        return $this->view($user, $conversation);
    }
}
