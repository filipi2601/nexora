import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, Save } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/configuracoes/lembretes")({
    component: RouteComponent,
});

function RouteComponent() {
    const navigate = useNavigate();

    const [enabled, setEnabled] = useState(true);
    const [time, setTime] = useState("19:00");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await api.get("/api/user");

                const user = response.data;

                setEnabled(
                    user.study_reminder_enabled ?? true
                );

                setTime(
                    user.study_reminder_time
                        ? user.study_reminder_time.substring(0, 5)
                        : "19:00"
                );
            } catch (error) {
                console.error(
                    "Erro ao carregar configurações:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        try {
            setSaving(true);

            await api.put("/api/user", {
                study_reminder_enabled: enabled,
                study_reminder_time: enabled
                    ? time
                    : null,
            });

            navigate({
                to: "/configuracoes",
            });
        } catch (error) {
            console.error(
                "Erro ao salvar lembrete:",
                error
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12">
                <div className="rounded-3xl border bg-white p-6">
                    Carregando configurações...
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12">
            <button
                type="button"
                onClick={() =>
                    navigate({
                        to: "/configuracoes",
                    })
                }
                className="-mt-2 mb-3 -ml-2 flex min-h-10 cursor-pointer items-center gap-2 px-2 text-sm text-slate-500 transition hover:text-slate-900"
            >
                <ArrowLeft size={16} />
                Voltar para configurações
            </button>

            <PageHeader
                eyebrow="Preferências de estudo"
                title="Lembretes de estudo"
                description="Escolha se deseja receber lembretes para estudar."
            />

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                <div className="rounded-3xl border bg-white p-6">
                    <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-slate-50 p-3">
                            <Bell size={20} />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold">
                                        Lembrete diário
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Receba um lembrete para manter sua rotina de estudos.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={enabled}
                                    onClick={() =>
                                        setEnabled(!enabled)
                                    }
                                    className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
                                        enabled
                                            ? "bg-slate-900"
                                            : "bg-slate-300"
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                            enabled
                                                ? "left-6"
                                                : "left-1"
                                        }`}
                                    />
                                </button>
                            </div>

                            {enabled && (
                                <div className="mt-6">
                                    <label
                                        htmlFor="reminder-time"
                                        className="mb-2 block text-sm font-medium"
                                    >
                                        Horário
                                    </label>

                                    <input
                                        id="reminder-time"
                                        type="time"
                                        value={time}
                                        onChange={(event) =>
                                            setTime(
                                                event.target.value
                                            )
                                        }
                                        className="rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                    />

                                    <p className="mt-2 text-xs text-slate-400">
                                        O lembrete será configurado para
                                        todos os dias neste horário.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save size={16} />

                        {saving
                            ? "Salvando..."
                            : "Salvar alterações"}
                    </button>
                </div>
            </form>
        </div>
    );
}