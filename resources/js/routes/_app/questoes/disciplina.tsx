import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import BackLink from "@/components/BackLink";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/questoes/disciplina")({
    loader: async () => {
        const response = await api.get("/api/subjects/questions");
        return response.data;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const navigate = useNavigate();
    const subjects = Route.useLoaderData();
    const [slug, setSlug] = useState(subjects[0]?.slug || "");
    return (
        <div className="page page-narrow">
            <BackLink to="/questoes" />
            <PageHeader
                title="Por disciplina"
                description="Escolha uma disciplina para começar a responder."
            />
            <div className="sheet max-w-md p-6">
                {subjects.length === 0 ? (
                    <p className="text-[15px] text-ink-soft">
                        Nenhuma disciplina encontrada.
                    </p>
                ) : (
                    <>
                        <label
                            htmlFor="practice-subject"
                            className="field-label"
                        >
                            Disciplina
                        </label>
                        <select
                            id="practice-subject"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="field"
                        >
                            {subjects.map(
                                (s: { slug: string; name: string }) => (
                                    <option key={s.slug} value={s.slug}>
                                        {s.name}
                                    </option>
                                ),
                            )}
                        </select>
                        <button
                            type="button"
                            onClick={() =>
                                navigate({
                                    to: `/questoes/praticar/disciplina/${slug}`,
                                })
                            }
                            className="btn btn-primary mt-5 w-full"
                        >
                            Começar
                            <ArrowRight size={16} aria-hidden="true" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
