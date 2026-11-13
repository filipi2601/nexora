import type { ComponentProps } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export default function BackLink({
    label = "Voltar",
    ...props
}: ComponentProps<typeof Link> & { label?: string }) {
    return (
        <Link
            {...props}
            className="-ml-2 mb-3 inline-flex min-h-10 items-center gap-1.5 px-2 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
            <ArrowLeft size={16} aria-hidden="true" />
            {label}
        </Link>
    );
}
