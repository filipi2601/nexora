import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import SubjectMark from "@/components/SubjectMark";
import { api } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";

export const Route = createFileRoute("/_app/tutor/")({
    loader: async () => (await api.get("/api/tutor/conversations")).data,
    component: RouteComponent,
});

function RouteComponent() {
    const { conversations, subjects } = Route.useLoaderData();
    const navigate = useNavigate();
    const colors = useSubjectColors();

    const [subjectId, setSubjectId] = useState<string>("");
    const [topicId, setTopicId] = useState<string>("");

    const selectedSubject = subjects.find((s: any) => String(s.id) === subjectId);

    const startMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post("/api/tutor/conversations", {
                subject_id: Number(subjectId),
                topic_id: topicId ? Number(topicId) : null,
            });
            return response.data;
        },
        onSuccess: (conversation) => {
            navigate({ to: "/tutor/$id", params: { id: String(conversation.id) } });
        },
    });

    return (
        <div className="page page-narrow">
            <PageHeader
                title="Tutor IA"
                description="Seu tutor conhece a disciplina e o assunto em que você está estudando."
            />

            <section aria-labelledby="new-conversation" className="sheet p-6">
                <h2 id="new-conversation" className="section-title">
                    Nova conversa
                </h2>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="tutor-subject" className="field-label">
                            Disciplina
                        </label>
                        <select
                            id="tutor-subject"
                            value={subjectId}
                            onChange={(e) => {
                                setSubjectId(e.target.value);
                                setTopicId("");
                            }}
                            className="field"
                        >
                            <option value="">Escolha uma disciplina</option>
                            {subjects.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="tutor-topic" className="field-label">
                            Tópico
                        </label>
                        <select
                            id="tutor-topic"
                            value={topicId}
                            onChange={(e) => setTopicId(e.target.value)}
                            disabled={!selectedSubject}
                            className="field"
                        >
                            <option value="">Disciplina inteira (opcional)</option>
                            {selectedSubject?.topics?.map((t: any) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="button"
                    disabled={!subjectId || startMutation.isPending}
                    onClick={() => startMutation.mutate()}
                    className="btn btn-primary mt-6 w-full sm:w-auto"
                >
                    <Plus size={16} aria-hidden="true" />
                    {startMutation.isPending ? "Criando..." : "Começar conversa"}
                </button>
            </section>

            {conversations.length > 0 && (
                <section aria-labelledby="past-conversations" className="mt-12">
                    <h2 id="past-conversations" className="section-title mb-4">
                        Conversas anteriores
                    </h2>
                    <ul className="sheet row-divider overflow-hidden">
                        {conversations.map((c: any) => (
                            <li key={c.id}>
                                <Link
                                    to="/tutor/$id"
                                    params={{ id: String(c.id) }}
                                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-paper"
                                >
                                    <SubjectMark
                                        name={c.subject?.name}
                                        color={colors.byId(c.subject?.id)}
                                        size="sm"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-semibold">
                                            {c.title ?? "Nova conversa"}
                                        </span>
                                        <span className="block truncate text-[13px] text-muted">
                                            {c.subject?.name}
                                            {c.topic ? ` · ${c.topic.name}` : ""}
                                        </span>
                                    </span>
                                    <ChevronRight
                                        size={18}
                                        strokeWidth={1.75}
                                        aria-hidden="true"
                                        className="shrink-0 text-muted"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
