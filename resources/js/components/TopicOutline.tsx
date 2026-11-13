import { useState } from "react";
import { ChevronRight, ChevronDown, Dot } from "lucide-react";
import type { TopicWithChildren } from "@/types/api";

/** Topic whose children array is guaranteed to exist once built. */
type TreeTopic = Omit<TopicWithChildren, "children"> & {
    children: TreeTopic[];
};

function buildTree(topics: TopicWithChildren[]): TreeTopic[] {
    if (!topics?.length) return [];

    const nodes = new Map<number, TreeTopic>();

    // Cria uma cópia de cada tópico com children
    topics.forEach((topic) => {
        nodes.set(topic.id, {
            ...topic,
            children: [],
        });
    });

    const roots: TreeTopic[] = [];

    // Monta a árvore através do parent_id
    topics.forEach((topic) => {
        const node = nodes.get(topic.id);

        if (!node) {
            return;
        }

        if (topic.parent_id == null) {
            roots.push(node);
        } else {
            const parent = nodes.get(topic.parent_id);

            if (parent) {
                parent.children.push(node);
            } else {
                // Caso o parent_id não exista, trata como raiz
                roots.push(node);
            }
        }
    });

    // Respeita o campo `order` do banco
    const sortNodes = (items: TreeTopic[]): void => {
        items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        items.forEach((item) => {
            sortNodes(item.children);
        });
    };

    sortNodes(roots);

    return roots;
}

function Node({ node, depth = 0 }: { node: TreeTopic; depth?: number }) {
    const [open, setOpen] = useState(depth < 1);
    const hasKids = node.children.length > 0;

    return (
        <div>
            <button
                type="button"
                onClick={() => hasKids && setOpen((o) => !o)}
                aria-expanded={hasKids ? open : undefined}
                className={`flex min-h-9 w-full items-center gap-1.5 rounded py-1.5 pr-2 text-left leading-snug transition-colors hover:bg-paper ${
                    hasKids ? "cursor-pointer" : "cursor-default"
                }`}
                style={{ paddingLeft: depth * 18 + 6 }}
            >
                {hasKids ? (
                    open ? (
                        <ChevronDown
                            size={16}
                            strokeWidth={1.75}
                            aria-hidden="true"
                            className="shrink-0 text-muted"
                        />
                    ) : (
                        <ChevronRight
                            size={16}
                            strokeWidth={1.75}
                            aria-hidden="true"
                            className="shrink-0 text-muted"
                        />
                    )
                ) : (
                    <Dot
                        size={16}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="shrink-0 text-rule-strong"
                    />
                )}

                <span
                    className={
                        depth === 0
                            ? "text-[15px] font-semibold text-ink"
                            : depth === 1
                              ? "text-sm font-medium text-ink-soft"
                              : "text-sm text-muted"
                    }
                >
                    {node.name}
                </span>
            </button>

            {hasKids && open && (
                <div>
                    {node.children.map((child) => (
                        <Node
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function TopicOutline({
    topics = [],
}: {
    topics?: TopicWithChildren[];
}) {
    const tree = buildTree(topics);

    if (!tree.length) {
        return (
            <p className="px-3 py-4 text-[15px] text-ink-soft">
                Nenhum tópico encontrado.
            </p>
        );
    }

    return (
        <div className="max-h-112 overflow-y-auto pr-1">
            {tree.map((node) => (
                <Node key={node.id} node={node} />
            ))}
        </div>
    );
}