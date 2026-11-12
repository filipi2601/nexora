import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, LogInIcon } from "lucide-react";
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
            setError("Email ou senha inválidos.");
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        loginMutation.mutate();
    };

    return (
        <>
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
                    <LogInIcon
                        className="w-7 h-7 text-primary-foreground"
                        aria-hidden="true"
                    />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Bem-vindo
                </h1>
                <p className="text-muted-foreground mt-2">
                    Entre com suas credenciais
                </p>
            </div>
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                autoFocus
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-12"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            {/* <Label htmlFor="password">Password</Label>
                            <Link
                                to="/forgot-password"
                                className="text-xs text-primary hover:underline"
                            >
                                Forgot password?
                            </Link> */}
                        </div>
                        <div className="relative">
                            <Lock
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 h-12"
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-12 font-medium">
                        {loginMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            "Log in"
                        )}
                    </Button>
                </form>
            </div>
        </>
    );
}
