<?php

namespace App\Http\Controllers;

use App\AiProvider;
use App\Services\AiProviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AiSettingsController extends Controller
{
    public function __construct(private AiProviderService $aiProviderService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'settings' => $this->aiProviderService->settings($request->user()),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', Rule::enum(AiProvider::class)],
            'api_key' => ['nullable', 'string', 'min:8', 'max:255'],
        ], [
            'provider.enum' => 'Escolha um dos provedores da lista.',
        ]);

        $user = $request->user();

        if (filled($validated['api_key'] ?? null)) {
            $user->ai_api_key = $validated['api_key'];
        } elseif ($user->ai_provider !== $validated['provider']) {
            $user->ai_api_key = null;
        }

        $user->ai_provider = $validated['provider'];
        $user->save();

        return response()->json([
            'message' => 'Configurações salvas.',
            'settings' => $this->aiProviderService->settings($user),
        ]);
    }

    public function destroyKey(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->forceFill(['ai_api_key' => null])->save();

        return response()->json([
            'message' => 'Chave removida.',
            'settings' => $this->aiProviderService->settings($user),
        ]);
    }
}
