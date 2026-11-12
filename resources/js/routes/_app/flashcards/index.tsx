import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layers3, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import type { SubjectWithFlashcards } from "@/types/api";
import { useState } from "react";

export const Route = createFileRoute("/_app/flashcards/")({
    loader: async () => {
        const response = await api.get(`/api/flashcards`);
        return response.data;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { subjects, due_count } = Route.useLoaderData() as {
        subjects: SubjectWithFlashcards[];
        due_count: number;
    };
    const [slug, setSlug] = useState("todas");
    const navigate = useNavigate();

    return (
        <div className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow="Revisão espaçada"
                title="Flashcards"
                description="Revise primeiro o que está prestes a ser esquecido."
            />
            {subjects.length === 0 && (
                <div className="rounded-3xl border border-dashed bg-white p-12 text-center">
                    <Layers3 className="mx-auto text-slate-300" size={36} />
                    <h2 className="mt-4 font-bold">Nenhuma disciplina ainda</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Crie uma disciplina e gere flashcards a partir dos seus
                        materiais.
                    </p>
                    <Link
                        to="/disciplinas"
                        className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                    >
                        Ir para disciplinas
                    </Link>
                </div>
            )}

            {subjects.length > 0 && (
                <>
                    <div className="rounded-3xl bg-slate-950 p-8 text-white">
                        <Layers3 className="text-indigo-300" size={30} />
                        <p className="mt-7 text-sm text-slate-400">
                            Você possui
                        </p>
                        <h2 className="mt-1 text-3xl font-bold">
                            {due_count} {due_count === 1 ? "card" : "cards"}{" "}
                            para revisar hoje
                        </h2>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <select
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white outline-none"
                            >
                                <option value="todas" className="bg-slate-900">
                                    Todas as disciplinas
                                </option>
                                {subjects.map((s) => (
                                    <option
                                        key={s.slug}
                                        value={s.slug}
                                        className="bg-slate-900"
                                    >
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() =>
                                    navigate({
                                        to: "/flashcards/revisar/$slug",
                                        params: { slug },
                                    })
                                }
                                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold cursor-pointer"
                            >
                                Começar revisão
                                <ArrowRight size={17} />
                            </button>
                        </div>
                    </div>
                    <h2 className="mb-4 mt-9 font-bold">Por disciplina</h2>
                    <div className="divide-y rounded-2xl border bg-white">
                        {subjects.map((subject) => (
                            <Link
                                to="/flashcards/$slug"
                                params={{ slug: subject.slug }}
                                key={subject.id}
                                className="block"
                            >
                                <div className="flex items-center justify-between p-5">
                                    <span className="text-sm font-semibold">
                                        {subject.name}
                                    </span>
                                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                                        {(subject.flashcards ?? []).length}{" "}
                                        cards
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
