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
            <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.6]">
                {children}
            </p>
        );
    }

    return (
        <div className="max-w-[68ch] space-y-3 text-[15px] leading-[1.6] text-ink-soft [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="pt-2 font-display text-[22px] leading-tight font-semibold text-ink">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="pt-2 font-display text-[19px] leading-tight font-semibold text-ink">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="pt-1 text-[15px] font-bold text-ink">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-[15px] font-semibold text-ink">
                            {children}
                        </h4>
                    ),
                    p: ({ children }) => <p className="break-words">{children}</p>,
                    strong: ({ children }) => (
                        <strong className="font-semibold text-ink">
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc space-y-1.5 pl-5 marker:text-muted">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-ink">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => <li className="pl-1">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l border-rule-strong pl-4 text-muted italic">
                            {children}
                        </blockquote>
                    ),
                    code: ({ children }) => (
                        <code className="rounded-sm bg-rule-soft px-1 py-0.5 font-mono text-[0.87em] text-ink">
                            {children}
                        </code>
                    ),
                    pre: ({ children }) => (
                        <pre className="overflow-x-auto rounded bg-ink p-4 text-[13px] leading-relaxed text-white [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[1em] [&_code]:text-white">
                            {children}
                        </pre>
                    ),
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link"
                        >
                            {children}
                        </a>
                    ),
                    hr: () => <hr className="border-rule" />,
                    table: ({ children }) => (
                        <div className="overflow-x-auto rounded border border-rule">
                            <table className="w-full border-collapse text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border-b border-rule bg-paper px-3 py-2 text-left text-[13px] font-semibold text-muted">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border-t border-rule-soft px-3 py-2 align-top">
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
