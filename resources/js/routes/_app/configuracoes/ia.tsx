import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Save, Trash2 } from "lucide-react";
import BackLink from "@/components/BackLink";
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
            <div className="page page-narrow">
                <p className="text-sm text-muted">Carregando…</p>
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
        <div className="page page-narrow">
            <BackLink to="/configuracoes" />

            <PageHeader
                title="Inteligência artificial"
                description="Escolha a IA que responde por você em todas as tarefas: tópicos, questões, flashcards, tutor, resumos e leitura de PDF escaneado. Sem chave própria, usamos a chave do servidor."
            />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setSavedMessage(null);
                    save.mutate({
                        provider: selected,
                        ...(apiKey !== "" ? { api_key: apiKey } : {}),
                    });
                }}
            >
                <section aria-labelledby="ai-provider">
                    <h2 id="ai-provider" className="section-title mb-4">
                        Provedor
                    </h2>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {data.providers.map((p) => {
                            const isSelected = p.value === selected;

                            return (
                                <label
                                    key={p.value}
                                    className={`sheet relative flex cursor-pointer flex-col p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                                        isSelected
                                            ? "border-ink ring-1 ring-ink"
                                            : "hover:border-rule-strong"
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
                                            size={18}
                                            strokeWidth={2}
                                            aria-hidden="true"
                                            className="absolute top-4 right-4 text-ink"
                                        />
                                    )}
                                    <span className="pr-6 text-[15px] font-semibold">
                                        {p.label}
                                    </span>
                                    <span className="mt-0.5 truncate text-[13px] text-muted">
                                        {p.model}
                                    </span>
                                    {p.value === data.default_provider && (
                                        <span className="mt-3">
                                            <span className="stamp stamp-idle">
                                                Padrão do app
                                            </span>
                                        </span>
                                    )}
                                    <span
                                        className={`mt-auto pt-3 text-[13px] ${
                                            p.has_app_key
                                                ? "text-muted"
                                                : "font-semibold text-media"
                                        }`}
                                    >
                                        {p.has_app_key
                                            ? "Chave do servidor disponível"
                                            : "Precisa da sua chave"}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </section>

                <section aria-labelledby="ai-key" className="mt-10">
                    <h2 id="ai-key" className="section-title">
                        Sua chave de API ({provider.label})
                    </h2>
                    <p className="mt-1.5 mb-4 max-w-[62ch] text-sm text-muted">
                        Opcional. Fica criptografada no banco e nunca é enviada
                        de volta para o navegador.
                    </p>

                    {keepsUserKey && (
                        <div className="sheet mb-3 flex flex-wrap items-center justify-between gap-2 py-2 pr-2 pl-5">
                            <span className="stamp stamp-ok">
                                Chave própria salva
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSavedMessage(null);
                                    removeKey.mutate();
                                }}
                                disabled={removeKey.isPending}
                                className="btn btn-danger btn-sm"
                            >
                                <Trash2 size={15} aria-hidden="true" />
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
                        className="field"
                    />

                    {!isSavedProvider && data.has_user_key && (
                        <p className="field-hint">
                            Ao trocar de provedor, a chave que você salvou para o
                            anterior é apagada.
                        </p>
                    )}
                    {!willHaveKey && (
                        <p className="mt-1.5 text-[13px] font-semibold text-media">
                            O servidor não tem chave para {provider.label}: sem a
                            sua, a IA não vai funcionar.
                        </p>
                    )}
                </section>

                <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-rule pt-6">
                    <button
                        type="submit"
                        disabled={!hasChanges || save.isPending}
                        className="btn btn-primary"
                    >
                        <Save size={16} aria-hidden="true" />
                        Salvar
                    </button>

                    {savedMessage && (
                        <p role="status" className="stamp stamp-ok">
                            {savedMessage}
                        </p>
                    )}
                    {(save.isError || removeKey.isError) && (
                        <p className="text-sm text-alta">
                            {getApiErrorMessage(save.error ?? removeKey.error)}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
