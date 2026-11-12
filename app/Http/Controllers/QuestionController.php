<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateQuestions;
use App\Models\Question;
use App\Models\Subject;
use App\Services\QuestionService;
use App\Services\SubjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function __construct(private QuestionService $questionService, private SubjectService $subjectService) {}

    public function recommended()
    {
        return $this->questionService->getRecommended(auth()->id());
    }

    public function wrong()
    {
        return $this->questionService->getRecentlyWrong(auth()->id());
    }

    public function bySubject(string $slug)
    {
        $subject = $this->subjectService->getSubject($slug, auth()->id());
        $questions = $this->questionService->getBySubject($slug, auth()->id());

        return response()->json([
            'subject' => $subject,
            'questions' => $questions,
        ]);
    }

    public function answer(Request $request, Question $question): JsonResponse
    {
        $this->authorize('answer', $question);

        $validated = $request->validate([
            'selected_option_id' => ['required', 'integer', 'exists:question_options,id'],
        ]);

        $this->questionService->answer($question, $validated['selected_option_id'], auth()->id());

        return response()->json([
            'message' => 'Resposta registrada com sucesso.',
        ]);
    }

    public function delete(Question $question): JsonResponse
    {
        $this->authorize('delete', $question);

        $question->delete();

        return response()->json([
            'message' => 'Questão excluída com sucesso.',
        ]);
    }

    public function generate(Request $request, string $slug): JsonResponse
    {
        $subject = Subject::where('slug', $slug)->where('user_id', auth()->id())->first();

        if (! $subject) {
            return response()->json(['message' => 'Disciplina não encontrada.'], 404);
        }

        $subject->update(['questions_status' => 'processing']);
        GenerateQuestions::dispatch($subject, count: 5);

        return response()->json([
            'message' => 'Geração de questões iniciada.',
            'questions_status' => 'processing',
        ], 202);
    }
}
