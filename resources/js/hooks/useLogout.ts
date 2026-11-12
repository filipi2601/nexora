import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";


export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            await api.post("/api/logout");
        },
        onSuccess: () => {
            queryClient.clear();

            navigate({ to: "/login" });
        },
        onError: (error) => {
            console.error("Erro ao sair:", error);
        },
    });
}