<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Felipe Almeida',
                'email' => 'felipe@estudante.com',
                'password' => Hash::make('password123'),
                'avatar_url' => null,
                'current_streak' => 14,
                'last_study_date' => '2026-08-13',
                'study_reminder_time' => '19:00:00',
                'study_reminder_enabled' => true,
            ],
            [
                'name' => 'Maria Souza',
                'email' => 'maria@estudante.com',
                'password' => Hash::make('password123'),
                'avatar_url' => null,
                'current_streak' => 8,
                'last_study_date' => '2026-08-12',
                'study_reminder_time' => '20:30:00',
                'study_reminder_enabled' => true,
            ],
            [
                'name' => 'Lucas Ribeiro',
                'email' => 'lucas@estudante.com',
                'password' => Hash::make('password123'),
                'avatar_url' => null,
                'current_streak' => 3,
                'last_study_date' => '2026-08-10',
                'study_reminder_time' => '18:00:00',
                'study_reminder_enabled' => false,
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user,
            );
        }
    }
}
