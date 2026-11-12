<?php

namespace App;

enum AiProvider: string
{
    case Gemini = 'gemini';
    case Groq = 'groq';
    case OpenAi = 'openai';

    public function label(): string
    {
        return match ($this) {
            self::Gemini => 'Google Gemini',
            self::Groq => 'Groq',
            self::OpenAi => 'OpenAI',
        };
    }

    public function defaultModel(): ?string
    {
        return match ($this) {
            self::Gemini => 'gemini-3.5-flash',
            self::Groq => 'openai/gpt-oss-120b',
            self::OpenAi => 'gpt-5.6-terra',
        };
    }
}
