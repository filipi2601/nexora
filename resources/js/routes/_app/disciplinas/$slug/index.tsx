import { createFileRoute, useNavigate } from "@tanstack/react-router";
import BackLink from "@/components/BackLink";
import KnowledgeTreeView from "@/components/KnowledgeTreeView";
import PageLoading from "@/components/PageLoading";
import SubjectBand from "@/components/SubjectBand";
import TopicOutline from "@/components/TopicOutline";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";

export const Route = createFileRoute("/_app/disciplinas/$slug/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { slug } = Route.useParams();
    const { data: subject } = useQuery({
        queryKey: ["subject", slug],
        queryFn: async () => {
            const response = await api.get(`/api/subject/${slug}`);
            return response.data;
        },
    });

    const navigate = useNavigate();
    const colors = useSubjectColors();
    const color = colors.byId(subject?.id);
    const progress = Math.max(0, Math.min(100, subject?.progress ?? 0));

    if (!subject) {
        return <PageLoading />;
    }

    return (
        <div className="page">
            <BackLink to="/disciplinas" label="Disciplinas" />

            <SubjectBand
                color={color}
                title={subject?.name}
                description="Tópicos extraídos pela IA a partir dos seus materiais."
                aside={
                    <>
                        <p className="flex items-baseline justify-between gap-3 text-sm text-white/85">
                            Progresso geral
                            <span className="figure text-[34px] text-white">
                                {subject?.progress ?? 0}%
                            </span>
                        </p>
                        {/* Na faixa, a barra é branca sobre um trilho translúcido. */}
                        <div
                            role="progressbar"
                            aria-valuenow={Math.round(progress)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Progresso geral"
                            className="mt-2.5 h-1 overflow-hidden bg-white/30"
                        >
                            <div
                                className="h-full bg-white transition-[width] duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </>
                }
            >
                        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/85">
                            <span>
                                <b className="font-semibold text-white">
                                    {subject?.topics_count ?? 0}
                                </b>{" "}
                                tópicos
                            </span>
                            <span>
                                <b className="font-semibold text-white">
                                    {subject?.flashcards_count ?? 0}
                                </b>{" "}
                                flashcards
                            </span>
                            <span>
                                <b className="font-semibold text-white">
                                    {subject?.questions_count ?? 0}
                                </b>{" "}
                                questões
                            </span>
                        </p>
            </SubjectBand>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
                <section aria-labelledby="knowledge-map" className="min-w-0">
                    <h2 id="knowledge-map" className="section-title mb-4">
                        Mapa de conhecimento
                    </h2>
                    <div className="sheet p-3 sm:p-4">
                        <KnowledgeTreeView
                            topics={subject?.topics ?? []}
                            color={color}
                            onSelect={(topicSlug: string) =>
                                navigate({
                                    to: "/disciplinas/$slug/topico/$topicSlug",
                                    params: {
                                        slug,
                                        topicSlug,
                                    },
                                })
                            }
                        />
                    </div>
                </section>

                <section aria-labelledby="subject-topics" className="min-w-0">
                    <h2 id="subject-topics" className="section-title mb-4">
                        Tópicos da disciplina
                    </h2>
                    <div className="sheet p-2">
                        <TopicOutline topics={subject?.topics ?? []} />
                    </div>
                </section>
            </div>
        </div>
    );
}
