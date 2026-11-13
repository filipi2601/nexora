import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SubjectMark from "@/components/SubjectMark";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/biblioteca")({
    component: RouteComponent,
});

type Material = {
    id: number;
    title: string;
    subject: { id: number; name: string };
    original_name: string;
    file_url: string;
    status: string;
};

const normalize = (text: string) =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

const materialStatus = (status: string): { label: string; className: string } => {
    if (status === "ready") {
        return { label: "Pronto", className: "stamp-ok" };
    }

    if (status === "failed") {
        return { label: "Falha ao processar", className: "stamp-error" };
    }

    if (status === "processing") {
        return { label: "Processando...", className: "stamp-wait" };
    }

    return { label: "Na fila...", className: "stamp-wait" };
};

function RouteComponent() {
    const { data: subjects } = useQuery({
        queryKey: ["subjects"],
        queryFn: async () => {
            const response = await api.get("/api/subjects");
            return response.data;
        },
    });

    const { data: materials, isLoading } = useQuery({
        queryKey: ["materials"],
        queryFn: async () => {
            const response = await api.get("/api/materials");
            return response.data;
        },
        refetchInterval: (query) =>
            query.state.data?.some(
                (material: { status: string }) =>
                    material.status === "pending" ||
                    material.status === "processing",
            )
                ? 3000
                : false,
    });

    const [subjectFilter, setSubjectFilter] = useState<number | "all">("all");
    const [search, setSearch] = useState("");

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [subjectId, setSubjectId] = useState("");

    const queryClient = useQueryClient();
    const colors = useSubjectColors();

    const uploadMutation = useMutation({
        mutationFn: async ({
            file,
            subjectId,
        }: {
            file: File;
            subjectId: string;
        }) => {
            const formData = new FormData();

            formData.append("file", file);
            formData.append("subject_id", subjectId);

            const response = await api.post("/api/material", formData);

            return response.data;
        },

        onSuccess: (data) => {
            setIsUploadOpen(false);
            setSelectedFile(null);
            setSubjectId("");
            queryClient.invalidateQueries({
                queryKey: ["materials"],
            });
        },
    });

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadMutation.reset();
        setSelectedFile(file);
    }

    const searchTerm = normalize(search.trim());
    const filteredMaterials = ((materials ?? []) as Material[]).filter(
        (m) =>
            (subjectFilter === "all" || m.subject.id === subjectFilter) &&
            normalize(`${m.title} ${m.original_name}`).includes(searchTerm),
    );

    const deleteMaterial = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`api/material/${id}`);
        },

        onSuccess: (_, deletedId) => {
            queryClient.setQueryData(
                ["materials"],
                (oldMaterials: typeof materials) =>
                    oldMaterials?.filter(
                        (material: { id: number }) => material.id !== deletedId,
                    ),
            );
        },
    });

    const reprocessMaterial = useMutation({
        mutationFn: async (id: number) => {
            await api.post(`/api/material/${id}/reprocess`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["materials"] });
        },
    });

    const handleDelete = (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este material?")) {
            return;
        }

        deleteMaterial.mutate(id);
    };

    return (
        <div className="page">
            <PageHeader
                title="Biblioteca"
                description="Documentos que dão origem às suas experiências de aprendizagem."
                action={
                    <button
                        type="button"
                        onClick={() => setIsUploadOpen(true)}
                        disabled={uploadMutation.isPending}
                        className="btn btn-primary"
                    >
                        <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                        Adicionar material
                    </button>
                }
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Pesquisar materiais..."
                        aria-label="Pesquisar materiais"
                        className="field pl-9"
                    />
                </div>
                {subjects && subjects.length > 0 && (
                    <select
                        value={subjectFilter}
                        onChange={(e) =>
                            setSubjectFilter(
                                e.target.value === "all"
                                    ? "all"
                                    : Number(e.target.value),
                            )
                        }
                        aria-label="Filtrar por disciplina"
                        className="field sm:w-64"
                    >
                        <option value="all">Todas as disciplinas</option>
                        {subjects.map((s: { id: number; name: string }) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {isLoading ? (
                <p className="text-sm text-muted">Carregando materiais...</p>
            ) : !materials?.length ? (
                <div className="sheet flex flex-wrap items-center justify-between gap-4 p-6">
                    <p className="flex items-center gap-3 text-[15px] text-ink-soft">
                        <FileText
                            size={18}
                            strokeWidth={1.75}
                            aria-hidden="true"
                            className="shrink-0 text-muted"
                        />
                        Sua biblioteca está vazia. Adicione seu primeiro
                        material para começar.
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsUploadOpen(true)}
                        disabled={uploadMutation.isPending}
                        className="btn btn-secondary"
                    >
                        Adicionar material
                    </button>
                </div>
            ) : filteredMaterials.length === 0 ? (
                <div className="sheet p-6 text-[15px] text-ink-soft">
                    Nenhum material encontrado. Tente outro termo ou outra
                    disciplina.
                </div>
            ) : (
                <ul className="sheet row-divider">
                    {filteredMaterials.map((m) => {
                        const status = materialStatus(m.status);

                        return (
                            <li
                                key={m.id}
                                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:flex-nowrap"
                            >
                                <a
                                    href={m.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-auto"
                                >
                                    <SubjectMark
                                        name={m.subject.name}
                                        color={colors.byId(m.subject.id)}
                                        size="sm"
                                    />
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold decoration-rule-strong underline-offset-3 group-hover:underline">
                                            {m.title}
                                        </span>
                                        <span className="block truncate text-[13px] text-muted">
                                            {m.subject.name} ·{" "}
                                            {m.original_name}
                                        </span>
                                    </span>
                                </a>

                                <div className="ml-9 flex shrink-0 items-center gap-2 sm:ml-0">
                                    <span
                                        className={`stamp ${status.className}`}
                                    >
                                        {status.label}
                                    </span>

                                    {m.status === "failed" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                reprocessMaterial.mutate(m.id)
                                            }
                                            disabled={
                                                reprocessMaterial.isPending
                                            }
                                            className="btn btn-secondary btn-sm"
                                        >
                                            Tentar novamente
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(m.id)}
                                        aria-label={`Excluir ${m.title}`}
                                        title="Excluir material"
                                        className="btn btn-ghost btn-icon text-muted hover:text-alta"
                                    >
                                        <Trash2
                                            size={16}
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>

                                {reprocessMaterial.isError &&
                                    reprocessMaterial.variables === m.id && (
                                        <p className="ml-9 basis-full text-sm text-alta">
                                            {getApiErrorMessage(
                                                reprocessMaterial.error,
                                            )}
                                        </p>
                                    )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <Dialog
                open={isUploadOpen}
                onOpenChange={(open) => {
                    setIsUploadOpen(open);

                    if (!open) {
                        uploadMutation.reset();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar material</DialogTitle>

                        <DialogDescription>
                            Selecione o arquivo e a disciplina do material.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div>
                            <label
                                htmlFor="material-file"
                                className="field-label"
                            >
                                Arquivo
                            </label>

                            <input
                                id="material-file"
                                type="file"
                                accept=".pdf,.docx,.pptx"
                                onChange={handleFileChange}
                                className="field cursor-pointer text-ink-soft file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-rule-strong file:bg-paper file:px-2.5 file:py-0.5 file:text-sm file:font-semibold file:text-ink"
                            />

                            <p className="field-hint">
                                PDF, Word (.docx) ou PowerPoint (.pptx), até
                                10 MB.
                            </p>

                            {selectedFile && (
                                <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                                    <FileText
                                        size={16}
                                        strokeWidth={1.75}
                                        aria-hidden="true"
                                        className="shrink-0 text-muted"
                                    />
                                    <span className="truncate">
                                        {selectedFile.name}
                                    </span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="material-subject"
                                className="field-label"
                            >
                                Disciplina
                            </label>

                            <select
                                id="material-subject"
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="field"
                            >
                                <option value="">
                                    Selecione uma disciplina
                                </option>

                                {subjects?.map(
                                    (s: { id: number; name: string }) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        {uploadMutation.isError && (
                            <p className="text-sm text-alta">
                                {getApiErrorMessage(uploadMutation.error)}
                            </p>
                        )}

                        <button
                            type="button"
                            disabled={
                                !selectedFile ||
                                !subjectId ||
                                uploadMutation.isPending
                            }
                            onClick={() => {
                                if (!selectedFile || !subjectId) return;

                                uploadMutation.mutate({
                                    file: selectedFile,
                                    subjectId,
                                });
                            }}
                            className="btn btn-primary w-full"
                        >
                            {uploadMutation.isPending
                                ? "Enviando..."
                                : "Enviar material"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
