import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Database } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export const Route = createFileRoute("/_app/questoes/")({
    component: RouteComponent,
});

const PRACTICE_MODES = [
    {
        to: "/questoes/praticar/recomendadas",
        title: "Recomendadas",
        description: "Melhores questões para você",
    },
    {
        to: "/questoes/disciplina",
        title: "Por disciplina",
        description: "Escolha um conteúdo",
    },
    {
        to: "/questoes/praticar/erradas",
        title: "Erradas recentemente",
        description: "Questões para reforçar",
    },
] as const;

function RouteComponent() {
    return (
        <div className="page">
            <PageHeader
                title="Questões"
                description="Pratique de forma direcionada e transforme cada erro em aprendizado."
                action={
                    <Link to="/questoes/banco" className="btn btn-secondary">
                        <Database
                            size={16}
                            strokeWidth={1.75}
                            aria-hidden="true"
                        />
                        Banco de questões
                    </Link>
                }
            />

            <section aria-labelledby="practice-modes">
                <h2 id="practice-modes" className="section-title mb-4">
                    Praticar
                </h2>
                <ul className="sheet row-divider">
                    {PRACTICE_MODES.map((mode) => (
                        <li key={mode.to}>
                            <Link
                                to={mode.to}
                                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold">
                                        {mode.title}
                                    </span>
                                    <span className="block text-[13px] text-muted">
                                        {mode.description}
                                    </span>
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
                    <li
                        aria-disabled="true"
                        className="flex items-center gap-4 px-5 py-4"
                    >
                        <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-muted">
                                Simulados
                            </span>
                        </span>
                        <span className="stamp stamp-idle">Em breve</span>
                    </li>
                </ul>
            </section>

            <section
                aria-labelledby="study-session"
                className="sheet mt-10 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
            >
                <div>
                    <h2 id="study-session" className="section-title">
                        Iniciar sessão de estudos
                    </h2>
                    <p className="mt-2 max-w-[60ch] text-[15px] leading-6 text-ink-soft">
                        Estude de forma inteligente e eficiente, focando no que
                        você mais precisa aprender.
                    </p>
                </div>
                <Link to="/estudar" className="btn btn-primary shrink-0">
                    Estudar
                    <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </section>
        </div>
    );
}
