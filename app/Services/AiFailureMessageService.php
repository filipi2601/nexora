<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Queue\MaxAttemptsExceededException;
use JsonException;
use Laravel\Ai\Exceptions\InsufficientCreditsException;
use Laravel\Ai\Exceptions\ProviderConnectionException;
use Laravel\Ai\Exceptions\ProviderOverloadedException;
use Laravel\Ai\Exceptions\RateLimitedException;
use Throwable;

class AiFailureMessageService
{
    public function messageFor(Throwable $exception): string
    {
        return match (true) {
            $exception instanceof RateLimitedException => 'A IA recebeu pedidos demais agora. Aguarde alguns minutos e tente de novo.',
            $exception instanceof InsufficientCreditsException => 'O limite de uso do provedor de IA foi atingido. Confira sua chave de API em Configurações > IA.',
            $exception instanceof ProviderOverloadedException => 'O provedor de IA está sobrecarregado no momento. Tente novamente em instantes.',
            $exception instanceof ProviderConnectionException => 'Não foi possível conectar ao provedor de IA. Tente novamente em instantes.',
            $exception instanceof RequestException && $this->isRefusedApiKey($exception) => 'O provedor de IA recusou a chave de API. Confira sua chave em Configurações > IA.',
            $exception instanceof JsonException => 'A IA respondeu em um formato que não deu para entender. Tente gerar de novo.',
            $exception instanceof MaxAttemptsExceededException => 'A geração demorou mais do que o permitido. Tente novamente.',
            default => 'Não foi possível gerar agora. Tente novamente em instantes.',
        };
    }

    /**
     * 401 e 403 são chave recusada. O Gemini responde 400 com "API key not valid",
     * então só tratamos o 400 como chave quando o provedor menciona isso.
     */
    private function isRefusedApiKey(RequestException $exception): bool
    {
        $status = $exception->response->status();

        if (in_array($status, [401, 403], true)) {
            return true;
        }

        return $status === 400
            && str_contains(strtolower((string) $exception->response->json('error.message', '')), 'api key');
    }
}
