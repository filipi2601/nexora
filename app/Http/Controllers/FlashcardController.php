<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateFlashcards;
use App\Models\Flashcard;
use App\Models\Topic;
use App\Services\FlashcardService;
use App\Services\SubjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FlashcardController extends Controller
{
    public function __construct(private FlashcardService $flashcardService, private SubjectService $subjectService) {}

    public function index()
    {
        $subjects = $this->subjectService->getSubjectsWithFlashcards(auth()->id());
        $dueCount = $this->flashcardService->getDueCount(auth()->id());

        return response()->json([
            'subjects' => $subjects,
            'due_count' => $dueCount,
        ]);
    }

    public function show(string $slug)
    {
        $subject = $this->subjectService->getSubject($slug, auth()->id());

        if (! $subject) {
            return response()->json([
                'message' => 'Disciplina não encontrada.',
            ], 404);
        }

        $topics = $subject->topics()->with('flashcards')->get();

        return response()->json([
            'subject' => $subject,
            'topics' => $topics,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $flashcard = Flashcard::where('id', $request->route('id'))->with('subject')->firstOrFail();

        $this->authorize('delete', $flashcard);

        $flashcard->delete();

        return response()->json([
            'message' => 'Flashcard excluído com sucesso.',
        ]);
    }

    public function generate(Request $request, int $topicId): JsonResponse
    {
        $topic = Topic::whereHas('subject', fn ($q) => $q->where('user_id', auth()->id()))->findOrFail($topicId);

        $topic->update(['flashcards_status' => 'processing']);
        GenerateFlashcards::dispatch($topic);

        return response()->json([
            'message' => 'Geração de flashcards iniciada.',
            'flashcards_status' => 'processing',
        ], 202);
    }

    public function review(string $slug): JsonResponse
    {
        $subjectSlug = $slug !== 'todas' ? $slug : null;

        $flashcards = $this->flashcardService->getFlashcardsToReview(auth()->id(), $subjectSlug);
        $subjects = $this->subjectService->getSubjects(auth()->id());

        return response()->json([
            'flashcards' => $flashcards,
            'subjects' => $subjects,
            'slug' => $slug,
        ]);
    }

    public function submitReview(Request $request, int $flashcardId): JsonResponse
    {
        $flashcard = Flashcard::where('id', $flashcardId)->with('subject')->firstOrFail();

        $this->authorize('update', $flashcard);

        $validated = $request->validate([
            'rating' => ['required', 'in:again,hard,good,easy'],
        ]);

        $this->flashcardService->reviewFlashcard($flashcard, auth()->id(), $validated['rating']);

        return response()->json(['success' => true]);
    }
}
