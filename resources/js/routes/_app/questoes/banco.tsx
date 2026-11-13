import { api, getApiErrorMessage } from "@/lib/api";
import { Trash2, RefreshCw } from "lucide-react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import BackLink from "@/components/BackLink";
import PageHeader from "@/components/PageHeader";
import SubjectMark from "@/components/SubjectMark";
import { useSubjectColors } from "@/lib/subject-colors";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRoutePolling } from "@/hooks/useRoutePolling";
import type { SubjectWithQuestions } from "@/types/api";

export const Route = createFileRoute("/_app/questoes/banco")({
    loader: async () => {
        const response = await api.get("/api/subjects/questions");
        return response.data;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const subjects = Route.useLoaderData() as SubjectWithQuestions[];
    const router = useRouter();
    const colors = useSubjectColors();
    const [subjectFilter, setSubjectFilter] = useState<string | "all">("all");
    const filteredSubject =
        subjectFilter === "all"
            ? (subjects ?? [])
            : (subjects ?? []).filter((s) => s.slug === subjectFilter);

    const generateQuestionsMutation = useMutation({
        mutationFn: async (slug: string) => {
            await api.post(`/api/subjects/${slug}/questions/generate`);
        },
        onSettled: async () => {
            await router.invalidate();
        },
    });

    const isGenerating = (subject: SubjectWithQuestions) =>
        subject.questions_status === "processing" ||
        (generateQuestionsMutation.isPending &&
            generateQuestionsMutation.variables === subject.slug);

    const anyGenerating = (subjects ?? []).some(isGenerating);

    useRoutePolling(anyGenerating);

    const handleDelete = async (questionId: number) => {
        try {
            await api.delete(`/api/questions/${questionId}`);
            await router.invalidate();
        } catch (error) {
            console.error("Erro ao deletar a questão:", error);
        }
    };

    return (
        <div className="page">
            <BackLink to="/questoes" />
            <PageHeader
                title="Banco de questões"
                description="Todas as questões disponíveis para prática. Exclua as que não fazem sentido."
            />

            {subjects.length > 1 && (
                <div className="mb-8 sm:max-w-xs">
                    <label htmlFor="subject-filter" className="field-label">
                        Disciplina
                    </label>
                    <select
                        id="subject-filter"
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="field"
                        disabled={anyGenerating}
                    >
                        <option value="all">Todas as disciplinas</option>
                        {subjects.map((s: { slug: string; name: string }) => (
                            <option key={s.slug} value={s.slug}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            {filteredSubject.length === 0 ? (
                <div className="sheet p-6">
                    <h2 className="text-[17px] font-semibold">
                        Nenhuma questão
                    </h2>
                    <p className="mt-1 text-[15px] text-ink-soft">
                        O banco está vazio para este filtro.
                    </p>
                </div>
            ) : (
                <div className="space-y-10">
                    {filteredSubject.map((subject) => {
                        const generating = isGenerating(subject);
                        const questions = subject.questions ?? [];
                        const failed =
                            subject.questions_status === "failed" &&
                            !generating;

                        return (
                            <section
                                key={subject.slug}
                                aria-labelledby={`subject-${subject.slug}`}
                            >
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                                        <SubjectMark
                                            name={subject.name}
                                            color={colors.byId(subject.id)}
                                            size="md"
                                        />
                                        <h2
                                            id={`subject-${subject.slug}`}
                                            className="section-title"
                                        >
                                            {subject.name}
                                        </h2>
                                        <span className="text-sm text-muted tabular-nums">
                                            {questions.length}{" "}
                                            {questions.length === 1
                                                ? "questão"
                                                : "questões"}
                                        </span>
                                        {generating && (
                                            <span className="stamp stamp-wait">
                                                Gerando...
                                            </span>
                                        )}
                                        {failed && (
                                            <span className="stamp stamp-error">
                                                Falhou
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            generateQuestionsMutation.mutate(
                                                subject.slug,
                                            );
                                        }}
                                        disabled={generating}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        <RefreshCw
                                            size={16}
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                            className={
                                                generating ? "animate-spin" : ""
                                            }
                                        />
                                        {generating
                                            ? "Gerando..."
                                            : "Gerar questões"}
                                    </button>
                                </div>

                                {failed && (
                                    <p className="mb-3 text-sm text-alta">
                                        {subject.questions_error ??
                                            "A última geração falhou. Tente novamente."}
                                    </p>
                                )}

                                {generateQuestionsMutation.isError &&
                                    generateQuestionsMutation.variables ===
                                        subject.slug && (
                                        <p className="mb-3 text-sm text-alta">
                                            {getApiErrorMessage(
                                                generateQuestionsMutation.error,
                                            )}
                                        </p>
                                    )}

                                {questions.length === 0 && !generating && (
                                    <p className="sheet px-5 py-4 text-[15px] text-ink-soft">
                                        Nenhuma questão nesta disciplina ainda.
                                        Clique em "Gerar questões".
                                    </p>
                                )}

                                {questions.length > 0 && (
                                    <ul className="sheet row-divider">
                                        {questions.map((question) => (
                                            <li
                                                key={question.id}
                                                className="flex items-start justify-between gap-3 px-5 py-4"
                                            >
                                                <div className="min-w-0 py-1.5">
                                                    <p className="text-[15px] leading-6 font-semibold text-ink">
                                                        {question.statement}
                                                    </p>
                                                    <p className="mt-1 text-[13px] text-muted">
                                                        {subject.name}
                                                        {question.topic
                                                            ? ` · ${question.topic.name}`
                                                            : ""}
                                                        {/* {question.wrong ? " · errada recentemente" : ""} */}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    aria-label="Excluir questão"
                                                    onClick={() =>
                                                        handleDelete(
                                                            question.id,
                                                        )
                                                    }
                                                    className="btn btn-danger btn-icon shrink-0"
                                                >
                                                    <Trash2
                                                        size={16}
                                                        strokeWidth={1.75}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
