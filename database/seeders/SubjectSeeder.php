<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SubjectSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();

        if (! $user) {
            return;
        }

        $subjects = [
            'Redes e Sistemas Distribuídos',
            'Desenvolvimento de Jogos Digitais',
            'Sociologia da Responsabilidade Social',
            'Inteligência Artificial',
            'Processamento de Imagens e Sinais',
        ];

        foreach ($subjects as $index => $name) {
            Subject::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'slug' => Str::slug($name),
                ],
                [
                    'name' => $name,
                    'status' => $index === 0 ? 'ready' : 'pending',
                    'topics_generated_at' => $index === 0 ? now() : null,
                ]
            );
        }
    }
}
