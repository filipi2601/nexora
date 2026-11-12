import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/questoes/disciplina")({
    loader: async () => {
        const response = await api.get("/api/subjects/questions");
        return response.data;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const navigate = useNavigate();
    const subjects = Route.useLoaderData();
    const [slug, setSlug] = useState(subjects[0]?.slug || "");
    return (
        <div className="mx-auto max-w-lg p-5 sm:p-8 lg:p-12">
            <Link
                to="/questoes"
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ChevronLeft size={16} />
                Voltar
            </Link>
            <PageHeader
                eyebrow="Prática ativa"
                title="Por disciplina"
                description="Escolha uma disciplina para começar a responder."
            />
            <div className="rounded-2xl border bg-white p-6">
                {subjects.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        Nenhuma disciplina encontrada.
                    </p>
                ) : (
                    <>
                        <label className="mb-2 block text-sm font-semibold">
                            Disciplina
                        </label>
                        <select
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-700 outline-none"
                        >
                            {subjects.map(
                                (s: { slug: string; name: string }) => (
                                    <option key={s.slug} value={s.slug}>
                                        {s.name}
                                    </option>
                                ),
                            )}
                        </select>
                        <button
                            onClick={() =>
                                navigate({
                                    to: `/questoes/praticar/disciplina/${slug}`,
                                })
                            }
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white"
                        >
                            <ArrowRight size={17} />
                            Começar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
