<?php

namespace App\Services;

use App\Models\FlashcardReview;
use App\Models\QuestionAttempt;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class SubjectService
{
    public function getSubjects(int $userId): Collection
    {
        return Subject::where('user_id', $userId)->get();
    }

    public function getSubjectsWithStats(int $userId): Collection
    {
        $subjects = Subject::where('user_id', $userId)
            ->withCount(['topics', 'flashcards', 'questions'])
            ->orderByDesc('created_at')
            ->get();

        if ($subjects->isEmpty()) {
            return $subjects;
        }

        return $this->attachProgress($subjects);
    }

    public function getSubjectsWithTopics(int $userId): Collection
    {
        return Subject::where('user_id', $userId)->with('topics')->get();
    }

    public function getSubjectsWithFlashcards(int $userId): Collection
    {
        return Subject::where('user_id', $userId)->with('flashcards')->get();
    }

    public function getSubject(string $slug, int $userId): ?Subject
    {
        $subject = Subject::where('slug', $slug)
            ->where('user_id', $userId)
            ->with('topics')
            ->withCount(['topics', 'flashcards', 'questions'])
            ->first();

        if (!$subject) return null;
        return $this->attachProgress(
            (new Subject)->newCollection([$subject])
        )->first();
    }

    protected function attachProgress(Collection $subjects): Collection
    {
        if ($subjects->isEmpty()) return $subjects;

        $subjectIds = $subjects->pluck('id');

        $reviewedBySubject = FlashcardReview::query()
            ->selectRaw('flashcards.subject_id as subject_id, COUNT(DISTINCT flashcard_reviews.flashcard_id) as reviewed')
            ->join('flashcards', 'flashcards.id', '=', 'flashcard_reviews.flashcard_id')
            ->whereIn('flashcards.subject_id', $subjectIds)
            ->groupBy('flashcards.subject_id')
            ->pluck('reviewed', 'subject_id');

        $answeredBySubject = QuestionAttempt::query()
            ->selectRaw('questions.subject_id as subject_id, COUNT(DISTINCT question_attempts.question_id) as answered')
            ->join('questions', 'questions.id', '=', 'question_attempts.question_id')
            ->whereIn('questions.subject_id', $subjectIds)
            ->groupBy('questions.subject_id')
            ->pluck('answered', 'subject_id');

        $subjects->each(function (Subject $subject) use ($reviewedBySubject, $answeredBySubject) {
            $reviewed = (int) ($reviewedBySubject[$subject->id] ?? 0);
            $answered = (int) ($answeredBySubject[$subject->id] ?? 0);
            $total = $subject->flashcards_count + $subject->questions_count;

            $subject->setAttribute('progress', $total > 0
                ? (int) round((($reviewed + $answered) / $total) * 100)
                : 0);
        });

        return $subjects;
    }

    public function addSubject(string $name, int $userId): Subject
    {
        return Subject::create([
            'name' => $name,
            'user_id' => $userId,
            'slug' => Str::slug($name),
            'status' => 'pending',
        ]);
    }

    public function getSubjectsWithQuestions(int $userId): ?Collection
    {
        return Subject::where('user_id', $userId)->with('questions.topic')->get();
    }
}
