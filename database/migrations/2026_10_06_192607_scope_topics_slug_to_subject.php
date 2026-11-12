<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected const SUBJECT_ID_INDEX = 'topics_subject_id_index';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->ensureSubjectIdIndex();

        Schema::table('topics', function (Blueprint $table) {
            $table->dropUnique(['slug']);
        });

        Schema::table('topics', function (Blueprint $table) {
            $table->unique(['subject_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * Only reversible when no two topics in the same subject share a slug,
     * which the composite unique now permits. Colliding rows are renamed
     * first so the global unique can be restored.
     */
    public function down(): void
    {
        $this->deduplicateSlugsPerSubject();

        $this->ensureSubjectIdIndex();

        Schema::table('topics', function (Blueprint $table) {
            $table->dropUnique(['subject_id', 'slug']);
        });

        Schema::table('topics', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    /**
     * Give the subject_id foreign key an index of its own.
     *
     * MySQL refuses to drop an index that a foreign key depends on, and the
     * subject_id foreign key was only ever backed by a wider composite index.
     * Creating a dedicated one first keeps both directions reversible. It is
     * intentionally never dropped again.
     */
    protected function ensureSubjectIdIndex(): void
    {
        $exists = DB::selectOne(
            'SELECT 1 FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND INDEX_NAME = ?
             LIMIT 1',
            ['topics', self::SUBJECT_ID_INDEX],
        );

        if ($exists) {
            return;
        }

        Schema::table('topics', function (Blueprint $table) {
            $table->index('subject_id');
        });
    }

    /**
     * Rename duplicate slugs within a subject so the global unique applies.
     */
    protected function deduplicateSlugsPerSubject(): void
    {
        $seen = [];

        DB::table('topics')
            ->orderBy('subject_id')
            ->orderBy('id')
            ->get(['id', 'subject_id', 'slug'])
            ->each(function ($topic) use (&$seen) {
                $key = $topic->subject_id.'|'.$topic->slug;

                if (! isset($seen[$key])) {
                    $seen[$key] = 1;

                    return;
                }

                $seen[$key]++;

                DB::table('topics')
                    ->where('id', $topic->id)
                    ->update(['slug' => $topic->slug.'-'.$seen[$key]]);
            });
    }
};
