import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { subjectInitial, useSubjectColors } from "@/lib/subject-colors";
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
    const colors = useSubjectColors();

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
        <div className="page">
            <PageHeader
                title="Disciplinas"
                description="Conteúdos, atividades e progresso organizados a partir dos seus materiais. Clique para ver os tópicos extraídos pela IA."
                action={
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        disabled={createSubjectMutation.isPending}
                        className="btn btn-primary"
                    >
                        <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                        Nova disciplina
                    </button>
                }
            />

            {!subjects ? (
                <p className="text-sm text-muted">Carregando disciplinas...</p>
            ) : subjects.length === 0 ? (
                <div className="sheet flex flex-wrap items-center justify-between gap-4 p-6">
                    <p className="text-[15px] text-ink-soft">
                        Crie uma disciplina e envie seus materiais para
                        começar.
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        disabled={createSubjectMutation.isPending}
                        className="btn btn-secondary"
                    >
                        Nova disciplina
                    </button>
                </div>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {subjects.map((s) => {
                        const color = colors.byId(s.id);
                        const progress = s.progress ?? 0;

                        return (
                            <li
                                key={s.slug}
                                className="sheet relative flex overflow-hidden transition-colors hover:border-rule-strong"
                            >
                                <span
                                    aria-hidden="true"
                                    className="flex w-10 shrink-0 items-end justify-center pb-4 font-display text-xl font-bold text-white"
                                    style={{ backgroundColor: color }}
                                >
                                    {subjectInitial(s.name)}
                                </span>

                                <div className="flex min-w-0 flex-1 flex-col p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <h2 className="min-w-0 text-[17px] leading-snug font-semibold">
                                            {/* The link covers the whole card;
                                                the buttons sit above it. */}
                                            <Link
                                                to="/disciplinas/$slug"
                                                params={{ slug: s.slug }}
                                                className="line-clamp-2 after:absolute after:inset-0"
                                            >
                                                {s.name}
                                            </Link>
                                        </h2>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(s.id);
                                            }}
                                            className="btn btn-ghost btn-icon relative z-10 -mt-1.5 -mr-2 text-muted hover:text-alta"
                                            title="Excluir disciplina"
                                            aria-label={`Excluir ${s.name}`}
                                        >
                                            <Trash2
                                                size={16}
                                                strokeWidth={1.75}
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>

                                    <p className="mt-1 text-[13px] text-muted">
                                        {s.topics_count ?? 0} tópicos ·{" "}
                                        {s.flashcards_count ?? 0} flashcards ·{" "}
                                        {s.questions_count ?? 0} questões
                                    </p>

                                    {s.status === "processing" && (
                                        <p className="mt-3">
                                            <span className="stamp stamp-wait">
                                                Regenerando tópicos...
                                            </span>
                                        </p>
                                    )}

                                    {s.status === "failed" && (
                                        <div className="mt-3">
                                            <span className="stamp stamp-error">
                                                Falha ao regenerar tópicos
                                            </span>
                                            {s.topics_error && (
                                                <p className="mt-1.5 text-sm text-alta">
                                                    {s.topics_error}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-auto pt-5">
                                        <div className="mb-2 flex items-baseline justify-between text-[13px] text-muted">
                                            <span>Progresso</span>
                                            <span className="font-semibold text-ink tabular-nums">
                                                {progress}%
                                            </span>
                                        </div>
                                        <ProgressBar
                                            value={progress}
                                            color={color}
                                            label={`Progresso em ${s.name}`}
                                        />
                                    </div>

                                    <div className="mt-4 -mb-1 flex border-t border-rule-soft pt-3">
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
                                            className="btn btn-ghost btn-sm relative z-10 -ml-2.5"
                                            title={
                                                s.status === "processing"
                                                    ? "Regenerando tópicos"
                                                    : s.status === "failed"
                                                      ? "Falha ao regenerar tópicos"
                                                      : "Regenerar tópicos"
                                            }
                                        >
                                            <RefreshCw
                                                size={15}
                                                strokeWidth={1.75}
                                                aria-hidden="true"
                                                className={
                                                    s.status === "processing"
                                                        ? "animate-spin"
                                                        : ""
                                                }
                                            />
                                            {s.status === "processing"
                                                ? "Regenerando..."
                                                : "Regenerar tópicos"}
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar disciplina</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div>
                            <label
                                htmlFor="new-subject-name"
                                className="field-label"
                            >
                                Disciplina
                            </label>

                            <input
                                id="new-subject-name"
                                type="text"
                                value={newSubjectName}
                                onChange={(e) =>
                                    setNewSubjectName(e.target.value)
                                }
                                className="field"
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
                            className="btn btn-primary w-full"
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
