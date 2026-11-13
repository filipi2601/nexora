import type { ReactNode } from "react";

/**
 * A abertura de uma página de disciplina, como a abertura de unidade de um livro
 * didático: uma faixa sólida na cor da disciplina, com o título em branco.
 *
 * - `breadcrumb`: navegação acima do título (por exemplo, o caminho até um tópico).
 * - `children`: informações abaixo da descrição (contagens, metadados).
 * - `aside`: conteúdo à direita no desktop (por exemplo, o progresso).
 */
export default function SubjectBand({
    color,
    title,
    description,
    breadcrumb,
    aside,
    children,
}: {
    color: string;
    title?: ReactNode;
    description?: ReactNode;
    breadcrumb?: ReactNode;
    aside?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <header
            className="mb-8 rounded px-6 py-6 text-white sm:px-8 sm:py-7"
            style={{ backgroundColor: color }}
        >
            {breadcrumb}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="min-h-[1.25em] font-display text-[34px] leading-tight font-semibold text-balance sm:text-[44px]">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 max-w-[62ch] text-[15px] leading-6 text-white/85">
                            {description}
                        </p>
                    )}
                    {children}
                </div>
                {aside && <div className="w-full shrink-0 sm:w-56">{aside}</div>}
            </div>
        </header>
    );
}
