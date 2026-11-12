<?php

namespace App\Services;

use App\AiProvider;
use App\Models\User;
use Laravel\Ai\Ai;

/**
 * Decide qual provedor de IA responde por um aluno
 *
 * Cada aluno tem um provedor ativo, que responde todas as tarefas, e pode salvar a chave
 * dele. Sem escolha, vale o padrão do app (AI_PROVIDER no .env). Sem chave própria, a chave
 * do .env
 */

class AiProviderService
{
    public function appDefault(): AiProvider
    {
        return AiProvider::tryFrom((string) config('ai.default')) ?? AiProvider::Gemini;
    }

    public function providerFor(?User $user = null): AiProvider
    {
        return AiProvider::tryFrom((string) $user?->ai_provider) ?? $this->appDefault();
    }

    public function isAvailable(?User $user = null): bool
    {
        return filled($this->userKey($user))
            || filled(config("ai.providers.{$this->providerFor($user)->value}.key"));
    }

    /**
     * O provedor e o modelo para a chamada prompt() do agente, já apontando o provedor
     * para a chave do aluno, se ele salvou uma.
     *
     * O gerenciador de IA guarda as instâncias dos provedores, então a instância guardada é
     * descartada para ser recriada com a chave nova.
     *
     * @return array{provider: string, model: string|null}
     */
    public function promptOptions(?User $user = null): array
    {
        $provider = $this->providerFor($user);
        $key = $this->userKey($user);

        if (filled($key)) {
            config(["ai.providers.{$provider->value}.key" => $key]);

            Ai::forgetInstance($provider->value);
        }

        return [
            'provider' => $provider->value,
            'model' => $provider->defaultModel(),
        ];
    }

    public function settings(?User $user = null): array
    {
        return [
            'provider' => $this->providerFor($user)->value,
            'default_provider' => $this->appDefault()->value,
            'has_user_key' => filled($this->userKey($user)),
            'providers' => array_map(fn(AiProvider $provider): array => [
                'value' => $provider->value,
                'label' => $provider->label(),
                'model' => $provider->defaultModel(),
                'has_app_key' => filled(config("ai.providers.{$provider->value}.key")),
            ], AiProvider::cases()),
        ];
    }

    private function userKey(?User $user): ?string
    {
        return AiProvider::tryFrom((string) $user?->ai_provider) ? $user->ai_api_key : null;
    }
}
