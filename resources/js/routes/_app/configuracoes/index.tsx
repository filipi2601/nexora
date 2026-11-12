import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
    Bell,
    UserRound,
    LogOut,
    ChevronRight,
    Bot,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useLogout } from "@/hooks/useLogout";

export const Route = createFileRoute("/_app/configuracoes/")({
    component: RouteComponent,
});

function RouteComponent() {
    const navigate = useNavigate();
    const logout = useLogout();

    return (
        <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow="Sua conta"
                title="Configurações"
                description="Gerencie suas preferências de estudo e conta."
            />

            <div className="divide-y rounded-3xl border bg-white">
                <button
                    type="button"
                    onClick={() =>
                        navigate({
                            to: "/configuracoes/perfil",
                        })
                    }
                    className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition hover:bg-slate-50"
                >
                    <div className="rounded-xl bg-slate-50 p-3">
                        <UserRound size={19} />
                    </div>

                    <div className="flex-1">
                        <b className="text-sm">Perfil</b>

                        <p className="text-xs text-slate-400">
                            Gerencie seus dados pessoais
                        </p>
                    </div>

                    <ChevronRight
                        size={18}
                        className="text-slate-400"
                    />
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate({
                            to: "/configuracoes/ia",
                        })
                    }
                    className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition hover:bg-slate-50"
                >
                    <div className="rounded-xl bg-slate-50 p-3">
                        <Bot size={19} />
                    </div>

                    <div className="flex-1">
                        <b className="text-sm">
                            Inteligência artificial
                        </b>

                        <p className="text-xs text-slate-400">
                            Suas chaves e o provedor de cada tarefa
                        </p>
                    </div>

                    <ChevronRight
                        size={18}
                        className="text-slate-400"
                    />
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate({
                            to: "/configuracoes/lembretes",
                        })
                    }
                    className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition hover:bg-slate-50"
                >
                    <div className="rounded-xl bg-slate-50 p-3">
                        <Bell size={19} />
                    </div>

                    <div className="flex-1">
                        <b className="text-sm">
                            Lembretes de estudo
                        </b>

                        <p className="text-xs text-slate-400">
                            Configure quando deseja receber lembretes
                        </p>
                    </div>

                    <ChevronRight
                        size={18}
                        className="text-slate-400"
                    />
                </button>

                <button
                    type="button"
                    onClick={() => logout.mutate()}
                    className="flex w-full cursor-pointer items-center gap-4 p-5 text-left text-red-600 transition hover:bg-red-50"
                >
                    <div className="rounded-xl bg-red-50 p-3">
                        <LogOut size={19} />
                    </div>

                    <b className="text-sm">
                        Sair da conta
                    </b>
                </button>
            </div>
        </div>
    );
}