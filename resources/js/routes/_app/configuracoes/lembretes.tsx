import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import BackLink from "@/components/BackLink";
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
            <div className="page page-narrow">
                <div className="sheet p-6 text-[15px] text-ink-soft">
                    Carregando configurações...
                </div>
            </div>
        );
    }

    return (
        <div className="page page-narrow">
            <BackLink to="/configuracoes" label="Voltar para configurações" />

            <PageHeader
                title="Lembretes de estudo"
                description="Escolha se deseja receber lembretes para estudar."
            />

            <form
                onSubmit={handleSubmit}
                className="sheet"
            >
                <div className="p-6">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h2
                                id="daily-reminder"
                                className="section-title"
                            >
                                Lembrete diário
                            </h2>

                            <p className="mt-1 text-sm text-muted">
                                Receba um lembrete para manter sua rotina de estudos.
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            aria-labelledby="daily-reminder"
                            onClick={() =>
                                setEnabled(!enabled)
                            }
                            className={`relative mt-1 h-6 w-11 shrink-0 cursor-pointer rounded transition-colors ${
                                enabled
                                    ? "bg-ink"
                                    : "bg-rule-strong"
                            }`}
                        >
                            <span
                                className={`absolute top-1 h-4 w-4 rounded-sm bg-white transition-[left] ${
                                    enabled
                                        ? "left-6"
                                        : "left-1"
                                }`}
                            />
                        </button>
                    </div>

                    {enabled && (
                        <div className="mt-6 border-t border-rule-soft pt-6">
                            <label
                                htmlFor="reminder-time"
                                className="field-label"
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
                                className="field w-40"
                            />

                            <p className="field-hint">
                                O lembrete será configurado para
                                todos os dias neste horário.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-rule-soft px-6 py-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        <Save size={16} aria-hidden="true" />

                        {saving
                            ? "Salvando..."
                            : "Salvar alterações"}
                    </button>
                </div>
            </form>
        </div>
    );
}
