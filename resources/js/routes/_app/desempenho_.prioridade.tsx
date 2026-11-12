import type { ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import {
    Area,
    ComposedChart,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";
import FuzzyChart, {
    breakpoints,
    trapezoidPoints,
} from "@/components/FuzzyChart";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import type { FuzzyVariable } from "@/types/api";

type RuleCell = { acerto: string; recencia: string; prioridade: string };

type Explanation = {
    fuzzified: Record<string, Record<string, number>>;
    rules: (RuleCell & { strength: number })[];
    activation: Record<string, number>;
    aggregated: { z: number; degree: number }[];
    centroid: number;
    output_degrees: Record<string, number>;
    label: string;
};

type PrioritizedTopic = {
    topic_id: number;
    topic: string;
    subject: string;
    accuracy: number;
    days_since_last_attempt: number;
    priority: number;
    label: string;
    explanation: Explanation;
};

type ReviewPriority = {
    system: {
        inputs: FuzzyVariable[];
        output: FuzzyVariable;
        rules: RuleCell[];
    };
    topics: PrioritizedTopic[];
};

export const Route = createFileRoute("/_app/desempenho_/prioridade")({
    validateSearch: (search: Record<string, unknown>): { topico?: number } => ({
        topico: search.topico === undefined ? undefined : Number(search.topico),
    }),
    loader: async (): Promise<ReviewPriority> =>
        (await api.get("/api/review-priority")).data,
    component: RouteComponent,
});

/** Os nomes dos termos com acento, para exibir. */
const TERM_LABELS: Record<string, string> = {
    baixo: "baixo",
    medio: "médio",
    alto: "alto",
    recente: "recente",
    media: "média",
    antiga: "antiga",
    baixa: "baixa",
    alta: "alta",
};

const VARIABLES: Record<string, { title: string; unit: string }> = {
    acerto: { title: "Acerto", unit: "%" },
    recencia: { title: "Recência", unit: " dias" },
    prioridade: { title: "Prioridade de revisão", unit: "" },
};

/** Entradas em tons de índigo; a saída nas cores das áreas de atenção (baixa, média, alta). */
const INPUT_COLORS = ["#a5b4fc", "#6366f1", "#3730a3"];
const OUTPUT_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

const term = (name: string) => TERM_LABELS[name] ?? name;

const formatNumber = (value: number) =>
    value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

function RouteComponent() {
    const { system, topics } = Route.useLoaderData();
    const { topico } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });

    const selected = topics.find((t) => t.topic_id === topico) ?? topics[0];
    const inputValues: Record<string, number> = selected
        ? {
              acerto: selected.accuracy,
              recencia: selected.days_since_last_attempt,
          }
        : {};

    return (
        <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-12">
            <Link
                to="/desempenho"
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ChevronLeft size={16} />
                Voltar
            </Link>
            <PageHeader
                eyebrow="Lógica fuzzy"
                title="Como a prioridade é calculada"
                description="Um sistema de inferência de Mamdani: fuzzificar o acerto e a recência, avaliar as regras, agregar e defuzzificar pelo centróide."
            />

            <section className="grid gap-5 lg:grid-cols-3">
                {[...system.inputs, system.output].map((variable) => {
                    const isOutput = variable.name === system.output.name;

                    return (
                        <div
                            key={variable.name}
                            className="rounded-3xl border bg-white p-6"
                        >
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                {isOutput ? "Saída" : "Entrada"}
                            </p>
                            <h2 className="mt-1 font-bold">
                                {VARIABLES[variable.name]?.title ??
                                    variable.name}
                            </h2>
                            <p className="mb-4 text-xs text-slate-400">
                                de {variable.min} a {variable.max}
                                {VARIABLES[variable.name]?.unit}
                            </p>
                            <FuzzyChart
                                variable={variable}
                                colors={isOutput ? OUTPUT_COLORS : INPUT_COLORS}
                                marker={
                                    isOutput
                                        ? selected?.explanation.centroid
                                        : inputValues[variable.name]
                                }
                                formatTerm={term}
                            />
                        </div>
                    );
                })}
            </section>

            <section className="mt-5 rounded-3xl border bg-white p-6">
                <h2 className="font-bold">Base de regras</h2>
                <p className="mt-1 text-sm text-slate-400">
                    Cada célula é uma regra: SE acerto é (linha) E recência é
                    (coluna) ENTÃO prioridade é (célula). As destacadas
                    dispararam para o tópico escolhido.
                </p>
                <RulesMatrix
                    rows={system.inputs[0].terms.map((t) => t.name)}
                    columns={system.inputs[1].terms.map((t) => t.name)}
                    rules={system.rules}
                    fired={selected?.explanation.rules ?? []}
                />
            </section>

            {selected ? (
                <section className="mt-5 rounded-3xl border bg-white p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold">Passo a passo</h2>
                            <p className="mt-1 text-sm text-slate-400">
                                A inferência de um tópico, nos 4 passos da aula.
                            </p>
                        </div>
                        <select
                            value={selected.topic_id}
                            onChange={(e) =>
                                navigate({
                                    search: { topico: Number(e.target.value) },
                                })
                            }
                            className="rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"
                        >
                            {topics.map((t) => (
                                <option key={t.topic_id} value={t.topic_id}>
                                    {t.topic} · {t.subject}
                                </option>
                            ))}
                        </select>
                    </div>

                    <ol className="mt-6 grid gap-5 lg:grid-cols-2">
                        <Step step={1} title="Fuzzificação">
                            {system.inputs.map((variable) => (
                                <p key={variable.name} className="mb-2 text-sm">
                                    <b>
                                        {VARIABLES[variable.name]?.title} ={" "}
                                        {formatNumber(
                                            inputValues[variable.name],
                                        )}
                                        {VARIABLES[variable.name]?.unit}
                                    </b>
                                    :{" "}
                                    {variable.terms
                                        .map(
                                            (t) =>
                                                `${term(t.name)} ${formatNumber(selected.explanation.fuzzified[variable.name][t.name])}`,
                                        )
                                        .join(" · ")}
                                </p>
                            ))}
                        </Step>

                        <Step
                            step={2}
                            title="Regras que dispararam (E = mínimo)"
                        >
                            <ul className="space-y-2 text-sm">
                                {selected.explanation.rules
                                    .filter((rule) => rule.strength > 0)
                                    .map((rule) => (
                                        <li
                                            key={`${rule.acerto}-${rule.recencia}`}
                                        >
                                            SE acerto é{" "}
                                            <b>{term(rule.acerto)}</b> E
                                            recência é{" "}
                                            <b>{term(rule.recencia)}</b> ENTÃO
                                            prioridade é{" "}
                                            <b>{term(rule.prioridade)}</b>: mín(
                                            {formatNumber(
                                                selected.explanation.fuzzified
                                                    .acerto[rule.acerto],
                                            )}
                                            ;{" "}
                                            {formatNumber(
                                                selected.explanation.fuzzified
                                                    .recencia[rule.recencia],
                                            )}
                                            ) ={" "}
                                            <b>{formatNumber(rule.strength)}</b>
                                        </li>
                                    ))}
                            </ul>
                        </Step>

                        <Step step={3} title="Agregação (máximo por termo)">
                            <p className="text-sm">
                                Cada termo da saída fica com o maior grau entre
                                as regras que levam a ele:{" "}
                                {system.output.terms
                                    .map(
                                        (t) =>
                                            `${term(t.name)} ${formatNumber(selected.explanation.activation[t.name])}`,
                                    )
                                    .join(" · ")}
                                .
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                No gráfico do passo 4, cada termo é cortado
                                nesse grau e os cortes são unidos (a área azul).
                            </p>
                        </Step>

                        <Step step={4} title="Defuzzificação (centróide)">
                            <AggregatedChart
                                output={system.output}
                                explanation={selected.explanation}
                            />
                            <p className="mt-3 text-sm">
                                Centróide Σ z·μ(z) / Σ μ(z) ={" "}
                                <b className="text-lg">
                                    {formatNumber(
                                        selected.explanation.centroid,
                                    )}
                                </b>
                                , que é{" "}
                                {system.output.terms
                                    .filter(
                                        (t) =>
                                            selected.explanation.output_degrees[
                                                t.name
                                            ] > 0,
                                    )
                                    .map(
                                        (t) =>
                                            `${term(t.name)} com grau ${formatNumber(selected.explanation.output_degrees[t.name])}`,
                                    )
                                    .join(" e ")}
                                : prioridade{" "}
                                <b>{term(selected.explanation.label)}</b>.
                            </p>
                        </Step>
                    </ol>
                </section>
            ) : (
                <section className="mt-5 rounded-3xl border border-dashed bg-white p-10 text-center">
                    <h2 className="font-bold">Nenhum tópico praticado ainda</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Responda questões para ver o cálculo da prioridade de um
                        tópico, passo a passo.
                    </p>
                </section>
            )}
        </div>
    );
}

