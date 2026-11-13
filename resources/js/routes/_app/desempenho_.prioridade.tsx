import type { ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";
import BackLink from "@/components/BackLink";
import FuzzyChart, {
    breakpoints,
    CHART,
    trapezoidPoints,
} from "@/components/FuzzyChart";
import PageHeader from "@/components/PageHeader";
import SubjectMark from "@/components/SubjectMark";
import { api } from "@/lib/api";
import { priorityStamp } from "@/lib/priority";
import { useSubjectColors } from "@/lib/subject-colors";
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

const term = (name: string) => TERM_LABELS[name] ?? name;

const formatNumber = (value: number) =>
    value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

function RouteComponent() {
    const { system, topics } = Route.useLoaderData();
    const { topico } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    const colors = useSubjectColors();

    const selected = topics.find((t) => t.topic_id === topico) ?? topics[0];
    const inputValues: Record<string, number> = selected
        ? {
              acerto: selected.accuracy,
              recencia: selected.days_since_last_attempt,
          }
        : {};

    /** A cor de cada termo da saída: verde (baixa), âmbar (média), vermelho (alta). */
    const outputColor = (name: string) => {
        const index = system.output.terms.findIndex((t) => t.name === name);
        return CHART.output[Math.max(0, index) % CHART.output.length];
    };

    return (
        <div className="page">
            <BackLink to="/desempenho" label="Desempenho" />
            <PageHeader
                title="Como a prioridade é calculada"
                description="A lógica fuzzy (inferência de Mamdani) combina o quanto você acerta um tópico e há quanto tempo não o pratica para decidir o que revisar primeiro."
            />

            {selected && (
                <section
                    aria-label="Tópico em análise"
                    className="sheet mb-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <SubjectMark
                            name={selected.subject}
                            color={colors.byName(selected.subject)}
                        />
                        <div className="min-w-0">
                            <p className="truncate text-[17px] font-semibold">
                                {selected.topic}
                            </p>
                            <p className="truncate text-[13px] text-muted">
                                {selected.subject} · {formatNumber(selected.accuracy)}% de
                                acerto · última prática há{" "}
                                {formatNumber(selected.days_since_last_attempt)} dias
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-2.5">
                            <span className="figure text-[34px]">
                                {selected.priority}
                            </span>
                            <span
                                className={`stamp ${priorityStamp(selected.label).className}`}
                            >
                                {priorityStamp(selected.label).label}
                            </span>
                        </span>
                        <label className="sr-only" htmlFor="topic-picker">
                            Escolher outro tópico
                        </label>
                        <select
                            id="topic-picker"
                            value={selected.topic_id}
                            onChange={(e) =>
                                navigate({
                                    search: { topico: Number(e.target.value) },
                                })
                            }
                            className="field w-full sm:w-auto sm:min-w-80 sm:max-w-md"
                        >
                            {topics.map((t) => (
                                <option key={t.topic_id} value={t.topic_id}>
                                    {t.topic} · {t.subject}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>
            )}

            <section aria-labelledby="variables">
                <h2 id="variables" className="section-title">
                    As variáveis
                </h2>
                <p className="mt-1 mb-4 max-w-[65ch] text-sm text-muted">
                    Cada variável é dividida em termos que se sobrepõem. A linha
                    vertical tracejada marca o valor do tópico em análise.
                </p>
                <div className="grid gap-4 lg:grid-cols-3">
                    {[...system.inputs, system.output].map((variable) => {
                        const isOutput = variable.name === system.output.name;
                        const value = isOutput
                            ? selected?.explanation.centroid
                            : inputValues[variable.name];

                        return (
                            <div key={variable.name} className="sheet p-5">
                                <h3 className="text-[17px] font-semibold">
                                    {VARIABLES[variable.name]?.title ??
                                        variable.name}
                                </h3>
                                <p className="mb-4 text-[13px] text-muted">
                                    {isOutput ? "Saída" : "Entrada"}, de{" "}
                                    {variable.min} a {variable.max}
                                    {VARIABLES[variable.name]?.unit}
                                    {value !== undefined && (
                                        <>
                                            {" "}
                                            · neste tópico:{" "}
                                            <b className="font-bold text-ink">
                                                {formatNumber(value)}
                                                {VARIABLES[variable.name]?.unit}
                                            </b>
                                        </>
                                    )}
                                </p>
                                <FuzzyChart
                                    variable={variable}
                                    colors={
                                        isOutput
                                            ? [...CHART.output]
                                            : [...CHART.inputs]
                                    }
                                    marker={value}
                                    formatTerm={term}
                                />
                            </div>
                        );
                    })}
                </div>
            </section>

            <section aria-labelledby="rules" className="mt-12">
                <h2 id="rules" className="section-title">
                    Base de regras
                </h2>
                <p className="mt-1 mb-4 max-w-[65ch] text-sm text-muted">
                    Cada célula é uma regra: SE acerto é (linha) E recência é
                    (coluna) ENTÃO prioridade é (célula). As células com contorno
                    dispararam para o tópico em análise.
                </p>
                <RulesMatrix
                    rows={system.inputs[0].terms.map((t) => t.name)}
                    columns={system.inputs[1].terms.map((t) => t.name)}
                    rules={system.rules}
                    fired={selected?.explanation.rules ?? []}
                    outputColor={outputColor}
                />
            </section>

            <section aria-labelledby="steps" className="mt-12">
                <h2 id="steps" className="section-title">
                    Passo a passo
                </h2>

                {selected ? (
                    <>
                        <p className="mt-1 mb-4 max-w-[65ch] text-sm text-muted">
                            A inferência do tópico em análise, nos 4 passos da
                            aula.
                        </p>
                        <ol className="grid gap-4 lg:grid-cols-2">
                            <Step step={1} title="Fuzzificação">
                                <dl className="space-y-3">
                                    {system.inputs.map((variable) => (
                                        <div key={variable.name}>
                                            <dt className="font-semibold text-ink">
                                                {VARIABLES[variable.name]?.title} ={" "}
                                                {formatNumber(
                                                    inputValues[variable.name],
                                                )}
                                                {VARIABLES[variable.name]?.unit}
                                            </dt>
                                            <dd className="tabular mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                                {variable.terms.map((t) => (
                                                    <span key={t.name}>
                                                        {term(t.name)}{" "}
                                                        <b className="font-semibold text-ink">
                                                            {formatNumber(
                                                                selected.explanation
                                                                    .fuzzified[
                                                                    variable.name
                                                                ][t.name],
                                                            )}
                                                        </b>
                                                    </span>
                                                ))}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </Step>

                            <Step
                                step={2}
                                title="Regras que dispararam (E = mínimo)"
                            >
                                <ul className="divide-y divide-rule-soft">
                                    {selected.explanation.rules
                                        .filter((rule) => rule.strength > 0)
                                        .map((rule) => (
                                            <li
                                                key={`${rule.acerto}-${rule.recencia}`}
                                                className="tabular py-2 first:pt-0 last:pb-0"
                                            >
                                                SE acerto é{" "}
                                                <b className="text-ink">
                                                    {term(rule.acerto)}
                                                </b>{" "}
                                                E recência é{" "}
                                                <b className="text-ink">
                                                    {term(rule.recencia)}
                                                </b>{" "}
                                                ENTÃO prioridade é{" "}
                                                <b className="text-ink">
                                                    {term(rule.prioridade)}
                                                </b>
                                                : mín(
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
                                                <b className="text-ink">
                                                    {formatNumber(rule.strength)}
                                                </b>
                                            </li>
                                        ))}
                                </ul>
                            </Step>

                            <Step step={3} title="Agregação (máximo por termo)">
                                <p>
                                    Cada termo da saída fica com o maior grau
                                    entre as regras que levam a ele:
                                </p>
                                <ul className="tabular mt-3 flex flex-wrap gap-x-5 gap-y-1">
                                    {system.output.terms.map((t) => (
                                        <li
                                            key={t.name}
                                            className="flex items-center gap-1.5"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="inline-block h-2.5 w-2.5 rounded-[2px]"
                                                style={{
                                                    backgroundColor: outputColor(
                                                        t.name,
                                                    ),
                                                }}
                                            />
                                            {term(t.name)}{" "}
                                            <b className="font-semibold text-ink">
                                                {formatNumber(
                                                    selected.explanation.activation[
                                                        t.name
                                                    ],
                                                )}
                                            </b>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-3 text-muted">
                                    No gráfico do passo 4, cada termo é cortado
                                    nesse grau e os cortes são unidos (a área
                                    preenchida).
                                </p>
                            </Step>

                            <Step step={4} title="Defuzzificação (centróide)">
                                <AggregatedChart
                                    output={system.output}
                                    explanation={selected.explanation}
                                />
                                <p className="tabular mt-3">
                                    Centróide Σ z·μ(z) / Σ μ(z) ={" "}
                                    <b className="figure text-[22px] font-bold text-ink">
                                        {formatNumber(
                                            selected.explanation.centroid,
                                        )}
                                    </b>
                                    , que é{" "}
                                    {system.output.terms
                                        .filter(
                                            (t) =>
                                                selected.explanation
                                                    .output_degrees[t.name] > 0,
                                        )
                                        .map(
                                            (t) =>
                                                `${term(t.name)} com grau ${formatNumber(selected.explanation.output_degrees[t.name])}`,
                                        )
                                        .join(" e ")}
                                    . Prioridade{" "}
                                    <span
                                        className={`stamp ${priorityStamp(selected.explanation.label).className}`}
                                    >
                                        {priorityStamp(selected.explanation.label).label}
                                    </span>
                                </p>
                            </Step>
                        </ol>
                    </>
                ) : (
                    <div className="sheet mt-4 p-8">
                        <p className="font-semibold">
                            Nenhum tópico praticado ainda
                        </p>
                        <p className="mt-1 text-[15px] text-ink-soft">
                            Responda questões para ver o cálculo da prioridade
                            de um tópico, passo a passo.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

/** Um dos 4 passos: o número carrega a ordem da inferência. */
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
        <li className="sheet flex gap-4 p-5">
            <span
                aria-hidden="true"
                className="figure w-6 shrink-0 text-[34px] text-muted"
            >
                {step}
            </span>
            <div className="min-w-0 flex-1">
                <h3 className="text-[17px] font-semibold">
                    <span className="sr-only">Passo {step}: </span>
                    {title}
                </h3>
                <div className="mt-3 text-[15px] leading-6 text-ink-soft">
                    {children}
                </div>
            </div>
        </li>
    );
}

function RulesMatrix({
    rows,
    columns,
    rules,
    fired,
    outputColor,
}: {
    rows: string[];
    columns: string[];
    rules: RuleCell[];
    fired: (RuleCell & { strength: number })[];
    outputColor: (name: string) => string;
}) {
    const find = <T extends RuleCell>(list: T[], row: string, column: string) =>
        list.find((rule) => rule.acerto === row && rule.recencia === column);

    return (
        <div className="sheet overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-[14px] sm:text-[15px]">
                <thead>
                    <tr className="border-b border-rule-soft text-[13px] text-muted">
                        <th scope="col" className="w-[4.75rem] px-3 py-3 text-left font-semibold sm:w-[26%] sm:px-4">
                            Acerto \ Recência
                        </th>
                        {columns.map((column) => (
                            <th
                                key={column}
                                scope="col"
                                className="px-2 py-3 text-left font-semibold"
                            >
                                {term(column)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row} className="border-b border-rule-soft last:border-0">
                            <th
                                scope="row"
                                className="px-3 py-2 text-left font-semibold text-ink sm:px-4"
                            >
                                {term(row)}
                            </th>
                            {columns.map((column) => {
                                const strength =
                                    find(fired, row, column)?.strength ?? 0;
                                const consequent =
                                    find(rules, row, column)?.prioridade ?? "";

                                return (
                                    <td key={column} className="p-1 sm:p-1.5">
                                        <div
                                            className={`flex min-h-16 flex-col justify-center rounded px-2 py-2 sm:px-3 ${
                                                strength > 0
                                                    ? "bg-sheet ring-2 ring-ink ring-inset"
                                                    : "bg-paper"
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5 font-semibold text-ink">
                                                <span
                                                    aria-hidden="true"
                                                    className="inline-block h-2.5 w-2.5 rounded-[2px]"
                                                    style={{
                                                        backgroundColor:
                                                            outputColor(consequent),
                                                    }}
                                                />
                                                {term(consequent)}
                                            </span>
                                            {strength > 0 && (
                                                <span className="tabular text-[13px] text-ink-soft">
                                                    <span className="hidden sm:inline">disparou com </span>grau{" "}
                                                    {formatNumber(strength)}
                                                </span>
                                            )}
                                        </div>
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
 * com a linha do centróide.
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
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis
                        type="number"
                        dataKey="x"
                        domain={[output.min, output.max]}
                        ticks={breakpoints(output)}
                        axisLine={{ stroke: CHART.axis }}
                        tickLine={false}
                        tick={{ fill: CHART.text, fontSize: 12 }}
                        tickMargin={6}
                    />
                    <YAxis
                        domain={[0, 1]}
                        ticks={[0, 0.5, 1]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: CHART.text, fontSize: 12 }}
                        tickFormatter={(value) => String(value).replace(".", ",")}
                    />
                    {output.terms.map((t, index) => (
                        <Line
                            key={t.name}
                            data={trapezoidPoints(t.points)}
                            dataKey="y"
                            type="linear"
                            stroke={CHART.output[index % CHART.output.length]}
                            strokeDasharray="3 3"
                            strokeWidth={1.25}
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
                        stroke={CHART.ink}
                        strokeWidth={1.5}
                        fill={CHART.ink}
                        fillOpacity={0.12}
                        isAnimationActive={false}
                    />
                    <ReferenceLine
                        x={explanation.centroid}
                        stroke={CHART.marker}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
