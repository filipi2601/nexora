<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected const LEGACY_INDEX = 'subjects_slug_unique';

    protected const COMPOSITE_INDEX = 'subjects_user_id_slug_unique';

    protected const USER_ID_INDEX = 'subjects_user_id_index';

    /**
     * Run the migrations.
     *
     * Every subject lookup in the app is scoped to the owner
     * (Subject::where('slug', $slug)->where('user_id', $userId)), and the
     * create_subjects_table migration already declares the composite unique.
     * Databases created before that edit carry a global unique on slug
     * instead, so two students cannot each have a subject called "Redes".
     *
     * This reconciles both states: a fresh database already has the composite
     * index and only needs the legacy one removed, while an existing database
     * has the global one and needs it swapped.
     */
    public function up(): void
    {
        $this->ensureUserIdIndex();

        $this->dropIndexIfExists(self::LEGACY_INDEX);

        if (! $this->indexExists(self::COMPOSITE_INDEX)) {
            Schema::table('subjects', function (Blueprint $table) {
                $table->unique(['user_id', 'slug']);
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * Only reversible when no two subjects share a slug, which the composite
     * unique now permits. Colliding rows are renamed first so the global
     * unique can be restored.
     */
    public function down(): void
    {
        $this->deduplicateSlugsAcrossUsers();

        $this->ensureUserIdIndex();

        $this->dropIndexIfExists(self::COMPOSITE_INDEX);

        if (! $this->indexExists(self::LEGACY_INDEX)) {
            Schema::table('subjects', function (Blueprint $table) {
                $table->unique('slug');
            });
        }
    }

    /**
     * Give the user_id foreign key an index of its own.
     *
     * MySQL refuses to drop an index a foreign key depends on, and user_id had
     * no index of its own before this migration. Creating a dedicated one
     * first keeps both directions reversible. It is never dropped again.
     */
    protected function ensureUserIdIndex(): void
    {
        if ($this->indexExists(self::USER_ID_INDEX)) {
            return;
        }

        Schema::table('subjects', function (Blueprint $table) {
            $table->index('user_id');
        });
    }

    /**
     * Determine whether an index exists on the subjects table.
     */
    protected function indexExists(string $index): bool
    {
        return (bool) DB::selectOne(
            'SELECT 1 FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND INDEX_NAME = ?
             LIMIT 1',
            ['subjects', $index],
        );
    }

    /**
     * Drop an index only when it is actually present.
     */
    protected function dropIndexIfExists(string $index): void
    {
        if (! $this->indexExists($index)) {
            return;
        }

        Schema::table('subjects', function (Blueprint $table) use ($index) {
            $table->dropIndex($index);
        });
    }

    /**
     * Rename duplicated slugs so the global unique can be restored.
     */
    protected function deduplicateSlugsAcrossUsers(): void
    {
        DB::table('subjects')
            ->orderBy('slug')
            ->orderBy('id')
            ->get(['id', 'slug'])
            ->each(function ($subject, $index) {
                DB::table('subjects')
                    ->where('id', $subject->id)
                    ->update(['slug' => $subject->slug.'-'.($index + 1)]);
            });
    }
};
