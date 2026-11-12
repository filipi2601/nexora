import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, ChevronLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MessageContent from "@/components/MessageContent";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/tutor/$id")({
    loader: async ({ params }) =>
        (await api.get(`/api/tutor/conversations/${params.id}`)).data,
    component: RouteComponent,
});

function RouteComponent() {
    const conversation = Route.useLoaderData();
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
        <div className="mx-auto flex h-dvh max-w-5xl flex-col p-5 sm:p-8 lg:p-12">
            <Link
                to="/tutor"
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ChevronLeft size={16} />
                Voltar
            </Link>
            <PageHeader
                eyebrow="Aprenda conversando"
                title="Tutor IA"
                description="Seu tutor conhece a disciplina e o assunto em que você está estudando."
            />
            <div className="mb-4 shrink-0 rounded-xl border bg-white px-4 py-3 text-xs">
                <span className="text-slate-400">Estou estudando:</span>{" "}
                <b>
                    {conversation.subject?.name}
                    {conversation.topic ? ` · ${conversation.topic.name}` : ""}
                </b>
            </div>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-3xl border bg-white p-5 sm:p-7"
            >
                {messages.length === 0 && (
                    <div className="flex gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-white">
                            <Bot size={18} />
                        </div>
                        <p className="max-w-[80%] rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                            Olá! Posso explicar conceitos, fazer perguntas,
                            corrigir respostas ou criar exemplos com base no que
                            você está estudando.
                        </p>
                    </div>
                )}
                {messages.map((m: any, i: number) => (
                    <div
                        key={i}
                        className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                    >
                        {m.role === "ai" && (
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-white">
                                <Bot size={18} />
                            </div>
                        )}
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                m.role === "user"
                                    ? "bg-slate-950 text-white"
                                    : "bg-slate-50 text-slate-700"
                            }`}
                        >
                            <MessageContent variant={m.role === "user" ? "user" : "ai"}>
                                {m.text}
                            </MessageContent>
                        </div>
                    </div>
                ))}
                {sendMutation.isPending && (
                    <div className="flex gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-white">
                            <Bot size={18} />
                        </div>
                        <div className="flex h-9 items-center rounded-2xl bg-slate-50 px-4">
                            <Loader2 className="size-4 animate-spin text-indigo-500" />
                        </div>
                    </div>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <form
                onSubmit={send}
                className="mt-4 flex shrink-0 gap-2 rounded-2xl border bg-white p-2"
            >
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Pergunte sobre o que está estudando..."
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                />
                <button
                    disabled={sendMutation.isPending}
                    className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-white disabled:opacity-50"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
