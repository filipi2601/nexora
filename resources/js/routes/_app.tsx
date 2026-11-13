import {
    createFileRoute,
    Link,
    Outlet,
    redirect,
    useLocation,
} from "@tanstack/react-router";
import {
    Home,
    Target,
    Library,
    Brain,
    Layers3,
    CircleHelp,
    Bot,
    ChartNoAxesCombined,
    LifeBuoy,
    Settings,
    LogOut,
    MoreHorizontal,
    LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Logo from "@/components/Logo";
import { useLogout } from "@/hooks/useLogout";
import { api } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app")({
    beforeLoad: async ({ context }) => {
        try {
            await context.queryClient.fetchQuery({
                queryKey: ["auth", "user"],
                queryFn: async () => {
                    const response = await api.get("/api/user");

                    return response.data;
                },
                staleTime: 1000 * 60 * 5,
                retry: false,
            });
        } catch {
            throw redirect({ to: "/login" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="min-h-screen bg-paper text-ink">
            <Sidebar />
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-sheet px-5 lg:hidden">
                <Logo />
                <Link
                    to="/configuracoes/perfil"
                    aria-label="Abrir perfil"
                    className="rounded-full transition-opacity hover:opacity-80"
                >
                    <Avatar size="h-8 w-8" />
                </Link>
            </header>
            <main className="pb-24 lg:ml-60 lg:pb-0">
                <Outlet />
            </main>
            <MobileNav />
        </div>
    );
}

type NavLink = [string, string, LucideIcon];

const NAV_GROUPS: NavLink[][] = [
    [
        ["/", "Início", Home],
        ["/estudar", "Estudar", Target],
        ["/biblioteca", "Biblioteca", Library],
        ["/disciplinas", "Disciplinas", Brain],
    ],
    [
        ["/flashcards", "Flashcards", Layers3],
        ["/questoes", "Questões", CircleHelp],
    ],
    [
        ["/tutor", "Tutor IA", Bot],
        ["/desempenho", "Desempenho", ChartNoAxesCombined],
    ],
    [
        ["/como-usar", "Como usar", LifeBuoy],
        ["/configuracoes", "Configurações", Settings],
    ],
];

const MOBILE_PRIMARY: NavLink[] = [
    ["/", "Início", Home],
    ["/disciplinas", "Disciplinas", Brain],
    ["/estudar", "Estudar", Target],
    ["/flashcards", "Flashcards", Layers3],
];

const MOBILE_SECONDARY: NavLink[] = [
    ["/biblioteca", "Biblioteca", Library],
    ["/questoes", "Questões", CircleHelp],
    ["/tutor", "Tutor IA", Bot],
    ["/desempenho", "Desempenho", ChartNoAxesCombined],
    ["/como-usar", "Como usar", LifeBuoy],
    ["/configuracoes", "Configurações", Settings],
];

const useCurrentUser = () => {
    const { data: user } = useQuery({
        queryKey: ["auth", "user"],
        queryFn: async () => {
            const response = await api.get("/api/user");

            return response.data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const initials = (user?.name ?? "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part: string) => part.charAt(0).toUpperCase())
        .join("");

    return { user, initials };
};

const Avatar = ({ size = "h-9 w-9" }: { size?: string }) => {
    const { user, initials } = useCurrentUser();

    if (user?.avatar_url) {
        return (
            <img
                src={user.avatar_url}
                alt={user.name ?? ""}
                className={`${size} shrink-0 rounded-full object-cover`}
            />
        );
    }

    return (
        <div
            className={`${size} grid shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white`}
        >
            {initials || "?"}
        </div>
    );
};

const Sidebar = () => {
    const logout = useLogout();
    const { user } = useCurrentUser();

    return (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-rule bg-sheet px-3 pt-6 pb-4 lg:flex">
            <Link to="/" aria-label="Nexora, início" className="px-3">
                <Logo />
            </Link>
            <nav aria-label="Principal" className="mt-8 flex-1 overflow-y-auto">
                {NAV_GROUPS.map((group, i) => (
                    <div
                        key={i}
                        className={
                            i ? "mt-3 border-t border-rule-soft pt-3" : ""
                        }
                    >
                        {group.map(([to, label, Icon]) => (
                            <Link
                                key={to}
                                to={to}
                                className="mb-0.5 flex min-h-10 items-center gap-3 rounded px-3 text-[15px] font-medium text-ink-soft transition-colors hover:bg-rule-soft hover:text-ink"
                                activeProps={{
                                    className:
                                        "mb-0.5 flex min-h-10 items-center gap-3 rounded px-3 text-[15px] font-semibold bg-ink text-white",
                                    "aria-current": "page",
                                }}
                                activeOptions={
                                    to === "/" ? { exact: true } : undefined
                                }
                            >
                                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                                {label}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>
            <div className="flex items-center gap-3 border-t border-rule-soft px-1 pt-4">
                <Avatar />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                        {user?.name ?? "Estudante"}
                    </p>
                    <p className="truncate text-[13px] text-muted">
                        {user?.email ?? ""}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    title="Sair da conta"
                    aria-label="Sair da conta"
                    className="btn btn-ghost btn-icon shrink-0"
                >
                    <LogOut size={17} aria-hidden="true" />
                </button>
            </div>
        </aside>
    );
};

const MobileNav = () => {
    const [moreOpen, setMoreOpen] = useState(false);
    const { pathname } = useLocation();
    const logout = useLogout();
    const { user } = useCurrentUser();

    const secondaryActive = MOBILE_SECONDARY.some(
        ([to]) => pathname === to || pathname.startsWith(`${to}/`),
    );

    const itemClass =
        "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted";
    const itemActiveClass =
        "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink before:absolute before:inset-x-4 before:top-0 before:h-0.5 before:bg-ink";

    return (
        <>
            <nav
                aria-label="Principal"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-sheet pb-[env(safe-area-inset-bottom)] lg:hidden"
            >
                <div className="grid grid-cols-5">
                    {MOBILE_PRIMARY.map(([to, label, Icon]) => (
                        <Link
                            key={to}
                            to={to}
                            className={itemClass}
                            activeProps={{
                                className: itemActiveClass,
                                "aria-current": "page",
                            }}
                            activeOptions={
                                to === "/" ? { exact: true } : undefined
                            }
                        >
                            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                            {label}
                        </Link>
                    ))}

                    <button
                        type="button"
                        onClick={() => setMoreOpen(true)}
                        className={
                            secondaryActive
                                ? itemActiveClass
                                : `${itemClass} cursor-pointer`
                        }
                    >
                        <MoreHorizontal size={20} strokeWidth={1.75} aria-hidden="true" />
                        Mais
                    </button>
                </div>
            </nav>

            <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="top-auto bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-b-none p-0 sm:max-w-none"
                >
                    <DialogHeader className="px-5 pt-5">
                        <DialogTitle>Mais</DialogTitle>
                    </DialogHeader>

                    <div className="px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                        <div className="divide-y divide-rule-soft">
                            {MOBILE_SECONDARY.map(([to, label, Icon]) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={() => setMoreOpen(false)}
                                    className="flex min-h-12 items-center gap-3 text-[15px] font-medium text-ink-soft transition-colors hover:text-ink"
                                    activeProps={{
                                        className:
                                            "flex min-h-12 items-center gap-3 text-[15px] font-semibold text-ink",
                                        "aria-current": "page",
                                    }}
                                >
                                    <Icon size={18} strokeWidth={1.75} className="text-muted" aria-hidden="true" />
                                    {label}
                                </Link>
                            ))}
                        </div>

                        <div className="mt-3 flex items-center gap-3 border-t border-rule pt-4">
                            <Avatar />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                    {user?.name ?? "Estudante"}
                                </p>
                                <p className="truncate text-[13px] text-muted">
                                    {user?.email ?? ""}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => logout.mutate()}
                                disabled={logout.isPending}
                                className="btn btn-ghost btn-icon shrink-0"
                                title="Sair da conta"
                                aria-label="Sair da conta"
                            >
                                <LogOut size={17} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};