import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MessageContent = ({
    children,
    variant,
}: {
    children: string;
    variant: "ai" | "user";
}) => {
    if (variant === "user") {
        return (
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {children}
            </p>
        );
    }

    return (
        <div className="space-y-3 text-sm leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="text-base font-bold text-slate-900">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-sm font-bold text-slate-900">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-sm font-bold text-slate-900">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-sm font-semibold text-slate-900">
                            {children}
                        </h4>
                    ),
                    p: ({ children }) => <p className="break-words">{children}</p>,
                    strong: ({ children }) => (
                        <strong className="font-bold text-slate-900">
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc space-y-1.5 pl-5">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal space-y-1.5 pl-5">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => <li className="pl-0.5">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-indigo-300 bg-indigo-50/60 py-2 pl-3.5 pr-3 text-slate-600 italic">
                            {children}
                        </blockquote>
                    ),
                    code: ({ children }) => (
                        <code className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[.8em] text-slate-800">
                            {children}
                        </code>
                    ),
                    pre: ({ children }) => (
                        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3.5 text-xs text-slate-100">
                            {children}
                        </pre>
                    ),
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
                        >
                            {children}
                        </a>
                    ),
                    hr: () => <hr className="border-slate-200" />,
                    table: ({ children }) => (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-xs">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-slate-200 bg-slate-50 px-2.5 py-2 text-left font-bold text-slate-900">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-slate-200 px-2.5 py-2 align-top">
                            {children}
                        </td>
                    ),
                }}
            >
                {children}
            </Markdown>
        </div>
    );
};

export default MessageContent;
