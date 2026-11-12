import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import {
    BookOpen,
    Layers3,
    CircleHelp,
    ArrowUpRight,
    Trash2,
    RefreshCw,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import type { Subject } from "@/types/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/disciplinas/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { data: subjects } = useQuery<Subject[]>({
        queryKey: ["subjects"],
        queryFn: async () => {
            const response = await api.get("/api/subjects");
            return response.data;
        },
        refetchInterval: (query) => {
            const subjects = query.state.data;
            const hasprocessing = subjects?.some(
                (subject: { status: string }) =>
                    subject.status === "processing",
            );
            return hasprocessing ? 2000 : false;
        },
    });

    const [isOpen, setIsOpen] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState("");
    const queryClient = useQueryClient();

    const createSubjectMutation = useMutation({
        mutationFn: async ({ name }: { name: string }) => {
            const response = await api.post("/api/subjects", { name });
            return response.data;
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subjects"] });
            setIsOpen(false);
            setNewSubjectName("");
        },

        onError: (error) => {
            console.error("Erro no upload:", error);
        },
    });

    const regenerateTopicsMutation = useMutation({
        mutationFn: async ({
            id,
            confirmDestroy = false,
        }: {
            id: number;
            confirmDestroy?: boolean;
        }) => {
            const response = await api.post(
                `/api/subjects/${id}/regenerate-topics`,
                { confirm_destroy: confirmDestroy },
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subjects"] });
        },
        onError: (error: AxiosError, { id }) => {
            const data = error.response?.data as
                | {
                      requires_confirmation?: boolean;
                      counts?: {
                          flashcards: number;
                          questions: number;
                          reviews: number;
                          attempts: number;
                      };
                  }
                | undefined;

            const counts = data?.counts;

            if (data?.requires_confirmation && counts) {
                const { flashcards, questions, reviews, attempts } = counts;

                const losses = [
                    `${flashcards} flashcard${flashcards === 1 ? "" : "s"}`,
                    `${questions} quest\u00e3o${questions === 1 ? "" : "\u00f5es"}`,
                    reviews
                        ? `${reviews} registro${reviews === 1 ? "" : "s"} de revis\u00e3o`
                        : null,
                    attempts
                        ? `${attempts} tentativa${attempts === 1 ? "" : "s"} registrada${attempts === 1 ? "" : "s"}`
                        : null,
                ]
                    .filter(Boolean)
                    .join("\n\u2022 ");

                const accepted = confirm(
                    `Regenerar os t\u00f3picos vai APAGAR tudo que foi gerado a partir deles:\n\n\u2022 ${losses}\n\nEsse processo n\u00e3o pode ser desfeito. Quer continuar?`,
                );

                if (accepted) {
                    regenerateTopicsMutation.mutate({
                        id,
                        confirmDestroy: true,
                    });
                }

                return;
            }

            if (error.response?.status === 429) {
                alert(getApiErrorMessage(error));
                return;
            }

            console.error("Erro ao regenerar t\u00f3picos:", error);
        },
    });

    const deleteSubject = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`api/subject/${id}`);
        },

        onSuccess: (_, deletedId) => {
            queryClient.setQueryData(
                ["subjects"],
                (oldSubjects: typeof subjects) =>
                    oldSubjects?.filter(
                        (subject: { id: number }) => subject.id !== deletedId,
                    ),
            );
        },
    });

    const handleDelete = (id: number) => {
        if (!confirm("Tem certeza que deseja excluir esta disciplina?")) {
            return;
        }

        deleteSubject.mutate(id);
    };
    return (
        <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow="Experiências de aprendizagem"
                title="Disciplinas"
                description="Conteúdos, atividades e progresso organizados a partir dos seus materiais. Clique para ver os tópicos extraídos pela IA."
                action={
                    <button
                        onClick={() => setIsOpen(true)}
                        disabled={createSubjectMutation.isPending}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                    >
                        Nova disciplina
                    </button>
                }
            />
            {subjects && (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {subjects.map((s) => {
                        return (
                            <Link
                                key={s.slug}
                                to="/disciplinas/$slug"
                                params={{ slug: s.slug }}
                                className="block rounded-3xl border bg-white p-6 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <BookOpen />
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {/* Always available: a subject that is
                                            already ready is exactly the one a
                                            student may want to rebuild. */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                if (s.status !== "processing") {
                                                    regenerateTopicsMutation.mutate(
                                                        { id: s.id },
                                                    );
                                                }
                                            }}
                                            disabled={
                                                s.status === "processing" ||
                                                regenerateTopicsMutation.isPending
                                            }
                                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition hover:bg-indigo-50 ${
                                                s.status === "failed"
                                                    ? "text-red-600"
                                                    : "text-indigo-600"
                                            }`}
                                            title={
                                                s.status === "processing"
                                                    ? "Regenerando tópicos"
                                                    : s.status === "failed"
                                                      ? "Falha ao regenerar tópicos"
                                                      : "Regenerar tópicos"
                                            }
                                        >
                                            <RefreshCw
                                                className={`h-4 w-4 ${
                                                    s.status === "processing"
                                                        ? "animate-spin"
                                                        : ""
                                                }`}
                                            />

                                            <span className="hidden sm:inline">
                                                {s.status === "processing"
                                                    ? "Regenerando..."
                                                    : s.status === "failed"
                                                      ? "Falha"
                                                      : "Regenerar"}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(s.id);
                                            }}
                                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                            title="Excluir disciplina"
                                            aria-label={`Excluir ${s.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>

                                        <ArrowUpRight className="ml-1 text-slate-300" />
                                    </div>
                                </div>
                                <h2 className="mt-5 text-lg font-bold">
                                    {s.name}
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    {s.topics_count ?? 0} tópicos
                                </p>
                                {s.status === "failed" && s.topics_error && (
                                    <p className="mt-2 text-xs font-medium text-red-500">
                                        {s.topics_error}
                                    </p>
                                )}
                                <div className="mt-6 grid grid-cols-2 gap-2">
                                    <div className="rounded-xl bg-slate-50 p-3 text-xs">
                                        <Layers3
                                            size={15}
                                            className="mb-2 text-indigo-500"
                                        />
                                        <b>{s.flashcards_count ?? 0} cards</b>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3 text-xs">
                                        <CircleHelp
                                            size={15}
                                            className="mb-2 text-sky-500"
                                        />
                                        <b>{s.questions_count ?? 0} questões</b>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <div className="mb-2 flex justify-between text-xs">
                                        <span>Progresso</span>
                                        <b>{s.progress ?? 0}%</b>
                                    </div>
                                    <ProgressBar value={s.progress ?? 0} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar disciplina</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Disciplina
                            </label>

                            <input
                                type="text"
                                value={newSubjectName}
                                onChange={(e) =>
                                    setNewSubjectName(e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={
                                !newSubjectName ||
                                createSubjectMutation.isPending
                            }
                            onClick={() => {
                                if (!newSubjectName) return;

                                createSubjectMutation.mutate({
                                    name: newSubjectName,
                                });
                            }}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50"
                        >
                            {createSubjectMutation.isPending
                                ? "Criando..."
                                : "Nova disciplina"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
