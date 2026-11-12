import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronLeft, RotateCw } from "lucide-react";
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

const ratings: { key: Rating; label: string; color: string }[] = [
    { key: "again", label: "Novamente", color: "text-red-500" },
    { key: "hard", label: "Difícil", color: "text-amber-500" },
    { key: "good", label: "Bom", color: "text-slate-700" },
    { key: "easy", label: "Fácil", color: "text-emerald-600" },
];

function RouteComponent() {
    const data = Route.useLoaderData() as {
        flashcards: Flashcard[];
        subjects: Subject[];
        slug: string;
    };
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
              eyebrow: "Revisão espaçada",
              title: subject.name,
              description: `Revise ${cards.length} flashcards.`,
          }
        : {
              eyebrow: "Revisão espaçada",
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
            <div className="mx-auto max-w-2xl p-5 sm:p-8 lg:p-12">
                <Link
                    to="/flashcards"
                    className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
                >
                    <ChevronLeft size={16} />
                    Voltar
                </Link>
                <div className="rounded-3xl border bg-white p-10 text-center">
                    <h2 className="text-xl font-bold">Nenhum card pendente</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Você já revisou tudo por aqui. Volte mais tarde.
                    </p>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="mx-auto max-w-2xl p-5 sm:p-8 lg:p-12">
                <Link
                    to="/flashcards"
                    className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
                >
                    <ChevronLeft size={16} />
                    Voltar
                </Link>
                <div className="rounded-3xl border bg-white p-10 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={32} />
                    </div>
                    <p className="mt-5 text-sm font-bold text-indigo-600">
                        SESSÃO CONCLUÍDA
                    </p>
                    <h2 className="mt-3 text-2xl font-bold">
                        Revimos {cards.length} cards
                    </h2>
                    <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-left">
                        {ratings.map((r) => (
                            <div
                                key={r.key}
                                className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-semibold"
                            >
                                <span>{r.label}</span>
                                <span className={r.color}>{counts[r.key]}</span>
                            </div>
                        ))}
                    </div>
                    <Link
                        to="/flashcards"
                        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                    >
                        Concluir
                        <ArrowRight size={17} />
                    </Link>
                </div>
            </div>
        );
    }

    const card = cards[idx];

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

    return (
        <div className="mx-auto max-w-2xl p-5 sm:p-8 lg:p-12">
            <Link
                to="/flashcards"
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ChevronLeft size={16} />
                Voltar
            </Link>
            <PageHeader {...meta} />
            <p className="mb-4 text-sm font-bold text-indigo-600">
                {idx + 1} DE {cards.length}
            </p>
            <div style={{ perspective: "1400px" }}>
                <button
                    onClick={() => setFlipped((f) => !f)}
                    className="relative block h-72 w-full cursor-pointer transition-transform duration-500"
                    style={{
                        transformStyle: "preserve-3d",
                        transform: flipped ? "rotateY(180deg)" : "none",
                    }}
                >
                    <div
                        className="absolute inset-0 grid place-items-center rounded-3xl border bg-white p-8 text-center shadow-sm"
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        <p className="text-sm font-bold uppercase tracking-widest text-indigo-500">
                            Pergunta
                        </p>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900">
                            {card.front}
                        </h2>
                        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                            <RotateCw size={13} />
                            Toque para virar
                        </p>
                    </div>
                    <div
                        className="absolute inset-0 grid place-items-center rounded-3xl border bg-indigo-50 p-8 text-center shadow-sm"
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                        }}
                    >
                        <p className="text-sm font-bold uppercase tracking-widest text-indigo-500">
                            Resposta
                        </p>
                        <h2 className="mx-auto mt-4 max-w-md text-xl font-bold text-slate-900">
                            {card.back}
                        </h2>
                    </div>
                </button>
            </div>
            {flipped && (
                <div className="mt-6">
                    <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Quão bem você sabia?
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {ratings.map((r) => (
                            <button
                                key={r.key}
                                disabled={reviewMutation.isPending}
                                onClick={() => advance(r.key)}
                                className="rounded-xl border bg-white py-3 text-sm font-bold transition-colors hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50"
                            >
                                <span className={r.color}>
                                    {reviewMutation.isPending ? "..." : r.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
