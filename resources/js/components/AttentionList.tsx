import { Link } from "@tanstack/react-router";
import SubjectMark from "@/components/SubjectMark";
import { priorityStamp } from "@/lib/priority";
import { useSubjectColors } from "@/lib/subject-colors";

export type AttentionArea = {
    topic_id: number;
    name: string;
    subject: string;
    percent: number;
    priority: number;
    label: string;
};

/**
 * Os tópicos que mais precisam de revisão, pela prioridade fuzzy. Cada linha tem a
 * mesma mobília: lombada da disciplina, nome grifado na cor da prioridade,
 * prioridade com o carimbo do termo, acerto.
 * Clicar abre a explicação do cálculo daquele tópico.
 */
export default function AttentionList({ areas }: { areas: AttentionArea[] }) {
    const colors = useSubjectColors();

    return (
        <ol className="sheet row-divider">
            <li
                aria-hidden="true"
                className="hidden grid-cols-[1fr_9rem_6rem] gap-4 px-5 py-2.5 text-[13px] font-semibold text-muted sm:grid"
            >
                <span>Tópico</span>
                <span>Prioridade</span>
                <span className="text-right">Acerto</span>
            </li>
            {areas.map((area) => {
                const stamp = priorityStamp(area.label);

                return (
                    <li key={area.topic_id}>
                        <Link
                            to="/desempenho/prioridade"
                            search={{ topico: area.topic_id }}
                            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-paper sm:grid-cols-[1fr_9rem_6rem]"
                        >
                            <span className="flex min-w-0 items-center gap-3">
                                <SubjectMark
                                    name={area.subject}
                                    color={colors.byName(area.subject)}
                                    size="sm"
                                />
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold">
                                        <mark
                                            className={`mark ${stamp.markClassName}`}
                                        >
                                            {area.name}
                                        </mark>
                                    </span>
                                    <span className="block truncate text-[13px] text-muted">
                                        {area.subject}
                                    </span>
                                </span>
                            </span>
                            <span className="flex items-center gap-2.5">
                                <span className="figure text-[28px]">
                                    {area.priority}
                                </span>
                                <span className={`stamp ${stamp.className}`}>
                                    {stamp.label}
                                </span>
                            </span>
                            <span className="col-span-2 text-sm text-muted sm:col-span-1 sm:text-right">
                                {area.percent}% de acerto
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ol>
    );
}
