import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowRight,
    Flame,
    Clock3,
    Layers3,
    CircleHelp,
    LifeBuoy,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/")({
    component: Index,
});

type Dashboard = {
    user: { name: string; current_streak: number };
    overall_mastery: number | null;
    week_study_time: string;
    due_flashcards: number;
    recommended_questions: number;
};

function getGreeting(date: Date): string {
    const hour = date.getHours();

    if (hour < 12) {
        return "Bom dia";
    }

    if (hour < 18) {
        return "Boa tarde";
    }

    return "Boa noite";
}

function Index() {
    const { data: dashboard } = useQuery<Dashboard>({
        queryKey: ["dashboard"],
        queryFn: async () => (await api.get("/api/dashboard")).data,
        staleTime: 0,
    });

    const mastery = dashboard?.overall_mastery ?? null;
    const currentStreak = dashboard?.user.current_streak ?? 0;
    const weekStudyTime = dashboard?.week_study_time ?? "—";

    const today = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date());

    const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

    return (
        <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow={formattedDate}
                title={`${getGreeting(new Date())}, ${dashboard?.user.name ?? "estudante"}!`}
                description="Continue avançando, um conceito de cada vez."
                action={
                    <Link
                        to="/como-usar"
                        className="-ml-2 inline-flex min-h-10 shrink-0 items-center gap-1.5 px-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                        <LifeBuoy size={16} />
                        Como usar o app
                    </Link>
                }
            />

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                        Continue de onde parou
                    </p>

                    <h2 className="mt-5 text-2xl font-bold">
                        Seu próximo estudo
                    </h2>

                    <p className="mt-1 text-slate-400">
                        Escolha uma atividade para continuar seus estudos.
                    </p>

                    <Link
                        to="/estudar"
                        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-indigo-50"
                    >
                        Começar a estudar <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="rounded-3xl border bg-white p-7">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Seu progresso
                    </p>

                    <div className="mt-5 flex items-end gap-3">
                        <span className="text-5xl font-bold">
                            {mastery !== null ? `${Math.round(mastery)}%` : "—"}
                        </span>

                        <span className="pb-1 text-sm text-slate-400">
                            domínio geral
                        </span>
                    </div>

                    <div className="mt-8 space-y-4 border-t pt-5 text-sm">
                        <p className="flex items-center gap-3">
                            <Flame className="text-orange-500" size={19} />

                            <span>
                                <b>{currentStreak}</b>{" "}
                                {currentStreak === 1 ? "dia" : "dias"} de
                                sequência
                            </span>
                        </p>

                        <p className="flex items-center gap-3">
                            <Clock3 className="text-indigo-500" size={19} />

                            <span>
                                <b>{weekStudyTime}</b> esta semana
                            </span>
                        </p>
                    </div>
                </div>
            </section>

            <h2 className="mb-4 mt-9 text-lg font-bold">
                Recomendado para hoje
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
                <Link
                    to="/flashcards"
                    className="group flex items-center gap-4 rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <Layers3 className="text-indigo-600" />

                    <div>
                        <b>{dashboard?.due_flashcards ?? "—"} flashcards</b>

                        <p className="text-sm text-slate-400">para revisar</p>
                    </div>
                </Link>

                <Link
                    to="/questoes"
                    className="group flex items-center gap-4 rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <CircleHelp className="text-sky-600" />

                    <div>
                        <b>
                            {dashboard?.recommended_questions ?? "—"} questões
                        </b>

                        <p className="text-sm text-slate-400">para praticar</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