function Step({
    step,
    title,
    children,
}: {
    step: number;
    title: string;
    children: ReactNode;
}) {
    return (
        <li className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Passo {step}
            </p>
            <h3 className="mt-1 mb-3 font-bold">{title}</h3>
            {children}
        </li>
    );
}

function RulesMatrix({
    rows,
    columns,
    rules,
    fired,
}: {
    rows: string[];
    columns: string[];
    rules: RuleCell[];
    fired: (RuleCell & { strength: number })[];
}) {
    const find = <T extends RuleCell>(list: T[], row: string, column: string) =>
        list.find((rule) => rule.acerto === row && rule.recencia === column);

    return (
        <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
                <thead>
                    <tr className="text-xs text-slate-400">
                        <th className="p-2 text-left font-medium">
                            acerto \ recência
                        </th>
                        {columns.map((column) => (
                            <th key={column} className="p-2 font-medium">
                                {term(column)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row} className="border-t">
                            <th className="p-2 text-left font-medium text-slate-500">
                                {term(row)}
                            </th>
                            {columns.map((column) => {
                                const strength =
                                    find(fired, row, column)?.strength ?? 0;

                                return (
                                    <td
                                        key={column}
                                        className="p-2 text-center"
                                    >
                                        <span
                                            className={`inline-flex min-w-24 flex-col rounded-xl px-3 py-2 ${
                                                strength > 0
                                                    ? "bg-indigo-50 ring-2 ring-indigo-400"
                                                    : "bg-slate-50"
                                            }`}
                                        >
                                            <span className="font-semibold">
                                                {term(
                                                    find(rules, row, column)
                                                        ?.prioridade ?? "",
                                                )}
                                            </span>
                                            {strength > 0 && (
                                                <span className="text-xs text-indigo-700">
                                                    grau{" "}
                                                    {formatNumber(strength)}
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/**
 * O conjunto de saída agregado (área), sobre as funções da prioridade (tracejadas),
 * com a linha do centróide — a figura dos slides 39 a 41.
 */
function AggregatedChart({
    output,
    explanation,
}: {
    output: FuzzyVariable;
    explanation: Explanation;
}) {
    return (
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    margin={{ top: 8, right: 12, bottom: 0, left: -24 }}
                >
                    <XAxis
                        type="number"
                        dataKey="x"
                        domain={[output.min, output.max]}
                        ticks={breakpoints(output)}
                        axisLine={false}
                        tickLine={false}
                        fontSize={11}
                    />
                    <YAxis
                        domain={[0, 1]}
                        ticks={[0, 0.5, 1]}
                        axisLine={false}
                        tickLine={false}
                        fontSize={11}
                    />
                    {output.terms.map((t, index) => (
                        <Line
                            key={t.name}
                            data={trapezoidPoints(t.points)}
                            dataKey="y"
                            type="linear"
                            stroke={OUTPUT_COLORS[index % OUTPUT_COLORS.length]}
                            strokeDasharray="3 3"
                            strokeWidth={1}
                            dot={false}
                            isAnimationActive={false}
                        />
                    ))}
                    <Area
                        data={explanation.aggregated.map((point) => ({
                            x: point.z,
                            y: point.degree,
                        }))}
                        dataKey="y"
                        type="linear"
                        stroke="#4f46e5"
                        fill="#6366f1"
                        fillOpacity={0.25}
                        isAnimationActive={false}
                    />
                    <ReferenceLine
                        x={explanation.centroid}
                        stroke="#0f172a"
                        strokeDasharray="4 4"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
