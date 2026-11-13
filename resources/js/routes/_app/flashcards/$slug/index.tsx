import BackLink from "@/components/BackLink";
import SubjectBand from "@/components/SubjectBand";
import { api, getApiErrorMessage } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronDown, RefreshCw, Trash2 } from "lucide-react";
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
    const colors = useSubjectColors();
    const color = colors.byId(subject?.id);

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

    const totalCards =
        topics?.reduce((acc, topic) => acc + topic.flashcards.length, 0) || 0;

    return (
        <div className="page page-narrow">
            <BackLink to="/flashcards" />
            <SubjectBand
                color={color}
                title={subject?.name}
                description={`${totalCards} cards disponíveis`}
            />

            {topics?.length === 0 && (
                <div className="sheet p-6">
                    <h2 className="text-[17px] font-semibold">
                        Esta disciplina ainda não tem tópicos
                    </h2>
                    <p className="mt-1 text-[15px] text-ink-soft">
                        Os flashcards são gerados por tópico. Gere os tópicos na
                        página da disciplina.
                    </p>
                    {subject?.slug && (
                        <Link
                            to="/disciplinas/$slug"
                            params={{ slug: subject.slug }}
                            className="link mt-4 inline-block text-[15px]"
                        >
                            Ir para a disciplina
                        </Link>
                    )}
                </div>
            )}
            {topics && (
                <div className="space-y-10">
                    {topics.map((topic) => {
                        const generating = isGenerating(topic);
                        const failed =
                            topic.flashcards_status === "failed" && !generating;
                        const mutationFailed =
                            generateFlashcardsMutation.isError &&
                            generateFlashcardsMutation.variables === topic.id;

                        return (
                            <section
                                key={topic.id}
                                aria-labelledby={`topic-${topic.id}`}
                            >
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                                        <h2
                                            id={`topic-${topic.id}`}
                                            className="section-title"
                                        >
                                            {topic.name}
                                        </h2>
                                        <span className="text-sm text-muted tabular-nums">
                                            {topic.flashcards.length} cards
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
                                        disabled={generating}
                                        onClick={() => {
                                            generateFlashcardsMutation.mutate(
                                                topic.id,
                                            );
                                        }}
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

                                        <span>
                                            {generating
                                                ? "Gerando..."
                                                : "Gerar flashcards"}
                                        </span>
                                    </button>
                                </div>

                                {failed && (
                                    <p className="mb-3 text-sm text-alta">
                                        {topic.flashcards_error ??
                                            "A última geração falhou. Tente novamente."}
                                    </p>
                                )}

                                {mutationFailed && (
                                    <p className="mb-3 text-sm text-alta">
                                        {getApiErrorMessage(
                                            generateFlashcardsMutation.error,
                                        )}
                                    </p>
                                )}

                                <div className="sheet row-divider">
                                    {topic.flashcards.length === 0 && (
                                        <p className="px-5 py-4 text-[15px] text-ink-soft">
                                            Nenhum flashcard neste tópico ainda.
                                            Use "Gerar flashcards" para
                                            criá-los.
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
                        );
                    })}
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
        <div className="flex w-full items-start justify-between gap-3 px-5 py-4 transition-colors hover:bg-paper">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="min-w-0 flex-1 py-1.5 text-left"
            >
                <p className="text-[15px] font-semibold text-ink">
                    {card.front}
                </p>

                {open && (
                    <p className="mt-2 max-w-[65ch] text-[15px] leading-6 text-ink-soft">
                        {card.back}
                    </p>
                )}
            </button>

            <div className="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    disabled={deleting}
                    aria-label="Excluir flashcard"
                    className="btn btn-danger btn-icon"
                    onClick={handleDelete}
                >
                    <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>

                <ChevronDown
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className={`shrink-0 text-muted transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </div>
        </div>
    );
}
