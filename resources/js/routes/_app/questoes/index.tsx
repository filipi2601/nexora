import { createFileRoute, Link } from "@tanstack/react-router";
import {
    Target,
    BookOpen,
    Flame,
    FileCheck2,
    RefreshCw,
    Database,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

export const Route = createFileRoute("/_app/questoes/")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow="Prática ativa"
                title="Questões"
                description="Pratique de forma direcionada e transforme cada erro em aprendizado."
                action={
                    <Link
                        to="/questoes/banco"
                        className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold hover:border-indigo-300"
                    >
                        <Database size={16} />
                        Banco de questões
                    </Link>
                }
            />
            <div className="grid gap-4 sm:grid-cols-2">
                <Link
                    to="/questoes/praticar/recomendadas"
                    className="rounded-2xl border bg-white p-6 hover:border-indigo-300"
                >
                    <Target className="text-indigo-600" />
                    <h2 className="mt-5 font-bold">Recomendadas</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Melhores questões para você
                    </p>
                </Link>
                <Link
                    to="/questoes/disciplina"
                    className="rounded-2xl border bg-white p-6 hover:border-indigo-300"
                >
                    <BookOpen className="text-indigo-600" />
                    <h2 className="mt-5 font-bold">Por disciplina</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Escolha um conteúdo
                    </p>
                </Link>
                <Link
                    to="/questoes/praticar/erradas"
                    className="rounded-2xl border bg-white p-6 hover:border-indigo-300"
                >
                    <Flame className="text-indigo-600" />
                    <h2 className="mt-5 font-bold">Erradas recentemente</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Questões para reforçar
                    </p>
                </Link>
                <div className="rounded-2xl border border-dashed bg-white p-6 opacity-70">
                    <FileCheck2 className="text-slate-400" />
                    <h2 className="mt-5 font-bold">Simulados</h2>
                    <p className="mt-1 text-sm text-slate-400">Em breve</p>
                </div>
            </div>
            <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-3xl bg-indigo-50 p-7 sm:flex-row sm:items-center">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                        Prática inteligente
                    </p>
                    <h2 className="mt-2 text-xl font-bold">
                        Iniciar sessão de estudos
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Estude de forma inteligente e eficiente, focando no que
                        você mais precisa aprender.
                    </p>
                </div>
                <Link
                    to="/estudar"
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                >
                    <RefreshCw size={17} />
                    Estudar
                </Link>
            </div>
        </div>
    );
}
