import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Layers3, CircleHelp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import KnowledgeTreeView from "@/components/KnowledgeTreeView";
import TopicOutline from "@/components/TopicOutline";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

    return (
        <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-12">
            <Link
                to="/disciplinas"
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ArrowLeft size={16} />
                Disciplinas
            </Link>
            <PageHeader
                eyebrow="Disciplina"
                title={subject?.name}
                description="Tópicos extraídos pela IA a partir dos seus materiais."
                action={
                    <div className="text-right">
                        <p className="text-xs text-slate-400">Progresso</p>
                        <p className="text-2xl font-bold">
                            {subject?.progress ?? 0}%
                        </p>
                    </div>
                }
            />
            <div className="space-y-5">
                <section className="min-w-0 rounded-3xl border bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] p-4">
                    <h2 className="mb-3 px-2 text-sm font-bold">
                        Mapa de conhecimento
                    </h2>
                    <KnowledgeTreeView
                        topics={subject?.topics ?? []}
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
                </section>
                <aside className="space-y-5">
                    <div className="rounded-3xl border bg-white p-5">
                        <h2 className="mb-3 text-sm font-bold">
                            Tópicos da disciplina
                        </h2>
                        <TopicOutline topics={subject?.topics ?? []} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border bg-white p-4">
                            <Layers3
                                className="mb-2 text-indigo-500"
                                size={18}
                            />
                            <b className="text-sm">
                                {subject?.flashcards_count ?? 0} flashcards
                            </b>
                        </div>
                        <div className="rounded-2xl border bg-white p-4">
                            <CircleHelp
                                className="mb-2 text-sky-500"
                                size={18}
                            />
                            <b className="text-sm">
                                {subject?.questions_count ?? 0} questões
                            </b>
                        </div>
                    </div>
                </aside>
            </div>
            <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs">
                    <span>Progresso geral</span>
                    <b>{subject?.progress ?? 0}%</b>
                </div>
                <ProgressBar value={subject?.progress ?? 0} />
            </div>
        </div>
    );
}
