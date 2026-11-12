<?php

namespace App\Jobs;

use App\Models\Material;
use App\Services\MaterialService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessMaterial implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public int $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(protected Material $material) {}

    /**
     * Execute the job.
     */
    public function handle(MaterialService $materialService): void
    {
        $materialService->process($this->material);
    }

    public function failed(Throwable $exception): void
    {
        $this->material->update([
            'status' => 'failed',
        ]);

        Log::error('Falha ao processar material', [
            'material_id' => $this->material->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
