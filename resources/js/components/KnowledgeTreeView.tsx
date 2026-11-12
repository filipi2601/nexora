import { useMemo, useState, useEffect } from "react";

type Topic = {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    order?: number | null;
    children: Topic[];
};

type TreeSource = {
    id: number | string;
    name: string;
    slug?: string;
    order?: number | null;
    children?: TreeSource[];
};

type TreeNode = {
    id: string;
    topicId: number | string;
    topicSlug: string;
    name: string;
    depth: number;
    x: number;
    y: number;
    children?: TreeNode[];
};

type Edge = [TreeNode, TreeNode];

type Spacing = {
    leaf: number;
    level: number;
    padX: number;
    padY: number;
    nodeW: number;
};

function useCompact() {
    const [vw, setVw] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1200,
    );

    useEffect(() => {
        const onResize = () => setVw(window.innerWidth);

        window.addEventListener("resize", onResize);

        return () => window.removeEventListener("resize", onResize);
    }, []);

    return vw < 640;
}

/**
 * Converte:
 *
 * [
 *   { id: 1, parent_id: null, name: "Álgebra" },
 *   { id: 2, parent_id: 1, name: "Equações" },
 *   { id: 3, parent_id: 1, name: "Inequações" }
 * ]
 *
 * em:
 *
 * [
 *   {
 *     id: 1,
 *     name: "Álgebra",
 *     children: [
 *       { id: 2, name: "Equações", children: [] },
 *       { id: 3, name: "Inequações", children: [] }
 *     ]
 *   }
 * ]
 */
function buildTree(topics: Topic[] = []): Topic[] {
    const nodes = new Map<number, Topic>();

    topics.forEach((topic) => {
        nodes.set(topic.id, { ...topic, children: [] });
    });

    const roots: Topic[] = [];

    topics.forEach((topic) => {
        const node = nodes.get(topic.id);

        if (!node) {
            return;
        }

        if (topic.parent_id == null) {
            roots.push(node);
            return;
        }

        const parent = nodes.get(topic.parent_id);

        if (parent) {
            parent.children.push(node);
        } else {
            // Se o pai não existir, trata como raiz
            roots.push(node);
        }
    });

    const sortNodes = (items: Topic[]): void => {
        items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        items.forEach((item) => {
            sortNodes(item.children);
        });
    };

    sortNodes(roots);

    return roots;
}

function assign(
    node: TreeSource,
    depth: number,
    counter: { value: number },
    parentId: string | null,
    spacing: Spacing,
): TreeNode {
    const id =
        parentId === null ? String(node.id) : `${parentId}-${node.id}`;

    const self: TreeNode = {
        id,
        topicId: node.id,
        topicSlug: node.slug ?? "",
        name: node.name,
        depth,
        x: 0,
        y: depth * spacing.level,
    };

    if (!node.children || node.children.length === 0) {
        self.x = counter.value * spacing.leaf;
        counter.value++;

        return self;
    }

    const kids = node.children.map((child) =>
        assign(child, depth + 1, counter, id, spacing),
    );

    self.children = kids;
    self.x = (kids[0].x + kids[kids.length - 1].x) / 2;

    return self;
}

function flatten(
    node: TreeNode,
    nodes: TreeNode[],
    edges: Edge[],
    parent: TreeNode | null,
): void {
    nodes.push(node);

    if (parent) {
        edges.push([parent, node]);
    }

    node.children?.forEach((child) => flatten(child, nodes, edges, node));
}

