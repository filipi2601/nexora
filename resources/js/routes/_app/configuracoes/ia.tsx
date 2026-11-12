import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, KeyRound, Save, ScanText, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api, getApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/_app/configuracoes/ia")({
    component: RouteComponent,
});

type Provider = {
    value: string;
    label: string;
    model: string | null;
    has_app_key: boolean;
};

type Settings = {
    /** O provedor ativo do aluno, que responde todas as tarefas. */
    provider: string;
    default_provider: string;
    has_user_key: boolean;
    providers: Provider[];
};

const QUERY_KEY = ["user", "ai-settings"];

function RouteComponent() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            const response = await api.get("/api/user/ai-settings");

            return response.data.settings as Settings;
        },
    });

    // O provedor marcado na tela; até o aluno mexer, é o que está salvo.
    const [chosen, setChosen] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState("");
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    const onSaved = (message: string) => (response: { settings: Settings }) => {
        queryClient.setQueryData(QUERY_KEY, response.settings);
        setChosen(null);
        setApiKey("");
        setSavedMessage(message);
    };

    const save = useMutation({
        mutationFn: async (payload: { provider: string; api_key?: string }) =>
            (await api.put("/api/user/ai-settings", payload)).data,
        onSuccess: onSaved("Configurações salvas."),
    });

    const removeKey = useMutation({
        mutationFn: async () => (await api.delete("/api/user/ai-key")).data,
        onSuccess: onSaved("Chave removida."),
    });

    if (isLoading || !data) {
        return (
            <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12">
                <p className="text-sm text-slate-400">Carregando…</p>
            </div>
        );
    }

    const selected = chosen ?? data.provider;
    const provider = data.providers.find((p) => p.value === selected)!;
    const isSavedProvider = selected === data.provider;
    const keepsUserKey = isSavedProvider && data.has_user_key;
    const willHaveKey = keepsUserKey || apiKey !== "" || provider.has_app_key;
    const hasChanges = !isSavedProvider || apiKey !== "";

    return (
        <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12">
            <Link
                to="/configuracoes"
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ArrowLeft size={16} />
                Voltar
            </Link>

            <PageHeader
                eyebrow="Sua conta"
                title="Inteligência artificial"
                description="Escolha a IA que responde por você em todas as tarefas: tópicos, questões, flashcards, tutor, resumos e leitura de PDF escaneado. Sem chave própria, usamos a chave do servidor."
            />

            <form
                className="space-y-8"
                onSubmit={(e) => {
                    e.preventDefault();
                    setSavedMessage(null);
                    save.mutate({
                        provider: selected,
                        ...(apiKey !== "" ? { api_key: apiKey } : {}),
                    });
                }}
            >
                <section>
                    <h2 className="mb-4 text-sm font-bold">Provedor</h2>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {data.providers.map((p) => {
                            const isSelected = p.value === selected;

                            return (
                                <label
                                    key={p.value}
                                    className={`relative cursor-pointer rounded-2xl border bg-white p-5 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-400 ${
                                        isSelected
                                            ? "border-indigo-500 ring-2 ring-indigo-500"
                                            : "hover:border-indigo-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="provider"
                                        value={p.value}
                                        checked={isSelected}
                                        onChange={() => {
                                            setChosen(p.value);
                                            setSavedMessage(null);
                                        }}
                                        className="sr-only"
                                    />
                                    {isSelected && (
                                        <Check
                                            size={16}
                                            className="absolute right-4 top-4 text-indigo-600"
                                        />
                                    )}
                                    <b className="text-sm">{p.label}</b>
                                    <p className="mt-0.5 truncate text-xs text-slate-400">
                                        {p.model}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
                                        {p.value === data.default_provider && (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                                Padrão do app
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className={`mt-3 text-xs ${
                                            p.has_app_key
                                                ? "text-emerald-600"
                                                : "text-amber-600"
                                        }`}
                                    >
                                        {p.has_app_key
                                            ? "Chave do servidor disponível"
                                            : "Precisa da sua chave"}
                                    </p>
                                </label>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
                        <KeyRound size={16} className="text-indigo-500" />
                        Sua chave de API ({provider.label})
                    </h2>
                    <p className="mb-4 text-xs text-slate-400">
                        Opcional. Fica criptografada no banco e nunca é enviada
                        de volta para o navegador.
                    </p>

                    {keepsUserKey && (
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-white px-5 py-3">
                            <span className="text-sm font-medium text-emerald-600">
                                Chave própria salva
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSavedMessage(null);
                                    removeKey.mutate();
                                }}
                                disabled={removeKey.isPending}
                                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                                Remover chave
                            </button>
                        </div>
                    )}

                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            setSavedMessage(null);
                        }}
                        placeholder={
                            keepsUserKey
                                ? "Cole uma chave nova para substituir"
                                : "Cole aqui a sua chave"
                        }
                        aria-label={`Sua chave de API (${provider.label})`}
                        autoComplete="off"
                        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                    />

                    {!isSavedProvider && data.has_user_key && (
                        <p className="mt-2 text-xs text-slate-500">
                            Ao trocar de provedor, a chave que você salvou para o
                            anterior é apagada.
                        </p>
                    )}
                    {!willHaveKey && (
                        <p className="mt-2 text-xs text-amber-600">
                            O servidor não tem chave para {provider.label}: sem a
                            sua, a IA não vai funcionar.
                        </p>
                    )}
                </section>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="submit"
                        disabled={!hasChanges || save.isPending}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                        <Save size={15} />
                        Salvar
                    </button>

                    {savedMessage && (
                        <p className="text-sm font-medium text-emerald-600">
                            {savedMessage}
                        </p>
                    )}
                    {(save.isError || removeKey.isError) && (
                        <p className="text-sm text-red-500">
                            {getApiErrorMessage(save.error ?? removeKey.error)}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
