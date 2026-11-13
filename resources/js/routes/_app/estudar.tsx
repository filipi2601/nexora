import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
    AnswerOption,
    AnswerResult,
    SessionCounter,
} from "@/components/QuestionPractice";
import SubjectMark from "@/components/SubjectMark";
import { api } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";

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

const RATING_LABELS: Record<string, string> = {
    again: "De novo",
    hard: "Difícil",
    good: "Bom",
    easy: "Fácil",
};

function RouteComponent() {
    const subjects = Route.useLoaderData() as Subject[];
    const colors = useSubjectColors();
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
            <div className="page page-narrow">
                <PageHeader
                    title="Bom trabalho!"
                    description="Seu progresso foi salvo."
                />
                <section className="sheet p-6 sm:p-8">
                    <span className="stamp stamp-ok">Sessão concluída</span>
                    <h2 className="mt-4 text-[17px] leading-8 text-ink-soft">
                        <span className="figure text-[34px] text-ink">
                            {finished.correct_answers}
                        </span>{" "}
                        acertos em{" "}
                        <span className="figure text-[34px] text-ink">
                            {finished.items_count}
                        </span>{" "}
                        itens
                    </h2>
                </section>
            </div>
        );
    }

    if (session && items.length === 0) {
        return (
            <div className="page page-narrow">
                <PageHeader
                    title="Nada pendente agora"
                    description="Não há flashcards devidos ou questões para esta seleção."
                />
                <button
                    type="button"
                    onClick={() => setSession(null)}
                    className="btn btn-primary"
                >
                    Voltar
                </button>
            </div>
        );
    }

    if (session) {
        const item = items[index];
        const subjectColor = item.subject
            ? colors.byId(item.subject.id)
            : undefined;

        return (
            <div className="page page-narrow">
                <PageHeader
                    title={item.type === "question" ? "Questão" : "Flashcard"}
                    description={
                        item.subject ? (
                            <span className="inline-flex items-center gap-2">
                                <SubjectMark
                                    name={item.subject.name}
                                    color={colors.byId(item.subject.id)}
                                    size="sm"
                                />
                                {item.subject.name}
                            </span>
                        ) : (
                            "Sessão de estudo"
                        )
                    }
                />

                <SessionCounter current={index + 1} total={items.length} />

                {item.type === "question" ? (
                    <article className="sheet p-6 sm:p-8">
                        <h2 className="text-[19px] leading-snug font-semibold text-ink">
                            {item.statement}
                        </h2>
                        <div className="mt-6 grid gap-2.5">
                            {item.options.map((option, optionIndex) => (
                                <AnswerOption
                                    key={option.id}
                                    index={optionIndex}
                                    text={option.text}
                                    answered={selected !== null}
                                    isCorrect={option.is_correct}
                                    isPicked={option.id === selected}
                                    onSelect={() => answer(item, option.id)}
                                />
                            ))}
                        </div>
                        {selected !== null && (
                            <div className="mt-6 border-t border-rule-soft pt-5">
                                {item.explanation && (
                                    <p className="max-w-[65ch] text-[15px] leading-6 text-ink-soft">
                                        {item.explanation}
                                    </p>
                                )}
                                <div
                                    className={`flex flex-wrap items-center justify-between gap-4 ${item.explanation ? "mt-5" : ""}`}
                                >
                                    <AnswerResult
                                        correct={
                                            !!item.options.find(
                                                (option) =>
                                                    option.id === selected,
                                            )?.is_correct
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={next}
                                        className="btn btn-primary"
                                    >
                                        {index + 1 === items.length
                                            ? "Finalizar"
                                            : "Próxima"}
                                        <ArrowRight
                                            size={16}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                    </article>
                ) : (
                    <>
                        <article className="sheet">
                            <div className="flex min-h-48 items-center px-6 py-8 sm:px-10 sm:py-10">
                                <p className="font-display text-[28px] leading-tight font-semibold text-ink sm:text-[32px]">
                                    {item.front}
                                </p>
                            </div>
                            {revealed && (
                                <div
                                    className="border-t border-rule px-6 py-6 sm:px-10 sm:py-8"
                                    style={
                                        subjectColor
                                            ? { borderTopColor: subjectColor }
                                            : undefined
                                    }
                                >
                                    <p className="max-w-[65ch] text-[17px] leading-7 text-ink-soft">
                                        {item.back}
                                    </p>
                                </div>
                            )}
                        </article>

                        {revealed ? (
                            <div className="mt-6">
                                <p className="mb-3 text-[15px] text-ink-soft">
                                    Quão bem você sabia?
                                </p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {["again", "hard", "good", "easy"].map(
                                        (rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                disabled={loading}
                                                onClick={() =>
                                                    review(item, rating)
                                                }
                                                className="btn btn-secondary"
                                            >
                                                {RATING_LABELS[rating]}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setRevealed(true)}
                                className="btn btn-primary mt-6"
                            >
                                Mostrar resposta
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="page page-narrow">
            <PageHeader
                title="O que vamos estudar?"
                description="Uma sessão equilibrada, montada a partir do seu progresso e das revisões pendentes."
            />

            <section aria-labelledby="recommended-session" className="sheet">
                <div className="p-6 sm:p-7">
                    <h2 id="recommended-session" className="section-title">
                        Revisões e questões para hoje
                    </h2>
                    <p className="mt-3 text-[17px] leading-8 text-ink-soft">
                        Cerca de{" "}
                        <span className="figure text-[30px] text-ink">15</span>{" "}
                        min, com até{" "}
                        <span className="figure text-[30px] text-ink">5</span>{" "}
                        cards e até{" "}
                        <span className="figure text-[30px] text-ink">5</span>{" "}
                        questões.
                    </p>
                </div>
                <div className="border-t border-rule-soft px-6 py-5 sm:px-7">
                    <button
                        type="button"
                        disabled={loading || subjects.length === 0}
                        onClick={() => start()}
                        className="btn btn-primary w-full sm:w-auto"
                    >
                        {loading ? "Montando sessão..." : "Começar sessão"}
                        <ArrowRight size={16} aria-hidden="true" />
                    </button>
                </div>
            </section>

            {subjects.length === 0 ? (
                <div className="sheet mt-10 p-6">
                    <h2 className="text-[17px] font-semibold">
                        Você ainda não tem disciplinas
                    </h2>
                    <p className="mt-1 text-[15px] text-ink-soft">
                        Crie uma disciplina e envie seus materiais para montar
                        sessões de estudo.
                    </p>
                    <Link to="/disciplinas" className="btn btn-secondary mt-5">
                        Ir para disciplinas
                    </Link>
                </div>
            ) : (
                <section aria-labelledby="by-subject" className="mt-12">
                    <h2 id="by-subject" className="section-title mb-4">
                        Ou escolha uma disciplina
                    </h2>
                    <ul className="sheet row-divider">
                        {subjects.map((subject) => (
                            <li key={subject.id}>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => start(subject.id)}
                                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    <SubjectMark
                                        name={subject.name}
                                        color={colors.byId(subject.id)}
                                        size="sm"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-semibold">
                                            {subject.name}
                                        </span>
                                        <span className="block text-[13px] text-muted">
                                            Montar sessão desta disciplina
                                        </span>
                                    </span>
                                    <ChevronRight
                                        size={16}
                                        strokeWidth={1.75}
                                        aria-hidden="true"
                                        className="shrink-0 text-muted"
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
