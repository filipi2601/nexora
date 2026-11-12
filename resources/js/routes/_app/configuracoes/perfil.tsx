import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
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
            <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12">
                <div className="rounded-3xl border bg-white p-6">
                    Carregando perfil...
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
                className="-mt-2 mb-3 -ml-2 flex min-h-10 cursor-pointer items-center gap-2 px-2 text-sm text-slate-500 hover:text-slate-900"
            >
                <ArrowLeft size={16} />
                Voltar para configurações
            </button>

            <PageHeader
                eyebrow="Sua conta"
                title="Perfil"
                description="Atualize seus dados pessoais."
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-3xl border bg-white p-6">
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <UserRound
                                    size={28}
                                    className="text-slate-400"
                                />
                            )}
                        </div>

                        <div>
                            <h2 className="font-semibold">
                                Informações pessoais
                            </h2>

                            <p className="text-sm text-slate-400">
                                Esses dados serão usados na sua conta.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-2 block text-sm font-medium"
                            >
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
                                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                required
                                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="avatar_url"
                                className="mb-2 block text-sm font-medium"
                            >
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
                                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
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

                        {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                </div>
            </form>
        </div>
    );
}
