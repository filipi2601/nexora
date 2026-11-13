import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import BackLink from "@/components/BackLink";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/configuracoes/perfil")({
    component: RouteComponent,
});

function RouteComponent() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const response = await api.get("/api/user");

                const user = response.data;

                setName(user.name ?? "");
                setEmail(user.email ?? "");
                setAvatarUrl(user.avatar_url ?? "");
            } catch (error) {
                console.error("Erro ao carregar usuário:", error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setSaving(true);

            await api.put("/api/user", {
                name,
                email,
                avatar_url: avatarUrl || null,
            });

            navigate({
                to: "/configuracoes",
            });
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page page-narrow">
                <div className="sheet p-6 text-[15px] text-ink-soft">
                    Carregando perfil...
                </div>
            </div>
        );
    }

    return (
        <div className="page page-narrow">
            <BackLink to="/configuracoes" label="Voltar para configurações" />

            <PageHeader
                title="Perfil"
                description="Atualize seus dados pessoais."
            />

            <form onSubmit={handleSubmit} className="sheet">
                <div className="p-6">
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rule-soft">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <UserRound
                                    size={24}
                                    strokeWidth={1.75}
                                    aria-hidden="true"
                                    className="text-muted"
                                />
                            )}
                        </div>

                        <div className="min-w-0">
                            <h2 className="section-title">
                                Informações pessoais
                            </h2>

                            <p className="mt-1 text-sm text-muted">
                                Esses dados serão usados na sua conta.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label htmlFor="name" className="field-label">
                                Nome
                            </label>

                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                required
                                className="field"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="field-label">
                                E-mail
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                required
                                className="field"
                            />
                        </div>

                        <div>
                            <label htmlFor="avatar_url" className="field-label">
                                URL do avatar
                            </label>

                            <input
                                id="avatar_url"
                                type="url"
                                value={avatarUrl}
                                onChange={(event) =>
                                    setAvatarUrl(event.target.value)
                                }
                                placeholder="https://..."
                                className="field"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-rule-soft px-6 py-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        <Save size={16} aria-hidden="true" />

                        {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                </div>
            </form>
        </div>
    );
}
