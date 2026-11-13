import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10 text-ink">
            <div className="w-full max-w-[400px]">
                <Outlet />
            </div>
        </div>
    );
}
