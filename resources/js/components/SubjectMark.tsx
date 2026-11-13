import { subjectInitial } from "@/lib/subject-colors";

const SIZES = {
    sm: "h-6 w-6 text-[13px]",
    md: "h-9 w-9 text-lg",
    lg: "h-12 w-12 text-2xl",
} as const;

/**
 * A lombada de uma disciplina: um bloco na cor da capa do livro com a inicial.
 * Marca tudo o que pertence à disciplina (tópicos, materiais, flashcards, questões).
 */
export default function SubjectMark({
    name,
    color,
    size = "md",
    className = "",
}: {
    name?: string | null;
    color: string;
    size?: keyof typeof SIZES;
    className?: string;
}) {
    return (
        <span
            aria-hidden="true"
            className={`grid shrink-0 place-items-center rounded-sm font-display leading-none font-bold text-white ${SIZES[size]} ${className}`}
            style={{ backgroundColor: color }}
        >
            {subjectInitial(name)}
        </span>
    );
}
