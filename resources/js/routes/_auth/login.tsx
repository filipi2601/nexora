import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/_auth/login")({
    component: RouteComponent,
});

function RouteComponent() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const loginMutation = useMutation({
        mutationFn: async () => {
            await api.get("/sanctum/csrf-cookie");

            const response = await api.post("/api/login", {
                email,
                password,
            });

            return response.data;
        },

        onSuccess: () => {
            navigate({ to: "/" });
        },

        onError: () => {
            setError("E-mail ou senha inválidos.");
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        loginMutation.mutate();
    };

    return (
        <>
            <div className="mb-8 flex justify-center">
                <Logo size="lg" />
            </div>

            <div className="sheet p-6 sm:p-8">
                <h1 className="font-display text-[30px] leading-tight font-semibold">
                    Bem-vindo
                </h1>
                <p className="mt-1 text-[15px] text-muted">
                    Entre com suas credenciais
                </p>

                {error && (
                    <p
                        role="alert"
                        className="mt-5 rounded bg-alta-wash px-3 py-2.5 text-sm font-semibold text-alta"
                    >
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                        <label htmlFor="email" className="field-label">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            placeholder="voce@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="field min-h-11"
                            required
                        />
                    </div>
                    <div>
                        <div className="flex items-baseline justify-between">
                            <label htmlFor="password" className="field-label">
                                Senha
                            </label>
                            {/* <Link
                                to="/forgot-password"
                                className="link text-[13px]"
                            >
                                Esqueceu a senha?
                            </Link> */}
                        </div>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="field min-h-11"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary min-h-11 w-full">
                        {loginMutation.isPending ? (
                            <>
                                <Loader2
                                    size={16}
                                    aria-hidden="true"
                                    className="animate-spin"
                                />
                                Entrando...
                            </>
                        ) : (
                            "Entrar"
                        )}
                    </button>
                </form>
            </div>
        </>
    );
}
