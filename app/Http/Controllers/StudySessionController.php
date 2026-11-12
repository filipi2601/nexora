<?php

namespace App\Http\Controllers;

use App\Models\StudySession;
use App\Models\Subject;
use App\Services\StudySessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudySessionController extends Controller
{
    public function __construct(private StudySessionService $studySessionService) {}

    public function start(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject_id' => ['nullable', 'integer'],
            'flashcard_count' => ['sometimes', 'integer', 'min:0', 'max:20'],
            'question_count' => ['sometimes', 'integer', 'min:0', 'max:20'],
        ]);

        $subject = isset($validated['subject_id'])
            ? Subject::query()->whereKey($validated['subject_id'])->where('user_id', $request->user()->id)->firstOrFail()
            : null;

        return response()->json($this->studySessionService->start(
            $request->user()->id,
            $subject,
            $validated['flashcard_count'] ?? 5,
            $validated['question_count'] ?? 5,
        ), 201);
    }

    public function answerQuestion(Request $request, StudySession $studySession, int $questionId): JsonResponse
    {
        $this->authorizeSession($request, $studySession);

        $validated = $request->validate([
            'selected_option_id' => ['required', 'integer', 'exists:question_options,id'],
        ]);

        return response()->json([
            'is_correct' => $this->studySessionService->answerQuestion(
                $studySession,
                $questionId,
                $validated['selected_option_id'],
            ),
        ]);
    }

    public function reviewFlashcard(Request $request, StudySession $studySession, int $flashcardId): JsonResponse
    {
        $this->authorizeSession($request, $studySession);

        $validated = $request->validate([
            'rating' => ['required', 'in:again,hard,good,easy'],
        ]);

        $this->studySessionService->reviewFlashcard($studySession, $flashcardId, $validated['rating']);

        return response()->json(['message' => 'Revisão registrada com sucesso.']);
    }

    public function finish(Request $request, StudySession $studySession): JsonResponse
    {
        $this->authorizeSession($request, $studySession);

        return response()->json(['session' => $this->studySessionService->finish($studySession)]);
    }

    private function authorizeSession(Request $request, StudySession $studySession): void
    {
        abort_unless($studySession->user_id === $request->user()->id, 404);
    }
}
