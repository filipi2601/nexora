import BackLink from "@/components/BackLink";
import SubjectBand from "@/components/SubjectBand";
import QuestionPractice from "@/components/QuestionPractice";
import { api } from "@/lib/api";
import { useSubjectColors } from "@/lib/subject-colors";
import { createFileRoute } from "@tanstack/react-router";

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
    const colors = useSubjectColors();

    return (
        <div className="page page-narrow">
            <BackLink to="/questoes" />
            <SubjectBand
                color={colors.byId(subject?.id)}
                title={subject?.name}
                description="Pratique questões de múltipla escolha para reforçar seu aprendizado."
            />
            <QuestionPractice questions={questions} />
        </div>
    );
}
