import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import BackLink from "@/components/BackLink";
import PageHeader from "@/components/PageHeader";
import MessageContent from "@/components/MessageContent";
import SubjectMark from "@/components/SubjectMark";
import { api } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";

export const Route = createFileRoute("/_app/tutor/$id")({
    loader: async ({ params }) =>
        (await api.get(`/api/tutor/conversations/${params.id}`)).data,
    component: RouteComponent,
});

function RouteComponent() {
    const conversation = Route.useLoaderData();
    const colors = useSubjectColors();
    const [messages, setMessages] = useState(
        conversation.messages.map((m: any) => ({
            role: m.role,
            text: m.content,
        })),
    );
    const [text, setText] = useState("");
    const [error, setError] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const shouldStickToBottom = useRef(true);

    const sendMutation = useMutation({
        mutationFn: async (message: string) => {
            const response = await api.post(
                `/api/tutor/conversations/${conversation.id}/messages`,
                { message },
            );
            return response.data;
        },
        onSuccess: (aiMessage) => {
            setMessages((m: any) => [
                ...m,
                { role: "ai", text: aiMessage.content },
            ]);
        },
        onError: () => {
            setError("Não foi possível responder agora. Tente novamente.");
        },
    });

    const isReplying = sendMutation.isPending;

    useEffect(() => {
        const container = scrollRef.current;
        if (!container || !shouldStickToBottom.current) return;

        container.scrollTo({ top: container.scrollHeight });
    }, [messages, isReplying]);

    function handleScroll() {
        const container = scrollRef.current;
        if (!container) return;

        const distanceToBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;
        shouldStickToBottom.current = distanceToBottom < 120;
    }

    async function send(e: React.FormEvent) {
        e.preventDefault();
        if (!text.trim() || sendMutation.isPending) return;

        const q = text;
        setText("");
        setError("");
        setMessages((m: any) => [...m, { role: "user", text: q }]);
        shouldStickToBottom.current = true;

        sendMutation.mutate(q);
    }

    return (
        <div className="page page-narrow -mb-24 flex h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] flex-col pt-4 pb-3 sm:pt-6 sm:pb-4 lg:mb-0 lg:h-dvh lg:pt-8 lg:pb-8">
            <div className="shrink-0">
                <BackLink to="/tutor" />
                <PageHeader
                    title="Tutor IA"
                    description={
                        <span className="flex items-center gap-2.5">
                            <SubjectMark
                                name={conversation.subject?.name}
                                color={colors.byId(conversation.subject?.id)}
                                size="sm"
                            />
                            <span className="min-w-0">
                                Estou estudando:{" "}
                                <b className="font-semibold text-ink">
                                    {conversation.subject?.name}
                                    {conversation.topic
                                        ? ` · ${conversation.topic.name}`
                                        : ""}
                                </b>
                            </span>
                        </span>
                    }
                />
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                role="log"
                aria-label="Conversa com o tutor"
                className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto border-t border-rule px-1 pt-5 pb-2"
            >
                {messages.length === 0 && (
                    <div className="sheet max-w-[92%] px-5 py-4 text-[15px] leading-[1.6] text-ink-soft">
                        Olá! Posso explicar conceitos, fazer perguntas,
                        corrigir respostas ou criar exemplos com base no que
                        você está estudando.
                    </div>
                )}
                {messages.map((m: any, i: number) => (
                    <div
                        key={i}
                        className={`flex ${m.role === "user" ? "justify-end" : ""}`}
                    >
                        <div
                            className={
                                m.role === "user"
                                    ? "max-w-[85%] rounded bg-ink px-4 py-3 text-white"
                                    : "sheet max-w-[92%] min-w-0 px-5 py-4 text-ink-soft"
                            }
                        >
                            <span className="sr-only">
                                {m.role === "user" ? "Você:" : "Tutor:"}
                            </span>
                            <MessageContent variant={m.role === "user" ? "user" : "ai"}>
                                {m.text}
                            </MessageContent>
                        </div>
                    </div>
                ))}
                {sendMutation.isPending && (
                    <div className="flex">
                        <div className="sheet flex h-11 items-center px-5">
                            <Loader2
                                size={16}
                                aria-hidden="true"
                                className="animate-spin text-muted"
                            />
                            <span className="sr-only">O tutor está respondendo</span>
                        </div>
                    </div>
                )}
                {error && <p className="text-sm text-alta">{error}</p>}
            </div>

            <form
                onSubmit={send}
                className="flex shrink-0 gap-2 border-t border-rule pt-3"
            >
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Pergunte sobre o que está estudando..."
                    aria-label="Sua pergunta"
                    className="field min-h-11 min-w-0 flex-1"
                />
                <button
                    disabled={sendMutation.isPending}
                    aria-label="Enviar"
                    className="btn btn-primary min-h-11 shrink-0 px-3 sm:px-4"
                >
                    <Send size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">Enviar</span>
                </button>
            </form>
        </div>
    );
}
