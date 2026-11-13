import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LifeBuoy } from "lucide-react";

import AttentionList, { type AttentionArea } from "@/components/AttentionList";
import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import { api } from "@/lib/api";
import { subjectInitial, useSubjectColors } from "@/lib/subject-colors";
import type { Subject } from "@/types/api";

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

    const { data: performance } = useQuery<{ attention_areas: AttentionArea[] }>({
        queryKey: ["performance"],
        queryFn: async () => (await api.get("/api/performance")).data,
        staleTime: 0,
    });

    const { data: subjects } = useQuery<Subject[]>({
        queryKey: ["subjects"],
        queryFn: async () => (await api.get("/api/subjects")).data,
    });

    const colors = useSubjectColors();

    const firstName = dashboard?.user.name?.trim().split(/\s+/)[0];
    const streak = dashboard?.user.current_streak ?? 0;
    const mastery = dashboard?.overall_mastery ?? null;
    const dueFlashcards = dashboard?.due_flashcards ?? 0;
    const questions = dashboard?.recommended_questions ?? 0;
    const pendingItems = dueFlashcards + questions;
    const hasPending = pendingItems > 0;

    const today = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date());

    const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);
    const attention = performance?.attention_areas ?? [];

    return (
        <div className="page">
            <PageHeader
                title={
                    <>
                        {getGreeting(new Date())}
                        {firstName ? `, ${firstName}` : ""}.
                        {hasPending && (
                            <>
                                {" "}Hoje,{" "}
                                <mark className="mark">
                                    {pendingItems}{" "}
                                    {pendingItems === 1 ? "item" : "itens"}
                                </mark>{" "}
                                para revisar.
                            </>
                        )}
                    </>
                }
                description={
                    <>
                        {formattedDate}.{" "}
                        {streak > 0
                            ? `Você estuda há ${streak} ${streak === 1 ? "dia seguido" : "dias seguidos"}.`
                            : "Estude hoje para começar uma sequência."}
                    </>
                }
                action={
                    <Link to="/como-usar" className="btn btn-ghost hidden sm:inline-flex">
                        <LifeBuoy size={16} aria-hidden="true" />
                        Como usar o app
                    </Link>
                }
            />

            <section
                aria-labelledby="next-study"
                className="sheet grid lg:grid-cols-[1fr_auto]"
            >
                <div className="p-6 sm:p-7">
                    <h2 id="next-study" className="section-title">
                        Seu próximo estudo
                    </h2>

                    {dashboard && !hasPending ? (
                        <p className="mt-3 max-w-[60ch] text-[17px] leading-7 text-ink-soft">
                            Nada pendente agora. Gere flashcards ou questões a
                            partir dos seus materiais para ter o que revisar.
                        </p>
                    ) : (
                        <p className="mt-3 text-[17px] leading-8 text-ink-soft">
                            <span className="figure text-[30px] text-ink">
                                {dashboard ? dueFlashcards : "–"}
                            </span>{" "}
                            {dueFlashcards === 1 ? "flashcard" : "flashcards"}{" "}
                            para revisar e{" "}
                            <span className="figure text-[30px] text-ink">
                                {dashboard ? questions : "–"}
                            </span>{" "}
                            {questions === 1 ? "questão" : "questões"} para
                            praticar.
                        </p>
                    )}

                    <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                        <span>
                            <b className="font-semibold text-ink">
                                {mastery !== null ? `${Math.round(mastery)}%` : "–"}
                            </b>{" "}
                            de acerto nas questões
                        </span>
                        <span>
                            <b className="font-semibold text-ink">
                                {dashboard?.week_study_time ?? "–"}
                            </b>{" "}
                            de estudo nesta semana
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-rule-soft p-6 sm:p-7 lg:flex-col lg:items-stretch lg:justify-center lg:border-t-0 lg:border-l">
                    <Link to="/estudar" className="btn btn-primary">
                        Começar sessão
                        <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    <Link to="/flashcards" className="btn btn-ghost">
                        Revisar flashcards
                    </Link>
                </div>
            </section>

            <section aria-labelledby="review-first" className="mt-12">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h2 id="review-first" className="section-title">
                        Revise primeiro
                    </h2>
                    <Link to="/desempenho/prioridade" className="link py-1 text-sm">
                        Como a prioridade é calculada
                    </Link>
                </div>

                {!performance ? (
                    <div
                        aria-hidden="true"
                        className="sheet h-40 animate-pulse bg-rule-soft/40"
                    />
                ) : attention.length === 0 ? (
                    <div className="sheet p-6 text-[15px] text-ink-soft">
                        Responda algumas questões para o app saber quais tópicos
                        você precisa revisar.{" "}
                        <Link to="/questoes" className="link">
                            Ir para Questões
                        </Link>
                    </div>
                ) : (
                    <AttentionList areas={attention} />
                )}
            </section>

            <section aria-labelledby="subjects" className="mt-12">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h2 id="subjects" className="section-title">
                        Disciplinas
                    </h2>
                    <Link to="/disciplinas" className="link py-1 text-sm">
                        Ver todas
                    </Link>
                </div>

                {!subjects ? (
                    <div
                        aria-hidden="true"
                        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        {[0, 1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="sheet h-32 animate-pulse bg-rule-soft/40"
                            />
                        ))}
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="sheet flex flex-wrap items-center justify-between gap-4 p-6">
                        <p className="text-[15px] text-ink-soft">
                            Crie uma disciplina e envie seus materiais para
                            começar.
                        </p>
                        <Link to="/disciplinas" className="btn btn-primary">
                            Criar disciplina
                        </Link>
                    </div>
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {(subjects ?? []).slice(0, 8).map((subject) => (
                            <li key={subject.id}>
                                <Link
                                    to="/disciplinas/$slug"
                                    params={{ slug: subject.slug }}
                                    className="sheet group flex h-full overflow-hidden transition-colors hover:border-rule-strong"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="flex w-9 shrink-0 items-end justify-center pb-3 font-display text-lg font-bold text-white"
                                        style={{ backgroundColor: colors.byId(subject.id) }}
                                    >
                                        {subjectInitial(subject.name)}
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col p-4">
                                        <span className="line-clamp-2 font-semibold leading-snug">
                                            {subject.name}
                                        </span>
                                        <span className="mt-1 text-[13px] text-muted">
                                            {subject.topics_count ?? 0} tópicos ·{" "}
                                            {subject.questions_count ?? 0} questões
                                        </span>
                                        <span className="mt-auto pt-4">
                                            <ProgressBar
                                                value={subject.progress ?? 0}
                                                color={colors.byId(subject.id)}
                                                label={`Progresso em ${subject.name}`}
                                            />
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
