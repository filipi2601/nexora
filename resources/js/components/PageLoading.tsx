export default function PageLoading() {
    return (
        <div role="status" aria-live="polite" className="page animate-pulse">
            <span className="sr-only">Carregando...</span>

            <div className="mb-8 space-y-3">
                <div className="h-10 w-72 max-w-full rounded bg-rule-soft" />
                <div className="h-4 w-96 max-w-full rounded bg-rule-soft" />
            </div>

            <div className="sheet h-36" />
            <div className="sheet mt-6 divide-y divide-rule-soft">
                <div className="h-16" />
                <div className="h-16" />
                <div className="h-16" />
            </div>
        </div>
    );
}
