import BackLink from "@/components/BackLink";
import PageHeader from "@/components/PageHeader";
import SubjectBand from "@/components/SubjectBand";
import { SessionCounter } from "@/components/QuestionPractice";
import SubjectMark from "@/components/SubjectMark";
import { api } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RotateCw } from "lucide-react";
import { useState } from "react";
import type { Flashcard, Subject } from "@/types/api";

type Rating = "again" | "hard" | "good" | "easy";

export const Route = createFileRoute("/_app/flashcards/revisar/$slug")({
    loader: async ({ params }) => {
        const response = await api.get(
            `/api/flashcards/revisar/${params.slug}`,
        );
        return response.data;
    },
    component: RouteComponent,
});

const ratings: { key: Rating; label: string }[] = [
    { key: "again", label: "Novamente" },
    { key: "hard", label: "Difícil" },
    { key: "good", label: "Bom" },
    { key: "easy", label: "Fácil" },
];

function RouteComponent() {
    const data = Route.useLoaderData() as {
        flashcards: Flashcard[];
        subjects: Subject[];
        slug: string;
    };
    const colors = useSubjectColors();
    const [idx, setIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [done, setDone] = useState(false);
    const [counts, setCounts] = useState<Record<Rating, number>>({
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
    });

    const cards = data.flashcards;
    const subject =
        data.slug !== "todas"
            ? data.subjects.find((s) => s.slug === data.slug)
            : null;

    const meta = subject
        ? {
              title: subject.name,
              description: `Revise ${cards.length} flashcards.`,
          }
        : {
              title: "Revisão geral",
              description: `Revise ${cards.length} flashcards de todas as disciplinas.`,
          };

    const reviewMutation = useMutation({
        mutationFn: async ({
            flashcardId,
            rating,
        }: {
            flashcardId: number;
            rating: string;
        }) => {
            await api.post(`/api/flashcards/${flashcardId}/review`, { rating });
        },
    });

    if (cards.length === 0) {
        return (
            <div className="page page-narrow">
                <BackLink to="/flashcards" />
                <div className="sheet p-6 sm:p-8">
                    <h2 className="text-[17px] font-semibold">
                        Nenhum card pendente
                    </h2>
                    <p className="mt-1 text-[15px] text-ink-soft">
                        Você já revisou tudo por aqui. Volte mais tarde.
                    </p>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="page page-narrow">
                <BackLink to="/flashcards" />
                <section className="sheet p-6 sm:p-8">
                    <span className="stamp stamp-ok">Sessão concluída</span>
                    <h2 className="mt-4 text-[17px] leading-8 text-ink-soft">
                        Revimos{" "}
                        <span className="figure text-[34px] text-ink">
                            {cards.length}
                        </span>{" "}
                        cards
                    </h2>
                    <dl className="mt-6 grid grid-cols-2 border-t border-rule-soft sm:grid-cols-4">
                        {ratings.map((r) => (
                            <div
                                key={r.key}
                                className="flex items-baseline justify-between gap-3 border-b border-rule-soft py-3 pr-4 sm:flex-col sm:items-start sm:gap-1 sm:border-b-0"
                            >
                                <dt className="text-sm text-muted">
                                    {r.label}
                                </dt>
                                <dd className="figure text-[24px] text-ink">
                                    {counts[r.key]}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <Link to="/flashcards" className="btn btn-primary mt-6">
                        Concluir
                        <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                </section>
            </div>
        );
    }

    const card = cards[idx];
    const cardColor = colors.byId(card.subject_id);
    const cardSubjectName = (
        subject ?? data.subjects.find((s) => s.id === card.subject_id)
    )?.name;

    const advance = async (rating: Rating) => {
        try {
            await reviewMutation.mutateAsync({ flashcardId: card.id, rating });
        } catch (error) {
            console.error("Erro ao registrar revisão:", error);
            return; // não avança se a persistência falhou — evita perder o registro silenciosamente
        }

        setCounts((c) => ({ ...c, [rating]: c[rating] + 1 }));

        if (idx + 1 >= cards.length) {
            setDone(true);
        } else {
            setIdx((i) => i + 1);
            setFlipped(false);
        }
    };

    const faceClass =
        "absolute inset-0 flex flex-col overflow-hidden rounded border border-rule bg-sheet text-left";

    return (
        <div className="page page-narrow">
            <BackLink to="/flashcards" />
            {subject ? (
                <SubjectBand
                    color={colors.byId(subject.id)}
                    title={meta.title}
                    description={meta.description}
                />
            ) : (
                <PageHeader {...meta} />
            )}
            <SessionCounter
                current={idx + 1}
                total={cards.length}
                color={subject ? colors.byId(subject.id) : undefined}
                label="Cards revisados"
            />
            <div style={{ perspective: "1400px" }}>
                <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="relative block h-80 w-full cursor-pointer transition-transform duration-500 ease-out motion-reduce:transition-none"
                    style={{
                        transformStyle: "preserve-3d",
                        transform: flipped ? "rotateY(180deg)" : "none",
                    }}
                >
                    <div
                        className={faceClass}
                        style={{ backfaceVisibility: "hidden" }}
                        aria-hidden={flipped}
                    >
                        <CardHeader
                            side="Pergunta"
                            subjectName={cardSubjectName}
                            color={cardColor}
                        />
                        <div className="flex flex-1 items-center overflow-y-auto px-6 py-6 sm:px-10">
                            <p className="font-display text-[28px] leading-tight font-semibold text-ink sm:text-[34px]">
                                {card.front}
                            </p>
                        </div>
                        <p className="flex items-center gap-1.5 px-6 pb-4 text-[13px] text-muted sm:px-10">
                            <RotateCw
                                size={14}
                                strokeWidth={1.75}
                                aria-hidden="true"
                            />
                            Toque para virar
                        </p>
                    </div>
                    <div
                        className={faceClass}
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                        }}
                        aria-hidden={!flipped}
                    >
                        <CardHeader
                            side="Resposta"
                            subjectName={cardSubjectName}
                            color={cardColor}
                        />
                        <div className="flex flex-1 items-center overflow-y-auto px-6 py-6 sm:px-10">
                            <p className="max-w-[60ch] text-[18px] leading-8 text-ink-soft">
                                {card.back}
                            </p>
                        </div>
                    </div>
                </button>
            </div>
            {flipped && (
                <div className="mt-6">
                    <p className="mb-3 text-[15px] text-ink-soft">
                        Quão bem você sabia?
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {ratings.map((r) => (
                            <button
                                key={r.key}
                                type="button"
                                disabled={reviewMutation.isPending}
                                onClick={() => advance(r.key)}
                                className="btn btn-secondary"
                            >
                                {reviewMutation.isPending ? "..." : r.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CardHeader({
    side,
    subjectName,
    color,
}: {
    side: string;
    subjectName?: string;
    color: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-rule px-6 py-3 sm:px-10">
            <span className="text-[13px] font-semibold text-ink-soft">
                {side}
            </span>
            {subjectName && (
                <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
                    <span className="truncate">{subjectName}</span>
                    <SubjectMark name={subjectName} color={color} size="sm" />
                </span>
            )}
        </div>
    );
}
