<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Topic;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TopicSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $seedData = [
            'redes-e-sistemas-distribuidos' => [
                [
                    'name' => 'Modelo OSI',
                    'description' => 'Estrutura em camadas da comunicação em rede.',
                    'children' => ['Camadas', 'Protocolos'],
                ],
                [
                    'name' => 'TCP/IP',
                    'description' => 'Pilhas de protocolos usados na internet.',
                    'children' => ['TCP', 'UDP'],
                ],
                [
                    'name' => 'Ethernet',
                    'description' => 'Acesso ao meio e comunicação local.',
                    'children' => ['MAC', 'ARP'],
                ],
            ],
            'desenvolvimento-de-jogos-digitais' => [
                [
                    'name' => 'Motores de Jogos',
                    'description' => 'Fundamentos de renderização e ciclo de jogo.',
                    'children' => ['Unity', 'Unreal'],
                ],
                [
                    'name' => 'Game Design',
                    'description' => 'Estratégias de jogabilidade e experiência.',
                    'children' => ['Mechanics', 'Níveis'],
                ],
                [
                    'name' => 'Multiplayer',
                    'description' => 'Arquiteturas colaborativas e sincronização.',
                    'children' => ['Cliente/Servidor', 'P2P'],
                ],
            ],
            'sociologia-da-responsabilidade-social' => [
                [
                    'name' => 'Teoria Social',
                    'description' => 'Conceitos fundamentais sobre ação e sociedade.',
                    'children' => ['Estrutura Social', 'Agência Social'],
                ],
                [
                    'name' => 'Responsabilidade',
                    'description' => 'Impacto social e ética.',
                    'children' => ['Cidadania', 'Responsabilidade Coletiva'],
                ],
                [
                    'name' => 'Desigualdades',
                    'description' => 'Fatores sociais e exclusão.',
                    'children' => ['Classe', 'Gênero'],
                ],
            ],
            'inteligencia-artificial' => [
                [
                    'name' => 'Machine Learning',
                    'description' => 'Modelos probabilísticos e aprendizagem.',
                    'children' => ['Supervisionado', 'Não supervisionado'],
                ],
                [
                    'name' => 'Deep Learning',
                    'description' => 'Redes neurais profundas.',
                    'children' => ['CNN', 'RNN'],
                ],
                [
                    'name' => 'Ética em IA',
                    'description' => 'Riscos e diretrizes.',
                    'children' => ['Bias', 'Transparência'],
                ],
            ],
            'processamento-de-imagens-e-sinais' => [
                [
                    'name' => 'Imagens',
                    'description' => 'Representação e análise visual.',
                    'children' => ['Pixels', 'Filtragem'],
                ],
                [
                    'name' => 'Sinais',
                    'description' => 'Estrutura e processamento temporal.',
                    'children' => ['Fourier', 'Amplitude'],
                ],
                [
                    'name' => 'Aplicações',
                    'description' => 'Uso prático em visão e sensores.',
                    'children' => ['Reconhecimento', 'Compressão'],
                ],
            ],
        ];

        foreach ($seedData as $slug => $topics) {
            $subject = Subject::where('slug', $slug)->first();

            if (! $subject) {
                continue;
            }

            foreach ($topics as $index => $topicData) {
                $parent = Topic::firstOrCreate(
                    [
                        'subject_id' => $subject->id,
                        'parent_id' => null,
                        'name' => $topicData['name'],
                        'slug' => Str::slug($topicData['name']),
                    ],
                    [
                        'order' => $index,
                        'depth' => 0,
                        'description' => $topicData['description'],
                    ]
                );

                foreach ($topicData['children'] ?? [] as $childIndex => $childName) {
                    Topic::firstOrCreate(
                        [
                            'subject_id' => $subject->id,
                            'parent_id' => $parent->id,
                            'name' => $childName,
                            'slug' => Str::slug($childName),
                        ],
                        [
                            'order' => $childIndex,
                            'depth' => 1,
                            'description' => 'Tópico gerado automaticamente a partir do processamento da disciplina.',
                        ]
                    );
                }
            }
        }
    }
}
