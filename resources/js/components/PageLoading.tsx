export default function PageLoading() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-5xl animate-pulse p-5 sm:p-8 lg:p-12"
        >
            <span className="sr-only">Carregando...</span>

            <div className="mb-8 space-y-3">
                <div className="h-3 w-28 rounded-full bg-slate-200" />
                <div className="h-9 w-64 rounded-xl bg-slate-200" />
                <div className="h-4 w-full max-w-md rounded-full bg-slate-100" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-40 rounded-3xl border bg-white" />
                <div className="h-40 rounded-3xl border bg-white" />
            </div>
            <div className="mt-4 h-24 rounded-3xl border bg-white" />
        </div>
    );
}
