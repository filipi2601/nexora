import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import { api } from "@/lib/api";
import type { Question, QuestionOption } from "@/types/api";

export function SessionCounter({
    current,
    total,
    color,
    label = "Progresso da sessão",
}: {
    current: number;
    total: number;
    color?: string;
    label?: string;
}) {
    return (
        <div className="mb-4">
            <p className="flex items-baseline gap-1.5 text-sm text-muted">
                <span className="figure text-[24px] text-ink">{current}</span>
                de {total}
            </p>
            <div className="mt-2.5">
                <ProgressBar
                    value={total > 0 ? ((current - 1) / total) * 100 : 0}
                    color={color}
                    label={label}
                />
            </div>
        </div>
    );
}

export function AnswerOption({
    index,
    text,
    answered,
    isCorrect,
    isPicked,
    onSelect,
    children,
}: {
    index: number;
    text: string;
    answered: boolean;
    isCorrect: boolean;
    isPicked: boolean;
    onSelect: () => void;
    children?: ReactNode;
}) {
    let tone =
        "border-rule-strong bg-sheet text-ink hover:border-ink hover:bg-paper";
    let letterTone = "border-rule-strong text-ink-soft";

    if (answered) {
        if (isCorrect) {
            tone = "border-baixa bg-baixa-wash text-ink";
            letterTone = "border-baixa bg-baixa text-white";
        } else if (isPicked) {
            tone = "border-alta bg-alta-wash text-ink";
            letterTone = "border-alta bg-alta text-white";
        } else {
            tone = "border-rule bg-sheet text-muted";
            letterTone = "border-rule text-muted";
        }
    }

    return (
        <button
            type="button"
            disabled={answered}
            onClick={onSelect}
            className={`flex w-full items-start gap-3 rounded border px-4 py-3.5 text-left text-[15px] leading-6 transition-colors ${tone}`}
        >
            <span
                className={`mt-px grid h-[22px] w-[22px] shrink-0 place-items-center rounded-sm border font-display text-[14px] leading-none font-semibold ${letterTone}`}
            >
                {String.fromCharCode(65 + index)}
            </span>

            <span className="min-w-0 flex-1">
                <span className="block">{text}</span>
                {children}
            </span>

            {answered && isCorrect && (
                <span className="stamp stamp-ok mt-0.5">Correta</span>
            )}

            {answered && isPicked && !isCorrect && (
                <span className="stamp stamp-error mt-0.5">Sua resposta</span>
            )}
        </button>
    );
}

export function AnswerResult({ correct }: { correct: boolean }) {
    return (
        <span
            role="status"
            className={`stamp px-2 py-0.5 text-[13px] ${correct ? "stamp-ok" : "stamp-error"}`}
        >
            {correct ? "Acertou" : "Errou"}
        </span>
    );
}

export default function QuestionPractice({
    questions,
}: {
    questions?: (Question & { options: QuestionOption[] })[];
}) {
    const [idx, setIdx] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [score, setScore] = useState(0);

    const items = questions ?? [];

    if (items.length === 0) {
        return (
            <div className="sheet p-6 sm:p-8">
                <h2 className="text-[17px] font-semibold">
                    Sem questões por aqui
                </h2>

                <p className="mt-1 text-[15px] text-ink-soft">
                    Não há questões para esta sessão no momento.
                </p>

                <Link to="/questoes/banco" className="btn btn-primary mt-5">
                    Ir ao banco de questões
                </Link>
            </div>
        );
    }

    if (idx >= items.length) {
        return (
            <section className="sheet p-6 sm:p-8">
                <span className="stamp stamp-ok">Sessão concluída</span>

                <h2 className="mt-4 text-[17px] leading-8 text-ink-soft">
                    <span className="figure text-[34px] text-ink">{score}</span>{" "}
                    de {items.length} acertos
                </h2>

                <Link to="/questoes" className="btn btn-primary mt-6">
                    Ver opções
                    <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </section>
        );
    }

    const q = items[idx];

    const answered = selected !== null;

    const handleAnswer = async (optionId: number | null) => {
        if (optionId === null) {
            return;
        }

        try {
            const response = await api.post(`/api/questions/${q.id}/answer`, {
                selected_option_id: optionId,
            });

            return response.data;
        } catch (error) {
            console.error("Erro ao responder questão:", error);
        } finally {
        }
    };

    return (
        <>
            <SessionCounter current={idx + 1} total={items.length} />

            <article className="sheet p-6 sm:p-8">
                <h2 className="text-[19px] leading-snug font-semibold text-ink">
                    {q.statement}
                </h2>

                <div className="mt-6 grid gap-2.5">
                    {q.options.map((option, i) => (
                        <AnswerOption
                            key={option.id}
                            index={i}
                            text={option.text}
                            answered={answered}
                            isCorrect={option.is_correct}
                            isPicked={option.id === selected}
                            onSelect={() => setSelected(option.id)}
                        >
                            {answered && option.is_correct && q.explanation && (
                                <span className="mt-1.5 block text-[14px] leading-6 text-ink-soft">
                                    {q.explanation}
                                </span>
                            )}
                        </AnswerOption>
                    ))}
                </div>

                {answered && (
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-rule-soft pt-5">
                        <AnswerResult
                            correct={
                                !!q.options.find(
                                    (option) => option.id === selected,
                                )?.is_correct
                            }
                        />

                        <button
                            type="button"
                            onClick={async () => {
                                const selectedOption = q.options.find(
                                    (option) => option.id === selected,
                                );

                                if (selectedOption?.is_correct) {
                                    setScore((s) => s + 1);
                                }

                                await handleAnswer(selected);
                                setIdx((i) => i + 1);
                                setSelected(null);
                            }}
                            className="btn btn-primary"
                        >
                            {idx + 1 >= items.length ? "Finalizar" : "Próxima"}

                            <ArrowRight size={16} aria-hidden="true" />
                        </button>
                    </div>
                )}
            </article>
        </>
    );
}
