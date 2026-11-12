<?php

namespace App\Http\Controllers;

use App\Services\ReviewPriorityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewPriorityController extends Controller
{
    public function __construct(private ReviewPriorityService $reviewPriority) {}

    /**
     * O sistema fuzzy (variáveis e regras) e, para cada tópico praticado, a inferência passo a passo.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'system' => $this->reviewPriority->describe(),
            'topics' => $this->reviewPriority->forUser($request->user()->id, withExplanation: true),
        ]);
    }
}
