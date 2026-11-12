import type { ReactNode } from 'react'

const PageHeader = ({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow: string;
    title: string;
    description: string;
    action?: ReactNode;
}) => {
    return (
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow && (
                    <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-indigo-600">
                        {eyebrow}
                    </p>
                )}
                <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </header>
    );
};

export default PageHeader;
