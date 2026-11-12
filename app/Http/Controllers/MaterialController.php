<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Services\MaterialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MaterialController extends Controller
{
    public function __construct(private MaterialService $materialService) {}

    public function index(): JsonResponse
    {
        $materials = $this->materialService->getMaterials(auth()->id());

        return response()->json($materials);
    }

    public function upload(Request $request): JsonResponse
    {
        $userId = auth()->id();

        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,docx,pptx', 'max:10240'],
            'subject_id' => ['nullable', 'integer', Rule::exists('subjects', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
        ], [
            'file.mimes' => 'Envie um arquivo PDF, DOCX ou PPTX. Arquivos .doc e .ppt antigos podem ser salvos como .docx ou .pptx no Word ou no PowerPoint.',
        ]);

        $material = $this->materialService->upload($request->file('file'), $userId, $request->input('subject_id'));

        return response()->json($material, 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $material = Material::where('id', $request->route('id'))->firstOrFail();

        $this->authorize('delete', $material);

        if ($material->storage_path) {
            Storage::disk('public')->delete($material->storage_path);
        }

        $material->delete();

        return response()->json([
            'message' => 'Material excluído com sucesso.',
        ]);
    }

    public function reprocess(Request $request): JsonResponse
    {
        $material = Material::where('id', $request->route('id'))->firstOrFail();

        $this->authorize('reprocess', $material);

        if ($material->status !== 'failed') {
            return response()->json([
                'message' => 'Só é possível reprocessar materiais que falharam.',
            ], 409);
        }

        return response()->json($this->materialService->reprocess($material), 202);
    }
}
