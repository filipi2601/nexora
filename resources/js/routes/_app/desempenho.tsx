import { createFileRoute, Link } from "@tanstack/react-router";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import AttentionList, { type AttentionArea } from "@/components/AttentionList";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/desempenho")({
    loader: async () => {
        const response = await api.get("/api/performance");
        return response.data;
    },
    component: RouteComponent,
});

const INK = "#16181d";
const MUTED = "#5b606b";
const RULE = "#ecedef";

function RouteComponent() {
    const { accuracy_over_time, attention_areas, summary } =
        Route.useLoaderData() as {
            accuracy_over_time: { d: string; v: number }[];
            attention_areas: AttentionArea[];
            summary: { study_time: string; questions: number; flashcards: number };
        };

    return (
        <div className="page">
            <PageHeader
                title="Desempenho"
                description="Seus resultados nos últimos 30 dias e os tópicos onde vale concentrar o estudo."
            />

            <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
                <section aria-labelledby="accuracy" className="sheet p-5 sm:p-6">
                    <h2 id="accuracy" className="section-title">
                        Acerto por dia
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Porcentagem de questões certas em cada dia em que você
                        respondeu.
                    </p>
                    <div className="mt-6 h-64">
                        {accuracy_over_time.length === 0 ? (
                            <p className="flex h-full items-center justify-center text-[15px] text-muted">
                                Responda questões para ver sua evolução aqui.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={accuracy_over_time}
                                    margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                                >
                                    <CartesianGrid stroke={RULE} vertical={false} />
                                    <XAxis
                                        dataKey="d"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: MUTED, fontSize: 12 }}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: MUTED, fontSize: 12 }}
                                        domain={[0, 100]}
                                        ticks={[0, 50, 100]}
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: "#c4c8cf" }}
                                        contentStyle={{
                                            border: "1px solid #dddfe3",
                                            borderRadius: 4,
                                            boxShadow: "0 8px 20px -10px rgba(22,24,29,.3)",
                                            fontSize: 13,
                                        }}
                                        labelStyle={{ color: MUTED }}
                                        formatter={(value) => [`${value}%`, "Acerto"]}
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="v"
                                        stroke={INK}
                                        strokeWidth={2}
                                        dot={{ r: 2.5, fill: INK, strokeWidth: 0 }}
                                        activeDot={{ r: 4.5, fill: INK, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                <section aria-labelledby="summary" className="sheet self-start p-5 sm:p-6">
                    <h2 id="summary" className="section-title">
                        Resumo
                    </h2>
                    <dl className="mt-4 divide-y divide-rule-soft">
                        {(
                            [
                                ["Tempo de estudo", summary.study_time],
                                ["Questões respondidas", summary.questions],
                                ["Revisões de flashcards", summary.flashcards],
                            ] as const
                        ).map(([label, value]) => (
                            <div
                                key={label}
                                className="flex items-baseline justify-between gap-4 py-3.5"
                            >
                                <dt className="text-[15px] text-ink-soft">{label}</dt>
                                <dd className="figure text-[26px]">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </div>

            <section aria-labelledby="attention" className="mt-12">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h2 id="attention" className="section-title">
                        Áreas de atenção
                    </h2>
                    <Link to="/desempenho/prioridade" className="link py-1 text-sm">
                        Como a prioridade é calculada
                    </Link>
                </div>
                <p className="mb-4 max-w-[65ch] text-sm text-muted">
                    Os tópicos com maior prioridade de revisão, calculada por
                    lógica fuzzy a partir do seu acerto e de quanto tempo faz que
                    você os praticou.
                </p>

                {attention_areas.length === 0 ? (
                    <div className="sheet p-6 text-[15px] text-ink-soft">
                        Responda algumas questões para o app saber quais tópicos
                        você precisa revisar.{" "}
                        <Link to="/questoes" className="link">
                            Ir para Questões
                        </Link>
                    </div>
                ) : (
                    <AttentionList areas={attention_areas} />
                )}
            </section>
        </div>
    );
}
