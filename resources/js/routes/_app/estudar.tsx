import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
    BookOpen,
    CheckCircle2,
    CircleHelp,
    Clock3,
    Layers3,
    Play,
    type LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/estudar")({
    loader: async () => (await api.get("/api/subjects")).data,
    component: RouteComponent,
});

type Subject = { id: number; name: string };
type Option = { id: number; text: string; is_correct: boolean };
type Item =
    | {
          type: "question";
          id: number;
          statement: string;
          explanation?: string;
          options: Option[];
          subject?: Subject;
      }
    | {
          type: "flashcard";
          id: number;
          front: string;
          back: string;
          subject?: Subject;
      };

function RouteComponent() {
    const subjects = Route.useLoaderData() as Subject[];
    const [session, setSession] = useState<{
        id: number;
        items_count: number;
    } | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [finished, setFinished] = useState<{
        correct_answers: number;
        items_count: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const start = async (subjectId?: number) => {
        setLoading(true);
        try {
            const { data } = await api.post("/api/study-sessions", {
                subject_id: subjectId,
                flashcard_count: 5,
                question_count: 5,
            });
            setSession(data.session);
            setItems(data.items);
            setIndex(0);
            setFinished(null);
        } finally {
            setLoading(false);
        }
    };

    const next = async () => {
        if (!session) return;
        if (index + 1 < items.length) {
            setIndex(index + 1);
            setSelected(null);
            setRevealed(false);
            return;
        }
        const { data } = await api.post(
            `/api/study-sessions/${session.id}/finish`,
        );
        setFinished(data.session);
    };

    const answer = async (
        item: Extract<Item, { type: "question" }>,
        optionId: number,
    ) => {
        if (selected !== null || !session) return;
        await api.post(
            `/api/study-sessions/${session.id}/questions/${item.id}/answer`,
            { selected_option_id: optionId },
        );
        setSelected(optionId);
    };

    const review = async (
        item: Extract<Item, { type: "flashcard" }>,
        rating: string,
    ) => {
        if (!session) return;
        setLoading(true);
        try {
            await api.post(
                `/api/study-sessions/${session.id}/flashcards/${item.id}/review`,
                { rating },
            );
            await next();
        } finally {
            setLoading(false);
        }
    };

    if (finished) {
        return (
            <div className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-12">
                <PageHeader
                    eyebrow="Sessão concluída"
                    title="Bom trabalho!"
                    description="Seu progresso foi salvo."
                />
                <div className="rounded-3xl border bg-white p-10 text-center">
                    <CheckCircle2
                        className="mx-auto text-emerald-600"
                        size={40}
                    />
                    <h2 className="mt-4 text-2xl font-bold">
                        {finished.correct_answers} acertos em{" "}
                        {finished.items_count} itens
                    </h2>
                </div>
            </div>
        );
    }

    if (session && items.length === 0) {
        return (
            <div className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-12">
                <PageHeader
                    eyebrow="Sessão"
                    title="Nada pendente agora"
                    description="Não há flashcards devidos ou questões para esta seleção."
                />
                <button
                    onClick={() => setSession(null)}
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                >
                    Voltar
                </button>
            </div>
        );
    }

    if (session) {
        const item = items[index];
        return (
            <div className="mx-auto max-w-3xl p-5 sm:p-8 lg:p-12">
                <PageHeader
                    eyebrow={`${index + 1} de ${items.length}`}
                    title={item.type === "question" ? "Questão" : "Flashcard"}
                    description={item.subject?.name ?? "Sessão de estudo"}
                />
                <div className="rounded-3xl border bg-white p-8">
                    {item.type === "question" ? (
                        <>
                            <h2 className="text-xl font-bold">
                                {item.statement}
                            </h2>
                            <div className="mt-7 grid gap-3">
                                {item.options.map((option, optionIndex) => {
                                    const answered = selected !== null;
                                    const picked = option.id === selected;
                                    const state =
                                        answered && option.is_correct
                                            ? "border-emerald-400 bg-emerald-50"
                                            : answered && picked
                                              ? "border-red-400 bg-red-50"
                                              : "border bg-white hover:border-indigo-400 hover:bg-indigo-50";
                                    return (
                                        <button
                                            key={option.id}
                                            disabled={answered}
                                            onClick={() =>
                                                answer(item, option.id)
                                            }
                                            className={`rounded-xl p-4 text-left text-sm font-medium ${state}`}
                                        >
                                            {String.fromCharCode(
                                                65 + optionIndex,
                                            )}
                                            . {option.text}
                                        </button>
                                    );
                                })}
                            </div>
                            {selected !== null && (
                                <div className="mt-6 flex items-center justify-between gap-4">
                                    <p className="text-sm text-slate-500">
                                        {item.explanation}
                                    </p>
                                    <button
                                        onClick={next}
                                        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                                    >
                                        {index + 1 === items.length
                                            ? "Finalizar"
                                            : "Próxima"}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="text-xl font-bold">{item.front}</p>
                            {revealed ? (
                                <>
                                    <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm">
                                        {item.back}
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {["again", "hard", "good", "easy"].map(
                                            (rating) => (
                                                <button
                                                    key={rating}
                                                    disabled={loading}
                                                    onClick={() =>
                                                        review(item, rating)
                                                    }
                                                    className="rounded-xl border p-3 text-sm font-bold capitalize hover:border-indigo-400"
                                                >
                                                    {rating === "again"
                                                        ? "De novo"
                                                        : rating === "hard"
                                                          ? "Difícil"
                                                          : rating === "good"
                                                            ? "Bom"
                                                            : "Fácil"}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={() => setRevealed(true)}
                                    className="mt-7 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                                >
                                    Mostrar resposta
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow="Sua próxima ação"
                title="O que vamos estudar?"
                description="Uma sessão equilibrada, montada a partir do seu progresso e das revisões pendentes."
            />
            <div className="mx-auto max-w-2xl rounded-3xl bg-linear-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl shadow-indigo-200">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-indigo-200">
                    Sessão recomendada
                </p>
                <h2 className="mt-4 text-3xl font-bold">
                    Revisões e questões para hoje
                </h2>
                <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                    <Stat icon={Clock3} value="~15 min" />
                    <Stat icon={Layers3} value="até 5 cards" />
                    <Stat icon={CircleHelp} value="até 5 questões" />
                </div>
                <button
                    disabled={loading || subjects.length === 0}
                    onClick={() => start()}
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-bold text-indigo-700 disabled:opacity-60"
                >
                    <Play size={18} fill="currentColor" />
                    {loading ? "Montando sessão..." : "Começar sessão"}
                </button>
            </div>
            {subjects.length === 0 ? (
                <div className="mt-10 rounded-3xl border border-dashed bg-white p-10 text-center">
                    <BookOpen className="mx-auto text-slate-300" size={36} />
                    <h2 className="mt-4 font-bold">
                        Você ainda não tem disciplinas
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Crie uma disciplina e envie seus materiais para montar
                        sessões de estudo.
                    </p>
                    <Link
                        to="/disciplinas"
                        className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                    >
                        Ir para disciplinas
                    </Link>
                </div>
            ) : (
                <>
                    <p className="mb-4 mt-10 text-center text-sm font-semibold text-slate-400">
                        OU ESCOLHA UMA DISCIPLINA
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {subjects.map((subject) => (
                            <button
                                key={subject.id}
                                disabled={loading}
                                onClick={() => start(subject.id)}
                                className="rounded-2xl border bg-white p-5 text-left hover:border-indigo-300"
                            >
                                <span className="text-sm font-bold">
                                    {subject.name}
                                </span>
                                <p className="mt-1 text-xs text-slate-400">
                                    Montar sessão desta disciplina
                                </p>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function Stat({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
    return (
        <div className="rounded-xl bg-white/10 p-3">
            <Icon className="mx-auto mb-2" size={18} />
            <b className="text-sm">{value}</b>
        </div>
    );
}
