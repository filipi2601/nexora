/**
 * A prioridade de revisão (lógica fuzzy) como carimbo e como marca-texto: o rótulo
 * com acento, a classe do carimbo e a cor do grifo de cada termo.
 * Alta é vermelho/rosa, média é âmbar/amarelo, baixa é verde.
 */
export const PRIORITY_STAMP: Record<
    string,
    { label: string; className: string; markClassName: string }
> = {
    alta: { label: "Alta", className: "stamp-error", markClassName: "mark-pink" },
    media: { label: "Média", className: "stamp-wait", markClassName: "" },
    baixa: { label: "Baixa", className: "stamp-ok", markClassName: "mark-green" },
};

export const priorityStamp = (label?: string | null) =>
    PRIORITY_STAMP[label ?? ""] ?? PRIORITY_STAMP.baixa;
