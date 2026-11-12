<?php

namespace Database\Seeders;

use App\Models\Question;
use App\Models\Subject;
use App\Models\Topic;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $seedData = [
            'redes-e-sistemas-distribuidos' => [
                'Camadas' => [
                    [
                        'statement' => 'Qual camada do modelo OSI é responsável pelo roteamento de pacotes?',
                        'explanation' => 'A camada de Rede (Layer 3) é responsável pelo endereçamento lógico e roteamento dos pacotes.',
                        'options' => [
                            ['text' => 'Camada Física', 'is_correct' => false],
                            ['text' => 'Camada de Enlace', 'is_correct' => false],
                            ['text' => 'Camada de Rede', 'is_correct' => true],
                            ['text' => 'Camada de Transporte', 'is_correct' => false],
                        ],
                    ],
                    [
                        'statement' => 'Quantas camadas existem no modelo de referência OSI?',
                        'explanation' => 'O modelo OSI é composto por sete camadas.',
                        'options' => [
                            ['text' => '4', 'is_correct' => false],
                            ['text' => '5', 'is_correct' => false],
                            ['text' => '6', 'is_correct' => false],
                            ['text' => '7', 'is_correct' => true],
                        ],
                    ],
                ],

                'Protocolos' => [
                    [
                        'statement' => 'Qual protocolo é utilizado para resolução de endereços IP em endereços MAC em uma rede local?',
                        'explanation' => 'O ARP (Address Resolution Protocol) associa endereços IPv4 a endereços MAC.',
                        'options' => [
                            ['text' => 'DNS', 'is_correct' => false],
                            ['text' => 'ARP', 'is_correct' => true],
                            ['text' => 'DHCP', 'is_correct' => false],
                            ['text' => 'HTTP', 'is_correct' => false],
                        ],
                    ],
                ],

                'TCP' => [
                    [
                        'statement' => 'Qual característica diferencia o TCP do UDP?',
                        'explanation' => 'O TCP estabelece uma conexão e fornece mecanismos de entrega confiável e ordenada dos dados.',
                        'options' => [
                            ['text' => 'TCP não utiliza conexões', 'is_correct' => false],
                            ['text' => 'TCP oferece entrega confiável e ordenada', 'is_correct' => true],
                            ['text' => 'TCP não possui controle de fluxo', 'is_correct' => false],
                            ['text' => 'TCP é utilizado apenas para DNS', 'is_correct' => false],
                        ],
                    ],
                ],

                'UDP' => [
                    [
                        'statement' => 'Qual é uma característica do protocolo UDP?',
                        'explanation' => 'O UDP é orientado a datagramas e não estabelece uma conexão antes do envio.',
                        'options' => [
                            ['text' => 'Estabelece conexão antes da transmissão', 'is_correct' => false],
                            ['text' => 'Garante a entrega de todos os pacotes', 'is_correct' => false],
                            ['text' => 'Não estabelece conexão antes da transmissão', 'is_correct' => true],
                            ['text' => 'Realiza controle de congestionamento como o TCP', 'is_correct' => false],
                        ],
                    ],
                ],
            ],

            'inteligencia-artificial' => [
                'Supervisionado' => [
                    [
                        'statement' => 'O que caracteriza o aprendizado supervisionado?',
                        'explanation' => 'No aprendizado supervisionado, o modelo é treinado utilizando exemplos que possuem entradas e respectivas saídas esperadas.',
                        'options' => [
                            ['text' => 'Uso de dados sem qualquer rótulo', 'is_correct' => false],
                            ['text' => 'Uso de dados rotulados', 'is_correct' => true],
                            ['text' => 'Ausência completa de treinamento', 'is_correct' => false],
                            ['text' => 'Uso exclusivo de algoritmos genéticos', 'is_correct' => false],
                        ],
                    ],
                ],

                'Não supervisionado' => [
                    [
                        'statement' => 'Qual é um exemplo típico de aprendizado não supervisionado?',
                        'explanation' => 'Algoritmos de agrupamento, como K-Means, são utilizados para encontrar padrões em dados sem rótulos.',
                        'options' => [
                            ['text' => 'Classificação supervisionada', 'is_correct' => false],
                            ['text' => 'Regressão linear supervisionada', 'is_correct' => false],
                            ['text' => 'Agrupamento (clustering)', 'is_correct' => true],
                            ['text' => 'Validação manual de rótulos', 'is_correct' => false],
                        ],
                    ],
                ],

                'CNN' => [
                    [
                        'statement' => 'Para qual tipo de problema as redes neurais convolucionais (CNNs) são especialmente utilizadas?',
                        'explanation' => 'CNNs são amplamente utilizadas em tarefas relacionadas a imagens e visão computacional.',
                        'options' => [
                            ['text' => 'Processamento de imagens', 'is_correct' => true],
                            ['text' => 'Apenas processamento de texto', 'is_correct' => false],
                            ['text' => 'Somente bancos de dados relacionais', 'is_correct' => false],
                            ['text' => 'Gerenciamento de memória', 'is_correct' => false],
                        ],
                    ],
                ],
            ],

            'desenvolvimento-de-jogos-digitais' => [
                'Game Design' => [
                    [
                        'statement' => 'O que é uma mecânica de jogo?',
                        'explanation' => 'Mecânicas são regras e sistemas que definem como o jogador interage com o jogo.',
                        'options' => [
                            ['text' => 'Apenas os gráficos do jogo', 'is_correct' => false],
                            ['text' => 'As regras e sistemas de interação do jogo', 'is_correct' => true],
                            ['text' => 'Somente a trilha sonora', 'is_correct' => false],
                            ['text' => 'O hardware utilizado pelo jogador', 'is_correct' => false],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($seedData as $subjectSlug => $topics) {
            $subject = Subject::where('slug', $subjectSlug)->first();

            if (! $subject) {
                continue;
            }

            foreach ($topics as $topicName => $questions) {
                $topic = Topic::where('subject_id', $subject->id)
                    ->where('name', $topicName)
                    ->first();

                if (! $topic) {
                    continue;
                }

                foreach ($questions as $questionData) {
                    // updateOrCreate keeps the seeder idempotent: running
                    // db:seed twice used to duplicate every question and option.
                    $question = Question::updateOrCreate(
                        [
                            'subject_id' => $subject->id,
                            'topic_id' => $topic->id,
                            'statement' => $questionData['statement'],
                        ],
                        [
                            'explanation' => $questionData['explanation'] ?? null,
                        ],
                    );

                    foreach ($questionData['options'] as $order => $option) {
                        $question->options()->updateOrCreate(
                            ['order' => $order + 1],
                            [
                                'text' => $option['text'],
                                'is_correct' => $option['is_correct'],
                            ],
                        );
                    }
                }
            }
        }
    }
}
