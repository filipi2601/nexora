import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Bot, Plus, MessageSquare } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/tutor/")({
    loader: async () => (await api.get("/api/tutor/conversations")).data,
    component: RouteComponent,
});

function RouteComponent() {
    const { conversations, subjects } = Route.useLoaderData();
    const navigate = useNavigate();

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
        <div className="mx-auto max-w-3xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow="Aprenda conversando"
                title="Tutor IA"
                description="Seu tutor conhece a disciplina e o assunto em que você está estudando."
            />

            <div className="rounded-3xl border bg-white p-6">
                <h2 className="mb-4 font-bold">Nova conversa</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <select
                        value={subjectId}
                        onChange={(e) => {
                            setSubjectId(e.target.value);
                            setTopicId("");
                        }}
                        className="rounded-xl border px-4 py-3 text-sm font-medium outline-none"
                    >
                        <option value="">Escolha uma disciplina</option>
                        {subjects.map((s: any) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={topicId}
                        onChange={(e) => setTopicId(e.target.value)}
                        disabled={!selectedSubject}
                        className="rounded-xl border px-4 py-3 text-sm font-medium outline-none disabled:opacity-50"
                    >
                        <option value="">Disciplina inteira (opcional)</option>
                        {selectedSubject?.topics?.map((t: any) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    disabled={!subjectId || startMutation.isPending}
                    onClick={() => startMutation.mutate()}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                    <Plus size={18} />
                    {startMutation.isPending ? "Criando..." : "Começar conversa"}
                </button>
            </div>

            {conversations.length > 0 && (
                <>
                    <h2 className="mb-4 mt-9 font-bold">Conversas anteriores</h2>
                    <div className="divide-y rounded-2xl border bg-white">
                        {conversations.map((c: any) => (
                            <Link
                                key={c.id}
                                to="/tutor/$id"
                                params={{ id: String(c.id) }}
                                className="flex items-center gap-4 p-5 hover:bg-slate-50"
                            >
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600">
                                    <MessageSquare size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">
                                        {c.title ?? "Nova conversa"}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {c.subject?.name}
                                        {c.topic ? ` · ${c.topic.name}` : ""}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}