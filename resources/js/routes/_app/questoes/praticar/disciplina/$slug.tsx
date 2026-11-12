import PageHeader from "@/components/PageHeader";
import QuestionPractice from "@/components/QuestionPractice";
import { api } from "@/lib/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute(
    "/_app/questoes/praticar/disciplina/$slug",
)({
    loader: async ({ params }) => {
        const response = await api.get(`/api/questions/subject/${params.slug}`);

        return response.data;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { questions, subject } = Route.useLoaderData();
    return (
        <div className="mx-auto max-w-3xl p-5 sm:p-8 lg:p-12">
            <Link
                to="/questoes"
                className="-mt-2 mb-2 -ml-2 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
                <ChevronLeft size={16} />
                Voltar
            </Link>
            <PageHeader
                eyebrow="Prática ativa"
                title={subject?.name}
                description="Pratique questões de múltipla escolha para reforçar seu aprendizado."
            />
            <QuestionPractice questions={questions} />{" "}
        </div>
    );
}
