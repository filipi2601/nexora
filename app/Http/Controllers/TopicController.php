<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;

class TopicController extends Controller
{
    public function index(string $slug, string $topicSlug): JsonResponse
    {
        $subject = Subject::where('slug', $slug)->where('user_id', auth()->id())->firstOrFail();

        $topic = Topic::query()
            ->where('subject_id', $subject->id)
            ->where('slug', $topicSlug)
            ->with(['parent.parent.parent', 'children'])
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $topic->id,
                'slug' => $topic->slug,
                'name' => $topic->name,
                'description' => $topic->description,
                'depth' => $topic->depth,
                'order' => $topic->order,

                'parent' => $topic->parent
                    ? [
                        'id' => $topic->parent->id,
                        'slug' => $topic->parent->slug,
                        'name' => $topic->parent->name,
                    ]
                    : null,

                'ancestors' => $this->ancestorsOf($topic),

                'children' => $topic->children->map(
                    fn (Topic $child) => [
                        'id' => $child->id,
                        'name' => $child->name,
                        'description' => $child->description,
                        'depth' => $child->depth,
                        'order' => $child->order,
                    ],
                ),
            ],
        ]);
    }

    /**
     * Build the breadcrumb trail from the root down to the immediate parent.
     *
     * @return array<int, array{id: int, slug: string, name: string}>
     */
    protected function ancestorsOf(Topic $topic): array
    {
        $ancestors = [];

        for ($node = $topic->parent; $node; $node = $node->parent) {
            array_unshift($ancestors, [
                'id' => $node->id,
                'slug' => $node->slug,
                'name' => $node->name,
            ]);
        }

        return $ancestors;
    }
}
