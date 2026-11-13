import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * As cores das disciplinas, como as capas de uma coleção de livros didáticos.
 * Tinta chapada, com branco legível por cima. Os valores repetem os tokens
 * --color-subject-* do app.css, porque gráficos e estilos inline precisam do valor.
 */
export const SUBJECT_COLORS = [
    "#1e5fbf",
    "#0b7a54",
    "#c2410c",
    "#b0245a",
    "#0b6e80",
    "#6741d9",
    "#8a6a00",
    "#4a5160",
] as const;

const FALLBACK_COLOR = "#4a5160";

type SubjectRef = { id: number; name: string };

/**
 * A cor de cada disciplina do estudante, na ordem em que foram criadas: a mesma
 * disciplina tem sempre a mesma cor em todas as telas. Usa a mesma consulta (e o
 * mesmo cache) da lista de disciplinas.
 */
export function useSubjectColors() {
    const { data } = useQuery({
        queryKey: ["subjects"],
        queryFn: async () => {
            const response = await api.get("/api/subjects");
            return response.data;
        },
    });

    return useMemo(() => {
        const byId = new Map<number, string>();
        const byName = new Map<string, string>();

        [...((data ?? []) as SubjectRef[])]
            .sort((a, b) => a.id - b.id)
            .forEach((subject, index) => {
                const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
                byId.set(subject.id, color);
                byName.set(subject.name, color);
            });

        return {
            byId: (id?: number | null) =>
                (id != null && byId.get(id)) || FALLBACK_COLOR,
            byName: (name?: string | null) =>
                (name && byName.get(name)) || FALLBACK_COLOR,
        };
    }, [data]);
}

/** A inicial que vai na lombada: a primeira letra da primeira palavra que não é artigo. */
export function subjectInitial(name?: string | null): string {
    const skip = new Set(["a", "o", "as", "os", "de", "da", "do", "e"]);
    const word =
        (name ?? "")
            .trim()
            .split(/\s+/)
            .find((part) => !skip.has(part.toLowerCase())) ?? name ?? "";

    return word.charAt(0).toUpperCase() || "?";
}
