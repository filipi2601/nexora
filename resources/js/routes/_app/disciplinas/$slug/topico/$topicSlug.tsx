import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import BackLink from "@/components/BackLink";
import SubjectBand from "@/components/SubjectBand";
import { api } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";
import type { Subject } from "@/types/api";

export const Route = createFileRoute("/_app/disciplinas/$slug/topico/$topicSlug")(
    {
        loader: async ({ params }) => {
            const response = await api.get(
                `/api/subject/${params.slug}/topic/${params.topicSlug}`,
            );
            return response.data;
        },
        component: RouteComponent,
    },
);

function RouteComponent() {
    const { slug, topicSlug } = Route.useParams();
    const { data: topic } = Route.useLoaderData();
    const { data: subjects } = useQuery<Subject[]>({
        queryKey: ["subjects"],
        queryFn: async () => (await api.get("/api/subjects")).data,
    });
    const colors = useSubjectColors();
    const subject = subjects?.find((item) => item.slug === slug);
    const color = colors.byId(subject?.id);

    return (
        <div className="page page-narrow">
            <BackLink
                to={`/disciplinas/${slug}`}
                label="Voltar para disciplina"
            />
            {topic ? (
                <>
                    <SubjectBand
                        color={color}
                        title={topic.name}
                        description="Conceito extraído pela IA a partir dos seus materiais."
                        breadcrumb={
                        <nav aria-label="Caminho do tópico" className="mb-3">
                            <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-white/85">
                                {subject && (
                                    <li className="flex items-center gap-1">
                                        <Link
                                            to="/disciplinas/$slug"
                                            params={{ slug }}
                                            className="font-semibold underline decoration-white/40 underline-offset-3 transition-colors hover:text-white hover:decoration-white"
                                        >
                                            {subject.name}
                                        </Link>
                                        <ChevronRight
                                            size={14}
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                        />
                                    </li>
                                )}
                                {topic.ancestors.map((ancestor: any) => (
                                    <li
                                        key={ancestor.id}
                                        className="flex items-center gap-1"
                                    >
                                        <Link
                                            to="/disciplinas/$slug/topico/$topicSlug"
                                            params={{
                                                slug,
                                                topicSlug: ancestor.slug,
                                            }}
                                            className="underline decoration-white/40 underline-offset-3 transition-colors hover:text-white hover:decoration-white"
                                        >
                                            {ancestor.name}
                                        </Link>
                                        <ChevronRight
                                            size={14}
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                        />
                                    </li>
                                ))}
                                <li aria-current="page" className="text-white">
                                    {topic.name}
                                </li>
                            </ol>
                        </nav>
                        }
                    />

                    <section aria-labelledby="topic-summary">
                        <h2 id="topic-summary" className="section-title mb-4">
                            Resumo
                        </h2>
                        <div className="sheet p-6 sm:p-7">
                            <p className="max-w-[65ch] text-base leading-7 text-ink-soft">
                                {topic.description}
                            </p>
                        </div>
                    </section>

                    <section aria-labelledby="topic-children" className="mt-10">
                        <h2 id="topic-children" className="section-title mb-4">
                            Subtópicos
                        </h2>

                        {topic.children?.length > 0 ? (
                            <ul className="sheet row-divider">
                                {topic.children.map((child: any) => (
                                    <li key={child.id}>
                                        <Link
                                            to="/disciplinas/$slug/topico/$topicSlug"
                                            params={{
                                                slug,
                                                topicSlug: child.slug,
                                            }}
                                            className="flex min-h-12 items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-paper"
                                        >
                                            <span className="min-w-0 font-semibold">
                                                {child.name}
                                            </span>
                                            <ChevronRight
                                                size={16}
                                                strokeWidth={1.75}
                                                aria-hidden="true"
                                                className="shrink-0 text-muted"
                                            />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="sheet p-6 text-[15px] text-ink-soft">
                                Este tópico não possui subtópicos — é um
                                conceito final do mapa.
                            </p>
                        )}
                    </section>
                </>
            ) : (
                <p className="sheet p-6 text-[15px] text-ink-soft">
                    Tópico não encontrado. Verifique se o link está correto.
                </p>
            )}
        </div>
    );
}
