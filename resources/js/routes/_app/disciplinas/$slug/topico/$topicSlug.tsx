import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, BookOpen, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

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

    return (
        <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12">
            <Link
                to="/disciplinas/$slug"
                params={{ slug }}
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ArrowLeft size={16} />
                Voltar para disciplina
            </Link>
            {topic ? (
                <>
                    <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-400">
                        {topic.ancestors.map((ancestor: any) => (
                            <span key={ancestor.id} className="flex items-center gap-1">
                                <Link
                                    to="/disciplinas/$slug/topico/$topicSlug"
                                    params={{ slug, topicSlug: ancestor.slug }}
                                    className="transition hover:text-slate-700"
                                >
                                    {ancestor.name}
                                </Link>
                                <ChevronRight size={13} />
                            </span>
                        ))}

                        <span className="font-semibold text-slate-700">
                            {topic.name}
                        </span>
                    </nav>

                    <PageHeader
                        eyebrow="Tópico"
                        title={topic.name}
                        description="Conceito extraído pela IA a partir dos seus materiais."
                    />

                    <section className="rounded-3xl border bg-white p-6 sm:p-8">
                        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
                            <BookOpen size={16} />
                            Resumo
                        </div>

                        <p className="mt-4 text-sm leading-7 text-slate-600">
                            {topic.description}
                        </p>
                    </section>

                    <section className="mt-5 rounded-3xl border bg-white p-6">
                        <h2 className="text-sm font-bold">Subtópicos</h2>

                        {topic.children?.length > 0 ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {topic.children.map((child: any) => (
                                    <Link
                                        key={child.id}
                                        to="/disciplinas/$slug/topico/$topicSlug"
                                        params={{
                                            slug,
                                            topicSlug: child.slug,
                                        }}
                                        className="flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold hover:border-indigo-300 hover:bg-indigo-50/50"
                                    >
                                        <FileText
                                            size={16}
                                            className="text-indigo-500"
                                        />

                                        {child.name}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-slate-400">
                                Este tópico não possui subtópicos — é um
                                conceito final do mapa.
                            </p>
                        )}
                    </section>
                </>
            ) : (
                <p className="text-sm text-slate-400">
                    Tópico não encontrado. Verifique se o link está correto.
                </p>
            )}
        </div>
    );
}
