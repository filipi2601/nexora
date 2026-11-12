<?php

namespace App\Services;

use App\Models\FlashcardReview;
use App\Models\QuestionAttempt;
use App\Models\StudySession;
use Carbon\Carbon;

class PerformanceService
{
    public function __construct(private ReviewPriorityService $reviewPriority) {}

    /**
     * Taxa de acerto por dia, últimos N dias — alimenta o gráfico de linha.
     */
    public function getAccuracyOverTime(int $userId, int $days = 30): array
    {
        $since = Carbon::now()->subDays($days)->startOfDay();

        $rows = QuestionAttempt::query()->join('questions', 'questions.id', '=', 'question_attempts.question_id')->join('subjects', 'subjects.id', '=', 'questions.subject_id')->where('subjects.user_id', $userId)->where('question_attempts.answered_at', '>=', $since)->selectRaw('DATE(question_attempts.answered_at) as date, COUNT(*) as total, SUM(question_attempts.is_correct) as correct')->groupBy('date')->orderBy('date')->get();

        return $rows
            ->map(
                fn ($row) => [
                    'd' => Carbon::parse($row->date)->format('d/m'),
                    'v' => $row->total > 0 ? (int) round(($row->correct / $row->total) * 100) : 0,
                ],
            )
            ->values()
            ->all();
    }

    /**
     * Áreas de atenção: os tópicos com maior prioridade de revisão, calculada por lógica fuzzy
     * (ReviewPriorityService). A cor vem do termo de prioridade, não de cortes fixos de acerto.
     */
    public function getAttentionAreas(int $userId, int $limit = 3): array
    {
        return $this->reviewPriority->forUser($userId)
            ->take($limit)
            ->map(fn (array $topic): array => [
                'topic_id' => $topic['topic_id'],
                'name' => $topic['topic'],
                'subject' => $topic['subject'],
                'percent' => (int) round($topic['accuracy']),
                'priority' => $topic['priority'],
                'label' => $topic['label'],
                'color' => match ($topic['label']) {
                    'alta' => 'bg-red-500',
                    'media' => 'bg-amber-400',
                    default => 'bg-emerald-500',
                },
            ])
            ->values()
            ->all();
    }

    // resumo: tempo de estudo, total de questões respondidas, total de revisões de flashcard
    public function getSummary(int $userId): array
    {
        $studySeconds = StudySession::where('user_id', $userId)->sum('duration_seconds');
        $questionsCount = QuestionAttempt::query()->join('questions', 'questions.id', '=', 'question_attempts.question_id')->join('subjects', 'subjects.id', '=', 'questions.subject_id')->where('subjects.user_id', $userId)->count();
        $flashcardsCount = FlashcardReview::where('user_id', $userId)->count();

        return [
            'study_time' => $this->formatDuration($studySeconds),
            'questions' => $questionsCount,
            'flashcards' => $flashcardsCount,
        ];
    }

    public function getWeekStudyTime(int $userId): string
    {
        $seconds = StudySession::where('user_id', $userId)
            ->where('finished_at', '>=', now()->startOfWeek())
            ->sum('duration_seconds');

        return $this->formatDuration($seconds);
    }

    protected function formatDuration(int $seconds): string
    {
        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);

        if ($hours === 0) {
            return "{$minutes}min";
        }

        return "{$hours}h {$minutes}min";
    }

    /**
     * É uma medida de desempenho, não de prioridade: o que revisar primeiro quem decide é a
     * lógica fuzzy (ReviewPriorityService); esta taxa mostra quanto o aluno acerta.
     */
    public function getOverallMastery(int $userId): ?int
    {
        $row = QuestionAttempt::query()
            ->join('questions', 'questions.id', '=', 'question_attempts.question_id')
            ->join('subjects', 'subjects.id', '=', 'questions.subject_id')
            ->where('subjects.user_id', $userId)
            ->selectRaw('COUNT(*) as total, SUM(question_attempts.is_correct) as correct')
            ->first();

        if ((int) $row->total === 0) {
            return null;
        }

        return (int) round(($row->correct / $row->total) * 100);
    }
}
