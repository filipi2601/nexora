<?php

namespace Database\Seeders;

use App\Models\Flashcard;
use App\Models\Subject;
use App\Models\Topic;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FlashcardSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $seedData = [
            'redes-e-sistemas-distribuidos' => [
                'modelo-osi' => [
                    [
                        'front' => 'O que o modelo OSI representa?',
                        'back' => 'Um modelo de referência em sete camadas para padronizar a comunicação em redes.',
                    ],
                    [
                        'front' => 'Qual camada do OSI trata do endereçamento lógico?',
                        'back' => 'A camada de Rede.',
                    ],
                ],
                'tcp' => [
                    [
                        'front' => 'Qual a principal característica do TCP?',
                        'back' => 'Ele é orientado à conexão e garante entrega confiável dos dados.',
                    ],
                ],
                'udp' => [
                    [
                        'front' => 'Quando o UDP costuma ser preferido?',
                        'back' => 'Em cenários que priorizam velocidade e baixa latência, mesmo sem garantia de entrega.',
                    ],
                ],
            ],
            'desenvolvimento-de-jogos-digitais' => [
                'motores-de-jogos' => [
                    [
                        'front' => 'Qual é a função de um motor de jogos?',
                        'back' => 'Fornecer recursos para renderização, física, áudio, entrada e ciclo principal do jogo.',
                    ],
                ],
                'game-design' => [
                    [
                        'front' => 'O que define game design?',
                        'back' => 'O planejamento das regras, mecânicas e experiência do jogador.',
                    ],
                ],
            ],
            'inteligencia-artificial' => [
                'machine-learning' => [
                    [
                        'front' => 'O que é machine learning?',
                        'back' => 'É um campo da IA que treina modelos a partir de dados para identificar padrões e fazer previsões.',
                    ],
                ],
                'deep-learning' => [
                    [
                        'front' => 'O que caracteriza deep learning?',
                        'back' => 'O uso de redes neurais profundas com várias camadas de processamento.',
                    ],
                ],
            ],
        ];

        foreach ($seedData as $subjectSlug => $topics) {
            $subject = Subject::query()->where('slug', $subjectSlug)->first();

            if (! $subject) {
                continue;
            }

            foreach ($topics as $topicSlug => $flashcards) {
                $topic = Topic::query()
                    ->where('subject_id', $subject->id)
                    ->where('slug', $topicSlug)
                    ->first();

                if (! $topic) {
                    continue;
                }

                foreach ($flashcards as $flashcard) {
                    Flashcard::updateOrCreate(
                        [
                            'subject_id' => $subject->id,
                            'topic_id' => $topic->id,
                            'front' => $flashcard['front'],
                        ],
                        [
                            'back' => $flashcard['back'],
                        ]
                    );
                }
            }
        }
    }
}
