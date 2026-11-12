<?php

namespace App\Http\Controllers;

use App\Services\PerformanceService;
use Illuminate\Http\JsonResponse;

class PerformanceController extends Controller
{
    public function __construct(private PerformanceService $performanceService) {}

    public function index(): JsonResponse
    {
        $userId = auth()->id();

        return response()->json([
            'accuracy_over_time' => $this->performanceService->getAccuracyOverTime($userId),
            'attention_areas' => $this->performanceService->getAttentionAreas($userId),
            'summary' => $this->performanceService->getSummary($userId),
        ]);
    }
}
