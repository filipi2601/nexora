<?php

namespace App\Policies;

use App\Models\Material;
use App\Models\User;

class MaterialPolicy
{
    public function view(User $user, Material $material): bool
    {
        return $material->user_id === $user->id;
    }

    public function delete(User $user, Material $material): bool
    {
        return $this->view($user, $material);
    }

    public function reprocess(User $user, Material $material): bool
    {
        return $this->view($user, $material);
    }
}
