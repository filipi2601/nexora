import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ReferenceLine,
    ResponsiveContainer,
} from "recharts";
import type { FuzzyTerm, FuzzyVariable } from "@/types/api";

/**
 * Os pontos (x, μ) que desenham um termo trapezoidal, como nas figuras dos slides 20 a 22.
 * Nos "ombros" (a = b ou c = d) a linha começa ou termina no topo, sem subir na vertical.
 */
export function trapezoidPoints([a, b, c, d]: FuzzyTerm["points"]) {
    const points: { x: number; y: number }[] = [];

    if (a !== b) {
        points.push({ x: a, y: 0 });
    }

    points.push({ x: b, y: 1 }, { x: c, y: 1 });

    if (c !== d) {
        points.push({ x: d, y: 0 });
    }

    return points;
}

/**
 * Os pontos de quebra de todos os termos (0, 3, 10, 17, 30 na recência), usados como marcas do eixo x.
 */
export function breakpoints(variable: FuzzyVariable) {
    return [...new Set(variable.terms.flatMap((term) => term.points))].sort(
        (a, b) => a - b,
    );
}

/**
 * As funções de pertinência de uma variável linguística, com uma linha tracejada no valor atual.
 */
export default function FuzzyChart({
    variable,
    colors,
    marker,
    formatTerm,
}: {
    variable: FuzzyVariable;
    colors: string[];
    marker?: number;
    formatTerm: (term: string) => string;
}) {
    return (
        <div>
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        margin={{ top: 8, right: 12, bottom: 0, left: -24 }}
                    >
                        <XAxis
                            type="number"
                            dataKey="x"
                            domain={[variable.min, variable.max]}
                            ticks={breakpoints(variable)}
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
                        {variable.terms.map((term, index) => (
                            <Line
                                key={term.name}
                                data={trapezoidPoints(term.points)}
                                dataKey="y"
                                type="linear"
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        ))}
                        {marker !== undefined && (
                            <ReferenceLine
                                x={marker}
                                stroke="#0f172a"
                                strokeDasharray="4 4"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                {variable.terms.map((term, index) => (
                    <span key={term.name} className="flex items-center gap-1.5">
                        <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{
                                backgroundColor: colors[index % colors.length],
                            }}
                        />
                        {formatTerm(term.name)}
                    </span>
                ))}
            </div>
        </div>
    );
}