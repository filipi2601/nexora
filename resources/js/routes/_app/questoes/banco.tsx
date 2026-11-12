import { api, getApiErrorMessage } from "@/lib/api";
import { Trash2, ChevronLeft, FileText, RefreshCw } from "lucide-react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import PageHeader from "@/components/PageHeader";
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
        <div className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-12">
            <Link
                to="/questoes"
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ChevronLeft size={16} />
                Voltar
            </Link>
            <PageHeader
                eyebrow="Prática ativa"
                title="Banco de questões"
                description="Todas as questões disponíveis para prática. Exclua as que não fazem sentido."
            />

            {subjects.length > 1 && (
                <div className="mb-6">
                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"
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
                <div className="rounded-3xl border border-dashed bg-white p-12 text-center">
                    <FileText className="mx-auto text-slate-300" size={36} />
                    <h2 className="mt-4 font-bold">Nenhuma questão</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        O banco está vazio para este filtro.
                    </p>
                </div>
            ) : (
                <div className="divide-y rounded-2xl border bg-white">
                    {filteredSubject.map((subject) => (
                        <div key={subject.slug}>
                            <div className="flex align-center justify-between gap-4">
                                <h2 className="p-5 text-lg font-medium text-slate-700">
                                    {subject.name}
                                </h2>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        generateQuestionsMutation.mutate(
                                            subject.slug,
                                        );
                                    }}
                                    disabled={isGenerating(subject)}
                                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 ${isGenerating(subject) ? "animate-spin" : ""}`}
                                    />
                                    {isGenerating(subject)
                                        ? "Gerando..."
                                        : "Gerar questões"}
                                </button>
                            </div>
                            {subject.questions_status === "failed" &&
                                !isGenerating(subject) && (
                                    <p className="px-5 pb-3 text-xs font-medium text-red-500">
                                        {subject.questions_error ??
                                            "A última geração falhou. Tente novamente."}
                                    </p>
                                )}

                            {generateQuestionsMutation.isError &&
                                generateQuestionsMutation.variables ===
                                    subject.slug && (
                                    <p className="px-5 pb-3 text-xs font-medium text-red-500">
                                        {getApiErrorMessage(
                                            generateQuestionsMutation.error,
                                        )}
                                    </p>
                                )}

                            {(subject.questions ?? []).length === 0 &&
                                !isGenerating(subject) && (
                                    <p className="px-5 pb-5 text-sm text-slate-400">
                                        Nenhuma questão nesta disciplina ainda.
                                        Clique em "Gerar questões".
                                    </p>
                                )}

                            {(subject.questions ?? []).map((question) => (
                                <div
                                    key={question.id}
                                    className="flex items-start justify-between gap-4 p-5"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {question.statement}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {subject.name}
                                            {question.topic
                                                ? ` · ${question.topic.name}`
                                                : ""}
                                            {/* {question.wrong ? " · errada recentemente" : ""} */}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleDelete(question.id)
                                        }
                                        className="shrink-0 rounded-lg p-2 text-slate-300 hover:text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
