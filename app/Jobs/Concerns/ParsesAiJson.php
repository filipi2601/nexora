<?php

namespace App\Jobs\Concerns;

use Illuminate\Support\Facades\Log;
use JsonException;

trait ParsesAiJson
{
    protected function decodeAiJson(string $raw, string $what): array
    {
        $json = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($raw));

        try {
            $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            Log::error("JSON inválido da IA ({$what})", ['raw' => $raw, 'json_error' => $exception->getMessage()]);

            throw new JsonException("IA retornou JSON inválido: {$exception->getMessage()}", 0, $exception);
        }

        if (! is_array($decoded)) {
            Log::error("JSON da IA não é uma lista ({$what})", ['raw' => $raw]);

            throw new JsonException('IA retornou JSON que não é uma lista nem um objeto.');
        }

        return $decoded;
    }
}
