import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SubjectMark from "@/components/SubjectMark";
import { api } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";
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
    const colors = useSubjectColors();

    return (
        <div className="page">
            <PageHeader
                title="Flashcards"
                description="Revise primeiro o que está prestes a ser esquecido."
            />
            {subjects.length === 0 && (
                <div className="sheet p-6">
                    <h2 className="text-[17px] font-semibold">
                        Nenhuma disciplina ainda
                    </h2>
                    <p className="mt-1 text-[15px] text-ink-soft">
                        Crie uma disciplina e gere flashcards a partir dos seus
                        materiais.
                    </p>
                    <Link to="/disciplinas" className="btn btn-primary mt-5">
                        Ir para disciplinas
                    </Link>
                </div>
            )}

            {subjects.length > 0 && (
                <>
                    <section
                        aria-labelledby="due-review"
                        className="sheet grid lg:grid-cols-[1fr_auto]"
                    >
                        <div className="p-6 sm:p-7">
                            <h2 id="due-review" className="section-title">
                                Revisão de hoje
                            </h2>
                            <p className="mt-3 text-[17px] leading-8 text-ink-soft">
                                Você possui{" "}
                                <span className="figure text-[30px] text-ink">
                                    {due_count}
                                </span>{" "}
                                {due_count === 1 ? "card" : "cards"} para
                                revisar hoje.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-rule-soft p-6 sm:flex-row sm:items-end sm:p-7 lg:w-80 lg:flex-col lg:items-stretch lg:justify-center lg:border-t-0 lg:border-l">
                            <div className="min-w-0 sm:flex-1 lg:flex-none">
                                <label
                                    htmlFor="review-subject"
                                    className="field-label"
                                >
                                    Disciplina
                                </label>
                                <select
                                    id="review-subject"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="field"
                                >
                                    <option value="todas">
                                        Todas as disciplinas
                                    </option>
                                    {subjects.map((s) => (
                                        <option key={s.slug} value={s.slug}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    navigate({
                                        to: "/flashcards/revisar/$slug",
                                        params: { slug },
                                    })
                                }
                                className="btn btn-primary"
                            >
                                Começar revisão
                                <ArrowRight size={16} aria-hidden="true" />
                            </button>
                        </div>
                    </section>

                    <section aria-labelledby="by-subject" className="mt-12">
                        <h2 id="by-subject" className="section-title mb-4">
                            Por disciplina
                        </h2>
                        <ul className="sheet row-divider">
                            {subjects.map((subject) => {
                                const count = (subject.flashcards ?? []).length;

                                return (
                                    <li key={subject.id}>
                                        <Link
                                            to="/flashcards/$slug"
                                            params={{ slug: subject.slug }}
                                            className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-paper"
                                        >
                                            <SubjectMark
                                                name={subject.name}
                                                color={colors.byId(subject.id)}
                                                size="sm"
                                            />
                                            <span className="min-w-0 flex-1 truncate font-semibold">
                                                {subject.name}
                                            </span>
                                            <span className="shrink-0 text-sm text-muted tabular-nums">
                                                {count} cards
                                            </span>
                                            <ChevronRight
                                                size={16}
                                                strokeWidth={1.75}
                                                aria-hidden="true"
                                                className="shrink-0 text-muted"
                                            />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                </>
            )}
        </div>
    );
}
