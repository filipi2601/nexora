<?php

namespace App\Policies;

use App\Models\Subject;
use App\Models\User;

class SubjectPolicy
{
    public function view(User $user, Subject $subject): bool
    {
        return $this->owns($user, $subject);
    }

    public function update(User $user, Subject $subject): bool
    {
        return $this->owns($user, $subject);
    }

    public function delete(User $user, Subject $subject): bool
    {
        return $this->owns($user, $subject);
    }

    protected function owns(User $user, Subject $subject): bool
    {
        return $subject->user_id === $user->id;
    }
}
