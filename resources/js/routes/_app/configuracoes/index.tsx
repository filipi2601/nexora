import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
    Bell,
    UserRound,
    LogOut,
    ChevronRight,
    Bot,
    type LucideIcon,
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
        <div className="page page-narrow">
            <PageHeader
                title="Configurações"
                description="Gerencie suas preferências de estudo e conta."
            />

            <ul className="sheet row-divider overflow-hidden">
                <li>
                    <SettingsRow
                        icon={UserRound}
                        title="Perfil"
                        description="Gerencie seus dados pessoais"
                        onClick={() =>
                            navigate({
                                to: "/configuracoes/perfil",
                            })
                        }
                    />
                </li>
                <li>
                    <SettingsRow
                        icon={Bot}
                        title="Inteligência artificial"
                        description="Suas chaves e o provedor de cada tarefa"
                        onClick={() =>
                            navigate({
                                to: "/configuracoes/ia",
                            })
                        }
                    />
                </li>
                <li>
                    <SettingsRow
                        icon={Bell}
                        title="Lembretes de estudo"
                        description="Configure quando deseja receber lembretes"
                        onClick={() =>
                            navigate({
                                to: "/configuracoes/lembretes",
                            })
                        }
                    />
                </li>
            </ul>

            <button
                type="button"
                onClick={() => logout.mutate()}
                className="btn btn-danger mt-6 -ml-1"
            >
                <LogOut size={16} aria-hidden="true" />
                Sair da conta
            </button>
        </div>
    );
}

function SettingsRow({
    icon: Icon,
    title,
    description,
    onClick,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-paper"
        >
            <Icon
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted"
            />
            <span className="min-w-0 flex-1">
                <span className="block font-semibold">{title}</span>
                <span className="block text-[13px] text-muted">
                    {description}
                </span>
            </span>
            <ChevronRight
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted"
            />
        </button>
    );
}