export default function KnowledgeTreeView({
    topics = [],
    onSelect,
}: {
    topics?: Topic[];
    onSelect?: (topicSlug: string) => void;
}) {
    const compact = useCompact();
    const [active, setActive] = useState<number | string | null>(null);

    const spacing: Spacing = compact
        ? {
              leaf: 118,
              level: 92,
              padX: 66,
              padY: 26,
              nodeW: 116,
          }
        : {
              leaf: 170,
              level: 110,
              padX: 95,
              padY: 30,
              nodeW: 150,
          };

    const roots = useMemo(() => buildTree(topics), [topics]);

    const { tree, leaves } = useMemo(() => {
        if (!roots.length) {
            return {
                tree: null as TreeNode | null,
                leaves: 0,
            };
        }

        const counter = { value: 0 };

        // Se houver mais de uma raiz, criamos um root virtual
        // apenas para o posicionamento visual.
        if (roots.length === 1) {
            return {
                tree: assign(roots[0], 0, counter, null, spacing),
                leaves: counter.value,
            };
        }

        const virtualRoot: TreeSource = {
            id: "virtual-root",
            name: "",
            children: roots,
        };

        return {
            tree: assign(virtualRoot, 0, counter, null, spacing),
            leaves: counter.value,
        };
    }, [roots, spacing]);

    if (!tree) {
        return (
            <div className="flex min-h-40 items-center justify-center text-sm text-slate-400">
                Nenhum tópico encontrado.
            </div>
        );
    }

    const nodes: TreeNode[] = [];
    const edges: Edge[] = [];

    flatten(tree, nodes, edges, null);

    // Não queremos renderizar o root virtual
    // quando existem múltiplos tópicos raiz.
    const visibleNodes =
        tree.id === "virtual-root"
            ? nodes.filter((node) => node.id !== "virtual-root")
            : nodes;

    const visibleEdges =
        tree.id === "virtual-root"
            ? edges.filter(([parent]) => parent.id !== "virtual-root")
            : edges;

    const maxDepth = Math.max(...visibleNodes.map((node) => node.depth));

    const width = Math.max(
        (Math.max(1, leaves) - 1) * spacing.leaf + spacing.padX * 2,
        300,
    );

    const height = (maxDepth + 1) * spacing.level + spacing.padY * 2;

    const handleClick = (node: TreeNode) => {
        if (onSelect && node.depth > 0) {
            return onSelect(node.topicSlug);
        }

        setActive((current) =>
            current === node.topicId ? null : node.topicId,
        );
    };

    return (
        <div className="min-w-0 overflow-x-auto pb-2">
            <div
                className="relative"
                style={{
                    width,
                    height,
                }}
            >
                <svg
                    className="absolute inset-0"
                    width="100%"
                    height="100%"
                >
                    {visibleEdges.map(([parent, child], index) => (
                        <path
                            key={index}
                            d={`
                                M ${parent.x + spacing.padX}
                                  ${parent.y + spacing.padY}

                                C ${parent.x + spacing.padX}
                                  ${(parent.y + child.y) / 2 + spacing.padY},

                                  ${child.x + spacing.padX}
                                  ${(parent.y + child.y) / 2 + spacing.padY},

                                  ${child.x + spacing.padX}
                                  ${child.y + spacing.padY}
                            `}
                            fill="none"
                            stroke="#c7d2fe"
                            strokeWidth="2"
                        />
                    ))}
                </svg>

                {visibleNodes.map((node) => (
                    <button
                        type="button"
                        key={node.topicId}
                        onClick={() => handleClick(node)}
                        style={{
                            left: node.x + spacing.padX,
                            top: node.y + spacing.padY,
                            maxWidth: spacing.nodeW,
                        }}
                        className={`
                            absolute
                            -translate-x-1/2
                            -translate-y-1/2
                            rounded-xl
                            border
                            px-3
                            py-2
                            text-center
                            text-[11px]
                            font-semibold
                            leading-tight
                            shadow-sm
                            transition
                            hover:scale-105
                            sm:text-xs

                            ${
                                node.depth === 0
                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                    : active === node.topicId
                                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                                      : "border-slate-200 bg-white text-slate-700"
                            }

                            ${
                                onSelect && node.depth > 0
                                    ? "cursor-pointer hover:border-indigo-400"
                                    : ""
                            }
                        `}
                    >
                        {node.name}
                    </button>
                ))}
            </div>
        </div>
    );
}