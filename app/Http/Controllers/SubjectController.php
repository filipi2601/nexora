<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateTopics;
use App\Models\Subject;
use App\Services\SubjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function __construct(private SubjectService $subjectService) {}

    public function index(): JsonResponse
    {
        $subjects = $this->subjectService->getSubjectsWithStats(auth()->id());

        return response()->json($subjects);
    }

    public function add(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);
        $name = $request->input('name');

        $subject = $this->subjectService->addSubject($name, auth()->id());

        return response()->json($subject);
    }

    public function show(string $slug): JsonResponse
    {
        $subject = $this->subjectService->getSubject($slug, auth()->id());

        if (! $subject) {
            return response()->json(['message' => 'Disciplina não encontrada.'], 404);
        }

        return response()->json($subject);
    }

    public function destroy(Request $request)
    {
        $this->findSubjectOrFail($request, 'delete')->delete();

        return response()->json([
            'message' => 'Disciplina excluída com sucesso.',
        ]);
    }

    public function regenerateTopics(Request $request): JsonResponse
    {
        $subject = $this->findSubjectOrFail($request, 'update');

        $confirmDestroy = $request->boolean('confirm_destroy');

        if (! $confirmDestroy && $subject->hasDependentContent()) {
            return response()->json([
                'message' => 'Regenerar os tópicos apaga tudo que foi gerado a partir deles: '
                    .'flashcards, questões, seu histórico de revisões e suas tentativas.',
                'requires_confirmation' => true,
                'counts' => $subject->dependentContentCounts(),
            ], 409);
        }

        $subject->update(['status' => 'processing']);
        GenerateTopics::dispatch($subject, $confirmDestroy);

        return response()->json(['message' => 'Geração de tópicos iniciada.']);
    }

    public function questions(Request $request): JsonResponse
    {
        $subject = $this->subjectService->getSubjectsWithQuestions(auth()->id());

        return response()->json($subject);
    }

    /**
     * Resolve a subject from the route and run it through the policy, so the
     * ownership rule lives in one place instead of being repeated per action.
     */
    protected function findSubjectOrFail(Request $request, string $ability): Subject
    {
        $subject = Subject::where('id', $request->route('id'))->firstOrFail();

        $this->authorize($ability, $subject);

        return $subject;
    }
}
