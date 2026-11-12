import PageHeader from "@/components/PageHeader";
import { api, getApiErrorMessage } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, RefreshCw, Trash } from "lucide-react";
import { useState } from "react";
import { useRoutePolling } from "@/hooks/useRoutePolling";
import type { Flashcard, Subject, Topic, TopicWithChildren } from "@/types/api";

export const Route = createFileRoute("/_app/flashcards/$slug/")({
    loader: async ({ params }) => {
        const response = await api.get(`/api/flashcards/${params.slug}`);
        return response.data;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { topics, subject } = Route.useLoaderData() as {
        topics: (TopicWithChildren & { flashcards: Flashcard[] })[];
        subject: Subject;
    };
    const router = useRouter();

    const handleDelete = async (flashcardId: number) => {
        try {
            await api.delete(`/api/flashcard/${flashcardId}`);

            await router.invalidate();
        } catch (error) {
            console.error("Erro ao deletar flashcard:", error);
        }
    };

    const generateFlashcardsMutation = useMutation({
        mutationFn: async (topicId: number) => {
            await api.post(`/api/flashcards/generate/${topicId}`);
        },
        onSettled: async () => {
            await router.invalidate();
        },
    });

    const isGenerating = (topic: Topic) =>
        topic.flashcards_status === "processing" ||
        (generateFlashcardsMutation.isPending &&
            generateFlashcardsMutation.variables === topic.id);

    useRoutePolling((topics ?? []).some(isGenerating));

    return (
        <div className="mx-auto max-w-3xl p-5 sm:p-8 lg:p-12">
            <Link
                to="/flashcards"
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ChevronLeft size={16} />
                Voltar
            </Link>
            <PageHeader
                eyebrow="Flashcards por disciplina"
                title={subject?.name}
                description={`${topics?.reduce((acc, topic) => acc + topic.flashcards.length, 0) || 0} cards disponíveis`}
            />
            {topics?.length === 0 && (
                <div className="rounded-3xl border border-dashed bg-white p-12 text-center">
                    <h2 className="font-bold">
                        Esta disciplina ainda não tem tópicos
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Os flashcards são gerados por tópico. Gere os tópicos na
                        página da disciplina.
                    </p>
                </div>
            )}
            {topics && (
                <div className="space-y-8">
                    {topics.map((topic) => (
                        <section key={topic.id}>
                            <div className="mb-3 flex justify-between items-center">
                                <h2 className="flex items-center gap-2 font-bold">
                                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                    {topic.name}
                                    <span className="text-sm font-normal text-slate-400">
                                        · {topic.flashcards.length} cards
                                    </span>
                                </h2>
                                <div className="flex flex-col items-end gap-1">
                                    <button
                                        type="button"
                                        disabled={isGenerating(topic)}
                                        onClick={() => {
                                            generateFlashcardsMutation.mutate(
                                                topic.id,
                                            );
                                        }}
                                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            size={16}
                                            className={
                                                isGenerating(topic)
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />

                                        <span>
                                            {isGenerating(topic)
                                                ? "Gerando..."
                                                : "Gerar flashcards"}
                                        </span>
                                    </button>

                                    {topic.flashcards_status === "failed" &&
                                        !isGenerating(topic) && (
                                            <span className="text-xs font-medium text-red-500">
                                                {topic.flashcards_error ??
                                                    "A última geração falhou. Tente novamente."}
                                            </span>
                                        )}

                                    {generateFlashcardsMutation.isError &&
                                        generateFlashcardsMutation.variables ===
                                            topic.id && (
                                            <span className="text-xs font-medium text-red-500">
                                                {getApiErrorMessage(
                                                    generateFlashcardsMutation.error,
                                                )}
                                            </span>
                                        )}
                                </div>
                            </div>
                            <div className="divide-y rounded-2xl border bg-white">
                                {topic.flashcards.length === 0 && (
                                    <p className="p-5 text-sm text-slate-400">
                                        Nenhum flashcard neste tópico ainda. Use
                                        "Gerar flashcards" para criá-los.
                                    </p>
                                )}
                                {topic.flashcards.map((c, i) => (
                                    <FlashcardRow
                                        key={i}
                                        card={c}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

function FlashcardRow({
    card,
    onDelete,
}: {
    card: { id: number; front: string; back: string };
    onDelete: (flashcardId: number) => Promise<void>;
}) {
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const confirmed = window.confirm(
            "Tem certeza que deseja excluir este flashcard?",
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            await onDelete(card.id);
        } catch {
        } finally {
            setDeleting(false);
        }
    };
    return (
        <div className="flex w-full items-center justify-between gap-4 p-5 hover:bg-slate-50">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="min-w-0 flex-1 text-left"
            >
                <p className="text-sm font-semibold text-slate-800">
                    {card.front}
                </p>

                {open && (
                    <p className="mt-2 text-sm font-medium text-indigo-700">
                        {card.back}
                    </p>
                )}
            </button>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={deleting}
                    className="-m-2 shrink-0 p-2 text-red-300 hover:text-red-500 disabled:opacity-50"
                    onClick={handleDelete}
                >
                    <Trash size={16} />
                </button>

                <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-300 transition ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </div>
        </div>
    );
}
