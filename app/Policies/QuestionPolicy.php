<?php

namespace App\Policies;

use App\Models\Question;
use App\Models\User;

class QuestionPolicy
{
    public function view(User $user, Question $question): bool
    {
        return $question->subject->user_id === $user->id;
    }

    public function delete(User $user, Question $question): bool
    {
        return $this->view($user, $question);
    }

    public function answer(User $user, Question $question): bool
    {
        return $this->view($user, $question);
    }
}
