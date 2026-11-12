<?php

namespace App\Services;

use App\Jobs\GenerateTopics;
use App\Jobs\ProcessMaterial;
use App\Models\Material;
use App\Models\Subject;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MaterialService
{
    public function __construct(protected FileService $fileService) {}

    public function upload(UploadedFile $file, int $userId, ?int $subjectId = null): Material
    {
        $subject = null;

        if ($subjectId !== null) {
            $subject = Subject::query()->where('id', $subjectId)->where('user_id', $userId)->first();

            if (! $subject) {
                throw ValidationException::withMessages([
                    'subject_id' => 'A disciplina selecionada não pertence ao usuário.',
                ]);
            }
        }

        $path = $file->store('library', 'public');

        $material = Material::create([
            'user_id' => $userId,
            'subject_id' => $subject?->id,
            'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'original_name' => $file->getClientOriginalName(),
            'storage_path' => $path,
            'mime_type' => $file->getMimeType(),
            'status' => 'pending',
            'uploaded_at' => now(),
        ]);

        ProcessMaterial::dispatch($material);

        if ($subject) {
            $subject->update([
                'status' => 'pending',
            ]);

            $this->regenerateTopicsWhenSafe($subject);
        }

        return $material;
    }

    public function reprocess(Material $material): Material
    {
        $material->update(['status' => 'pending']);

        ProcessMaterial::dispatch($material);

        $subject = $material->subject;

        if ($subject) {
            $subject->update(['status' => 'pending']);

            $this->regenerateTopicsWhenSafe($subject);
        }

        return $material;
    }

    protected function regenerateTopicsWhenSafe(Subject $subject): void
    {
        if ($subject->hasDependentContent()) {
            return;
        }

        GenerateTopics::dispatch($subject);
    }

    public function getMaterials(int $userId)
    {

        return Material::query()->where('user_id', $userId)->with('subject')->latest('uploaded_at')->get();
    }

    public function process(Material $material): void
    {
        $material->update([
            'status' => 'processing',
        ]);
        $filePath = Storage::disk('public')->path($material->storage_path);

        $text = $this->fileService->extractTextFromFile($filePath, $material->mime_type, $material->user);

        $summary = $this->fileService->generateSummary($text, $material->user);

        $material->update([
            'extracted_text' => $text,
            'ai_summary' => $summary,
            'status' => 'ready',
        ]);
    }
}
