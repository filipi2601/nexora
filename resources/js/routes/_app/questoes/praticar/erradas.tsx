import BackLink from "@/components/BackLink";
import PageHeader from "@/components/PageHeader";
import QuestionPractice from "@/components/QuestionPractice";
import { api } from "@/lib/api";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/questoes/praticar/erradas")({
    loader: async () => {
        const response = await api.get("/api/questions/wrong");
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
                title="Erradas recentemente"
                description="Reforce o que você ainda não dominou."
            />
            <QuestionPractice questions={questions} />
        </div>
    );
}
