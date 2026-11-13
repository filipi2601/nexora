import BackLink from "@/components/BackLink";
import PageHeader from "@/components/PageHeader";
import QuestionPractice from "@/components/QuestionPractice";
import { api } from "@/lib/api";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/questoes/praticar/recomendadas")({
    loader: async () => {
        const response = await api.get("/api/questions/recommended");

        return response.data;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const questions = Route.useLoaderData();

    return (
        <div className="page page-narrow">
            <BackLink to="/questoes" />
            <PageHeader
                title="Recomendadas"
                description="Questões selecionadas para hoje."
            />
            <QuestionPractice questions={questions} />
        </div>
    );
}
