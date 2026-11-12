import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/desempenho")({
    loader: async () => {
        const response = await api.get("/api/performance");
        return response.data;
    },
    component: RouteComponent,
});

type AttentionArea = {
    topic_id: number;
    name: string;
    subject: string;
    percent: number;
    priority: number;
    label: string;
    color: string;
};

const PRIORITY_LABELS: Record<string, string> = {
    baixa: "baixa",
    media: "média",
    alta: "alta",
};

function RouteComponent() {
    const { accuracy_over_time, attention_areas, summary } =
        Route.useLoaderData();

    return (
        <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow="Últimos 30 dias"
                title="Desempenho"
                description="Entenda seus resultados e identifique onde concentrar sua energia."
            />
            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                <div className="rounded-3xl border bg-white p-6">
                    <h2 className="font-bold">Taxa de acertos</h2>
                    <div className="mt-6 h-64">
                        {accuracy_over_time.length === 0 ? (
                            <p className="flex h-full items-center justify-center text-sm text-slate-400">
                                Ainda não há dados suficientes.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={accuracy_over_time}>
                                    <XAxis
                                        dataKey="d"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={11}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={11}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="v"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
                <div className="rounded-3xl border bg-white p-6">
                    <h2 className="font-bold">Resumo</h2>
                    <div className="mt-6 space-y-6">
                        {[
                            ["Tempo de estudo", summary.study_time],
                            ["Questões", summary.questions],
                            ["Flashcards", summary.flashcards],
                        ].map(([x, v]) => (
                            <div key={x}>
                                <p className="text-xs text-slate-400">{x}</p>
                                <p className="mt-1 text-2xl font-bold">{v}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {attention_areas.length > 0 && (
                <div className="mt-5 rounded-3xl border bg-white p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="font-bold">Áreas de atenção</h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Os tópicos com maior prioridade de revisão,
                                calculada por lógica fuzzy a partir do seu
                                acerto e de quanto tempo faz que você os
                                praticou.
                            </p>
                        </div>
                        <Link
                            to="/desempenho/prioridade"
                            className="-ml-2 inline-flex min-h-10 shrink-0 items-center gap-1 px-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                            Como é calculada <ArrowRight size={15} />
                        </Link>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {attention_areas.map((a: AttentionArea) => (
                            <Link
                                key={a.topic_id}
                                to="/desempenho/prioridade"
                                search={{ topico: a.topic_id }}
                                className="rounded-xl bg-slate-50 p-4 transition hover:bg-indigo-50"
                            >
                                <span
                                    className={`mr-2 inline-block h-2 w-2 rounded-full ${a.color}`}
                                />
                                <b className="text-sm">{a.name}</b>
                                <p className="mt-1 text-xs text-slate-400">
                                    {a.subject}
                                </p>
                                <p className="mt-3 text-2xl font-bold">
                                    {a.priority}
                                </p>
                                <p className="text-xs text-slate-500">
                                    prioridade{" "}
                                    {PRIORITY_LABELS[a.label] ?? a.label} ·{" "}
                                    {a.percent}% de acerto
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
