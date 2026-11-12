import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
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

/** Minúsculas e sem acentos, para "logica" encontrar "Lógica". */
const normalize = (text: string) =>
    text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

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
        <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow="Seus materiais"
                title="Biblioteca"
                description="Documentos que dão origem às suas experiências de aprendizagem."
                action={
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        disabled={uploadMutation.isPending}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                    >
                        Adicionar material
                    </button>
                }
            />
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex flex-1 cursor-text items-center gap-3 rounded-xl border bg-white px-4 py-3 text-slate-400">
                    <Search size={18} />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Pesquisar materiais..."
                        aria-label="Pesquisar materiais"
                        className="w-full bg-transparent text-sm text-slate-700 outline-none"
                    />
                </label>
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
                        className="rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"
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
                <p className="text-sm text-slate-400">
                    Carregando materiais...
                </p>
            ) : !materials?.length ? (
                <div className="rounded-3xl border border-dashed bg-white p-12 text-center">
                    <FileText className="mx-auto text-slate-300" size={38} />
                    <h2 className="mt-4 font-bold">
                        Sua biblioteca está vazia
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Adicione seu primeiro material para começar.
                    </p>
                </div>
            ) : filteredMaterials.length === 0 ? (
                <div className="rounded-3xl border border-dashed bg-white p-12 text-center">
                    <Search className="mx-auto text-slate-300" size={38} />
                    <h2 className="mt-4 font-bold">
                        Nenhum material encontrado
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Tente outro termo ou outra disciplina.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredMaterials.map(
                        (m) => (
                            <div
                                key={m.id}
                                className="group relative flex gap-4 rounded-2xl border bg-white p-5 hover:border-indigo-300"
                            >
                                <a
                                    href={m.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex min-w-0 flex-1 gap-4"
                                >
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <FileText />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="truncate font-bold">
                                            {m.title}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-400">
                                            {m.subject.name}
                                        </p>

                                        <p className="mt-2 truncate text-xs text-slate-400">
                                            {m.original_name}
                                        </p>

                                        {m.status !== "ready" && (
                                            <p
                                                className={`mt-2 text-xs font-medium ${
                                                    m.status === "failed"
                                                        ? "text-red-500"
                                                        : "text-amber-600"
                                                }`}
                                            >
                                                {m.status === "failed"
                                                    ? "Falha ao processar"
                                                    : m.status === "processing"
                                                      ? "Processando..."
                                                      : "Na fila..."}
                                            </p>
                                        )}

                                        {reprocessMaterial.isError &&
                                            reprocessMaterial.variables ===
                                                m.id && (
                                                <p className="mt-1 text-xs text-red-500">
                                                    {getApiErrorMessage(
                                                        reprocessMaterial.error,
                                                    )}
                                                </p>
                                            )}
                                    </div>
                                </a>

                                {m.status === "failed" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            reprocessMaterial.mutate(m.id)
                                        }
                                        disabled={reprocessMaterial.isPending}
                                        className="shrink-0 self-center rounded-lg px-3 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                                    >
                                        Tentar novamente
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleDelete(m.id)}
                                    aria-label={`Excluir ${m.title}`}
                                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ),
                    )}
                </div>
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

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Arquivo
                            </label>

                            <input
                                type="file"
                                accept=".pdf,.docx,.pptx"
                                onChange={handleFileChange}
                                className="block w-full text-sm"
                            />

                            <p className="mt-2 text-xs text-slate-400">
                                PDF, Word (.docx) ou PowerPoint (.pptx), até
                                10 MB.
                            </p>

                            {selectedFile && (
                                <p className="mt-2 text-sm text-slate-500">
                                    {selectedFile.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Disciplina
                            </label>

                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="w-full rounded-lg border bg-white px-3 py-2"
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
                            <p className="text-sm text-red-500">
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
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50"
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
