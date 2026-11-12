import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import type { Question, QuestionOption } from "@/types/api";

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
            <div className="rounded-3xl border border-dashed bg-white p-12 text-center">
                <CheckCircle2 className="mx-auto text-slate-300" size={36} />

                <h2 className="mt-4 font-bold">Sem questões por aqui</h2>

                <p className="mt-1 text-sm text-slate-400">
                    Não há questões para esta sessão no momento.
                </p>

                <Link
                    to="/questoes/banco"
                    className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                >
                    Ir ao banco de questões
                </Link>
            </div>
        );
    }

    if (idx >= items.length) {
        return (
            <div className="rounded-3xl border bg-white p-10 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={32} />
                </div>

                <p className="mt-5 text-sm font-bold text-indigo-600">
                    SESSÃO CONCLUÍDA
                </p>

                <h2 className="mt-3 text-2xl font-bold">
                    {score} de {items.length} acertos
                </h2>

                <Link
                    to="/questoes"
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                >
                    Ver opções
                    <ArrowRight size={17} />
                </Link>
            </div>
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
            <p className="mb-4 text-sm font-bold text-indigo-600">
                {idx + 1} DE {items.length}
            </p>

            <div className="rounded-3xl border bg-white p-8">
                <h2 className="text-xl font-bold">{q.statement}</h2>

                <div className="mt-7 grid gap-3">
                    {q.options.map((option, i) => {
                        const isPicked = option.id === selected;

                        let cls =
                            "border bg-white hover:border-indigo-400 hover:bg-indigo-50";

                        if (answered) {
                            if (option.is_correct) {
                                cls = "border-emerald-400 bg-emerald-50";
                            } else if (isPicked) {
                                cls = "border-red-400 bg-red-50";
                            } else {
                                cls = "border bg-white opacity-70";
                            }
                        }

                        return (
                            <button
                                key={option.id}
                                disabled={answered}
                                onClick={() => setSelected(option.id)}
                                className={`flex items-center gap-3 rounded-xl p-4 text-left text-sm font-medium ${cls}`}
                            >
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold">
                                    {String.fromCharCode(65 + i)}
                                </span>

                                <div className="flex-1">
                                    <span className="block">{option.text}</span>
                                    {answered && option.is_correct && (
                                        <span className="text-xs text-muted-foreground">
                                            {q.explanation}
                                        </span>
                                    )}
                                </div>

                                {answered && option.is_correct && (
                                    <CheckCircle2
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                )}

                                {answered && isPicked && !option.is_correct && (
                                    <XCircle
                                        size={18}
                                        className="text-red-500"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {answered && (
                    <div className="mt-6 flex items-center justify-between">
                        <p
                            className={`text-sm font-bold ${
                                q.options.find(
                                    (option) => option.id === selected,
                                )?.is_correct
                                    ? "text-emerald-600"
                                    : "text-red-500"
                            }`}
                        >
                            {q.options.find((option) => option.id === selected)
                                ?.is_correct
                                ? "Resposta correta!"
                                : "Resposta incorreta."}
                        </p>

                        <button
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
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                        >
                            {idx + 1 >= items.length ? "Finalizar" : "Próxima"}

                            <ArrowRight size={17} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
