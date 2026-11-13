import type { ReactNode } from "react";

const PageHeader = ({
    title,
    description,
    action,
}: {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}) => {
    return (
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h1 className="page-title">{title}</h1>
                {description && (
                    <p className="mt-2 max-w-[62ch] text-[15px] leading-6 text-muted">
                        {description}
                    </p>
                )}
            </div>
            {action && <div className="flex shrink-0 gap-2">{action}</div>}
        </header>
    );
};

export default PageHeader;
