<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\TutorConversation;
use App\Services\SubjectService;
use App\Services\TutorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TutorController extends Controller
{
    public function __construct(
        private TutorService $tutorService,
        private SubjectService $subjectService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $subjectId = $request->query('subject_id');
        $conversations = $this->tutorService->getConversations(auth()->id(), $subjectId);
        $subjects = $this->subjectService->getSubjectsWithTopics(auth()->id());

        return response()->json([
            'conversations' => $conversations,
            'subjects' => $subjects,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $conversation = TutorConversation::where('id', $id)->firstOrFail();

        $this->authorize('view', $conversation);

        $conversation = $this->tutorService->getConversation($id, auth()->id());

        if (! $conversation) {
            return response()->json(['message' => 'Conversa não encontrada.'], 404);
        }

        return response()->json($conversation);
    }

    public function start(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject_id' => [
                'required',
                'integer',
                Rule::exists('subjects', 'id')->where('user_id', $request->user()->id),
            ],
            'topic_id' => [
                'nullable',
                'integer',
                Rule::exists('topics', 'id')->whereIn(
                    'subject_id',
                    Subject::where('user_id', $request->user()->id)->select('id'),
                ),
            ],
        ]);

        $conversation = $this->tutorService->startConversation(
            auth()->id(),
            $validated['subject_id'],
            $validated['topic_id'] ?? null,
        );

        return response()->json($conversation, 201);
    }

    public function sendMessage(Request $request, int $id): JsonResponse
    {
        $conversation = TutorConversation::where('id', $id)
            ->with(['subject', 'topic'])
            ->firstOrFail();

        $this->authorize('update', $conversation);

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $aiMessage = $this->tutorService->sendMessage($conversation, $validated['message']);

        return response()->json($aiMessage);
    }

    public function destroy(int $id): JsonResponse
    {
        $conversation = TutorConversation::where('id', $id)->firstOrFail();

        $this->authorize('delete', $conversation);

        $conversation->delete();

        return response()->json(['message' => 'Conversa excluída com sucesso.']);
    }
}
