import axios, { isAxiosError } from "axios";

export const api = axios.create({
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: "application/json",
    },
});

export function getApiErrorMessage(
    error: unknown,
    fallback = "Algo deu errado. Tente novamente.",
): string {
    if (isAxiosError(error)) {
        const message = error.response?.data?.message;

        if (typeof message === "string" && message !== "") {
            return message;
        }
    }

    return fallback;
}