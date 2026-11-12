<?php

namespace App\Http\Controllers;

use App\Services\FlashcardService;
use App\Services\PerformanceService;
use App\Services\QuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private PerformanceService $performanceService,
        private FlashcardService $flashcardService,
        private QuestionService $questionService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $user->only(['name', 'current_streak']),
            'overall_mastery' => $this->performanceService->getOverallMastery($user->id),
            'week_study_time' => $this->performanceService->getWeekStudyTime($user->id),
            'due_flashcards' => $this->flashcardService->getDueCount($user->id),
            'recommended_questions' => $this->questionService->countRecommended($user->id),
        ]);
    }
}
