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

function nodeClass(
    node: TreeNode,
    isRoot: boolean,
    isActive: boolean,
    isSelectable: boolean,
): string {
    if (isRoot) {
        const hover =
            isSelectable && node.depth > 0
                ? "cursor-pointer hover:opacity-90"
                : "";

        return `font-display text-[15px] font-semibold text-white sm:text-base ${hover}`;
    }

    if (isActive) {
        return "border-ink bg-ink text-[12px] font-semibold text-white sm:text-[13px]";
    }

    const weight =
        node.depth === 1 ? "font-semibold text-ink" : "font-medium text-ink-soft";
    const hover = isSelectable
        ? "cursor-pointer hover:border-ink hover:bg-paper hover:text-ink"
        : "";

    return `border-rule-strong bg-sheet text-[12px] sm:text-[13px] ${weight} ${hover}`;
}

/**
 * O mapa de conhecimento: a raiz leva a cor da disciplina (a capa do livro), os
 * ramos são fios finos e cada tópico é uma etiqueta de papel.
 */
export default function KnowledgeTreeView({
    topics = [],
    onSelect,
    color = "var(--color-ink)",
}: {
    topics?: Topic[];
    onSelect?: (topicSlug: string) => void;
    color?: string;
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
            <div className="flex min-h-40 items-center justify-center px-4 text-[15px] text-ink-soft">
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

    /**
     * Com várias raízes, o root virtual ocupa o nível 0 sem ser desenhado: as
     * raízes reais (nível 1) sobem para o topo e levam a cor da disciplina.
     */
    const rootDepth = tree.id === "virtual-root" ? 1 : 0;
    const offsetY = rootDepth * spacing.level;
    const isRoot = (node: TreeNode) => node.depth === rootDepth;

    const maxDepth = Math.max(...visibleNodes.map((node) => node.depth));

    const width = Math.max(
        (Math.max(1, leaves) - 1) * spacing.leaf + spacing.padX * 2,
        300,
    );

    const height =
        (maxDepth - rootDepth) * spacing.level + spacing.padY * 2 + 16;

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
                                  ${parent.y - offsetY + spacing.padY}

                                C ${parent.x + spacing.padX}
                                  ${(parent.y + child.y) / 2 - offsetY + spacing.padY},

                                  ${child.x + spacing.padX}
                                  ${(parent.y + child.y) / 2 - offsetY + spacing.padY},

                                  ${child.x + spacing.padX}
                                  ${child.y - offsetY + spacing.padY}
                            `}
                            fill="none"
                            className="stroke-rule-strong"
                            strokeWidth="1.25"
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
                            top: node.y - offsetY + spacing.padY,
                            maxWidth: spacing.nodeW,
                            ...(isRoot(node)
                                ? { backgroundColor: color, borderColor: color }
                                : {}),
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded border px-2.5 py-1.5 text-center leading-tight transition-colors ${nodeClass(
                            node,
                            isRoot(node),
                            active === node.topicId,
                            Boolean(onSelect),
                        )}`}
                    >
                        {node.name}
                    </button>
                ))}
            </div>
        </div>
    );
}