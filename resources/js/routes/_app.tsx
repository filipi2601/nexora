import {
    createFileRoute,
    Link,
    Outlet,
    redirect,
    useLocation,
} from "@tanstack/react-router";
import {
    Sparkles,
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
        <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
            <Sidebar />
            <header className="flex h-16 items-center justify-between border-b bg-white px-5 lg:hidden">
                <Logo />
                <Link
                    to="/configuracoes/perfil"
                    aria-label="Abrir perfil"
                    className="rounded-full transition hover:opacity-80"
                >
                    <Avatar />
                </Link>
            </header>
            <main className="pb-24 lg:ml-64 lg:pb-0">
                <Outlet />
            </main>
            <MobileNav />
        </div>
    );
}

type NavLink = [string, string, LucideIcon];

/** Single source of truth for every destination in the app. */
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

/** What fits in the bottom bar. */
const MOBILE_PRIMARY: NavLink[] = [
    ["/", "Início", Home],
    ["/disciplinas", "Disciplinas", Brain],
    ["/estudar", "Estudar", Target],
    ["/flashcards", "Flashcards", Layers3],
];

/** What lives in the "Mais" sheet. */
const MOBILE_SECONDARY: NavLink[] = [
    ["/biblioteca", "Biblioteca", Library],
    ["/questoes", "Questões", CircleHelp],
    ["/tutor", "Tutor IA", Bot],
    ["/desempenho", "Desempenho", ChartNoAxesCombined],
    ["/como-usar", "Como usar", LifeBuoy],
    ["/configuracoes", "Configurações", Settings],
];

/**
 * The authenticated user, read from the cache that beforeLoad already
 * populated — no extra /api/user request.
 */
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

const Avatar = ({ size = "h-10 w-10" }: { size?: string }) => {
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
            className={`${size} grid shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white`}
        >
            {initials || "?"}
        </div>
    );
};

const Sidebar = () => {
    const logout = useLogout();
    const { user } = useCurrentUser();

    return (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white px-4 py-6 lg:flex">
            <Logo />
            <nav className="mt-8 flex-1 space-y-4">
                {NAV_GROUPS.map((group, i) => (
                    <div
                        key={i}
                        className={i ? "border-t border-slate-100 pt-4" : ""}
                    >
                        {group.map(([to, label, Icon]) => (
                            <Link
                                key={to}
                                to={to}
                                className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                activeProps={{
                                    className:
                                        "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium bg-indigo-50 text-indigo-700 transition-colors",
                                }}
                            >
                                <Icon size={18} />
                                {label}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>
            <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                <Avatar />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                        {user?.name ?? "Estudante"}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                        {user?.email ?? ""}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    title="Sair da conta"
                    aria-label="Sair da conta"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                >
                    <LogOut size={17} />
                </button>
            </div>
        </aside>
    );
};

const Logo = () => {
    return (
        <div className="flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Sparkles size={20} />
            </div>
            <div>
                <p className="font-display text-lg font-bold tracking-[.16em] text-slate-950">
                    NEXORA
                </p>
                <p className="text-[11px] font-medium text-slate-400">
                    Learning Platform
                </p>
            </div>
        </div>
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
        "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-slate-500";
    const itemActiveClass =
        "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-indigo-600";

    return (
        <>
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur lg:hidden">
                <div className="grid grid-cols-5">
                    {MOBILE_PRIMARY.map(([to, label, Icon]) => (
                        <Link
                            key={to}
                            to={to}
                            className={itemClass}
                            activeProps={{ className: itemActiveClass }}
                            activeOptions={
                                to === "/" ? { exact: true } : undefined
                            }
                        >
                            <Icon size={19} />
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
                        <MoreHorizontal size={19} />
                        Mais
                    </button>
                </div>
            </nav>

            <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="top-auto bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-3xl p-0 sm:max-w-none"
                >
                    <DialogHeader className="p-5 pb-0">
                        <DialogTitle>Mais</DialogTitle>
                    </DialogHeader>

                    <div className="p-5 pt-3">
                        <div className="divide-y divide-slate-100">
                            {MOBILE_SECONDARY.map(([to, label, Icon]) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={() => setMoreOpen(false)}
                                    className="flex items-center gap-3 py-3 text-sm font-medium text-slate-700 transition hover:text-indigo-600"
                                >
                                    <Icon size={18} className="text-slate-400" />
                                    {label}
                                </Link>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                            <Avatar size="h-9 w-9" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                    {user?.name ?? "Estudante"}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                    {user?.email ?? ""}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => logout.mutate()}
                                disabled={logout.isPending}
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                title="Sair da conta"
                                aria-label="Sair da conta"
                            >
                                <LogOut size={17} />
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};