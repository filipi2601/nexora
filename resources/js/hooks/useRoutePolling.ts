import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * Recarrega os dados da rota atual enquanto `active` for verdadeiro
 * (por exemplo, enquanto algo é gerado em segundo plano pela fila).
 */

export function useRoutePolling(active: boolean, intervalMs = 2000) {
    const router = useRouter();

    useEffect(() => {
        if (!active) {
            return;
        }

        const timer = setInterval(() => {
            void router.invalidate();
        }, intervalMs);

        return () => clearInterval(timer);
    }, [active, intervalMs, router]);
}