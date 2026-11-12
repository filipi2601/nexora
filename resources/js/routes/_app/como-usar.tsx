import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowRight,
    Bot,
    Brain,
    ChartNoAxesCombined,
    ChevronDown,
    Layers3,
    Library,
    Lightbulb,
    Sparkles,
    Target,
    type LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

export const Route = createFileRoute("/_app/como-usar")({
    component: RouteComponent,
});

type AppPath =
    | "/disciplinas"
    | "/biblioteca"
    | "/flashcards"
    | "/questoes"
    | "/estudar"
    | "/tutor"
    | "/desempenho";

/** O caminho completo, do zero até estudar, para mostrar no topo da página. */
const JOURNEY: [LucideIcon, string][] = [
    [Brain, "Disciplina"],
    [Library, "Materiais"],
    [Sparkles, "Tópicos"],
    [Layers3, "Flashcards e questões"],
    [Target, "Estudar"],
    [ChartNoAxesCombined, "Desempenho"],
];

function RouteComponent() {
    return (
        <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-12">
            <PageHeader
                eyebrow="Ajuda"
                title="Como usar o Nexora"
                description="Um guia passo a passo para transformar os seus materiais de aula em resumos, flashcards e questões. Não precisa entender nada de tecnologia: é só seguir a ordem abaixo."
            />

            <section className="rounded-3xl border bg-white p-6">
                <h2 className="font-bold">O caminho, em resumo</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Você só faz os passos 1, 2 e 4. O resto a inteligência
                    artificial (IA) faz por você.
                </p>
                <ol className="mt-5 flex flex-wrap items-center gap-2">
                    {JOURNEY.map(([Icon, label], index) => (
                        <li key={label} className="flex items-center gap-2">
                            <span className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                                <Icon size={15} />
                                {index + 1}. {label}
                            </span>
                            {index < JOURNEY.length - 1 && (
                                <ArrowRight
                                    size={14}
                                    className="text-slate-300"
                                />
                            )}
                        </li>
                    ))}
                </ol>
            </section>

            <h2 className="mb-4 mt-10 text-lg font-bold">Passo a passo</h2>

            <ol className="space-y-4">
                <StepCard
                    number={1}
                    icon={Brain}
                    title="Crie uma disciplina"
                    to="/disciplinas"
                    linkLabel="Ir para Disciplinas"
                >
                    <p>
                        A disciplina é a "pasta" de uma matéria, como
                        "Biologia" ou "Redes de Computadores". Tudo o que você
                        enviar e estudar fica organizado dentro dela.
                    </p>
                    <Actions>
                        <li>
                            No menu, clique em <UiName>Disciplinas</UiName>.
                        </li>
                        <li>
                            Clique em <UiName>Nova disciplina</UiName>, digite o
                            nome da matéria e confirme.
                        </li>
                    </Actions>
                    <Tip>Crie uma disciplina para cada matéria do seu curso.</Tip>
                </StepCard>

                <StepCard
                    number={2}
                    icon={Library}
                    title="Envie os seus materiais"
                    to="/biblioteca"
                    linkLabel="Ir para a Biblioteca"
                >
                    <p>
                        Materiais são os arquivos da matéria: apostilas, slides
                        da aula, resumos. A IA lê esses arquivos para montar o
                        seu estudo.
                    </p>
                    <Actions>
                        <li>
                            No menu, clique em <UiName>Biblioteca</UiName> e
                            depois em <UiName>Adicionar material</UiName>.
                        </li>
                        <li>
                            Escolha o arquivo no seu computador ou celular:{" "}
                            <b>PDF</b>, <b>Word (.docx)</b> ou{" "}
                            <b>PowerPoint (.pptx)</b>, de até 10 MB.
                        </li>
                        <li>
                            Escolha a disciplina do material e clique em{" "}
                            <UiName>Enviar material</UiName>.
                        </li>
                    </Actions>
                    <p>
                        O material aparece primeiro como{" "}
                        <UiName>Na fila...</UiName> e depois{" "}
                        <UiName>Processando...</UiName>. Isso costuma levar
                        alguns minutos, e você pode continuar usando o app
                        enquanto isso.
                    </p>
                    <Tip>
                        Se aparecer <UiName>Falha ao processar</UiName>, clique
                        em <UiName>Tentar novamente</UiName>. Arquivos antigos
                        do Office (.doc e .ppt) não são aceitos: abra no Word ou
                        no PowerPoint e use "Salvar como" .docx ou .pptx.
                    </Tip>
                </StepCard>

                <StepCard
                    number={3}
                    icon={Sparkles}
                    title="A IA organiza os tópicos (automático)"
                    to="/disciplinas"
                    linkLabel="Ver os tópicos"
                >
                    <p>
                        Depois de ler os materiais, a IA divide a matéria em{" "}
                        <b>tópicos</b>, os assuntos que você precisa aprender,
                        e escreve um resumo explicando cada um. Você não precisa
                        fazer nada nesta etapa.
                    </p>
                    <Actions>
                        <li>
                            Para ver, entre em <UiName>Disciplinas</UiName> e
                            clique na disciplina.
                        </li>
                        <li>
                            Clique em um tópico para ler o resumo e ver os
                            subtópicos.
                        </li>
                    </Actions>
                    <Tip>
                        Enviou mais um material depois? Os tópicos se atualizam
                        sozinhos enquanto você ainda não gerou flashcards nem
                        questões. Depois disso, use{" "}
                        <UiName>Regenerar tópicos</UiName> na tela de
                        Disciplinas, mas atenção: isso{" "}
                        <b>apaga os flashcards e as questões</b> já gerados da
                        disciplina.
                    </Tip>
                </StepCard>

                <StepCard
                    number={4}
                    icon={Layers3}
                    title="Gere flashcards e questões"
                    to="/flashcards"
                    linkLabel="Ir para Flashcards"
                >
                    <p>
                        <b>Flashcards</b> são cartões com uma pergunta na frente
                        e a resposta no verso, para treinar a memória.{" "}
                        <b>Questões</b> são de múltipla escolha, como numa
                        prova, e vêm com a explicação da resposta certa.
                    </p>
                    <Actions>
                        <li>
                            <b>Flashcards:</b> no menu, clique em{" "}
                            <UiName>Flashcards</UiName>, abra a disciplina e,
                            em cada tópico, clique em{" "}
                            <UiName>Gerar flashcards</UiName>.
                        </li>
                        <li>
                            <b>Questões:</b> no menu, clique em{" "}
                            <UiName>Questões</UiName>, depois em{" "}
                            <UiName>Banco de questões</UiName> e em{" "}
                            <UiName>Gerar questões</UiName> ao lado da
                            disciplina.
                        </li>
                    </Actions>
                    <p>
                        A geração leva um tempinho e continua mesmo se você
                        sair da tela.
                    </p>
                    <Tip>
                        Achou um flashcard ou uma questão que não faz sentido?
                        Você pode excluir. A IA às vezes erra, então confira
                        com o seu material.
                    </Tip>
                </StepCard>

                <StepCard
                    number={5}
                    icon={Target}
                    title="Estude"
                    to="/estudar"
                    linkLabel="Começar a estudar"
                >
                    <p>
                        O jeito mais fácil é a sessão de estudo: o app escolhe
                        sozinho o que você deve revisar hoje, misturando
                        flashcards e questões.
                    </p>
                    <Actions>
                        <li>
                            No menu, clique em <UiName>Estudar</UiName> e depois
                            em <UiName>Começar sessão</UiName>.
                        </li>
                        <li>
                            <b>Em um flashcard:</b> leia a pergunta, tente
                            lembrar a resposta e clique em{" "}
                            <UiName>Mostrar resposta</UiName>. Depois, diga como
                            foi: <UiName>De novo</UiName>,{" "}
                            <UiName>Difícil</UiName>, <UiName>Bom</UiName> ou{" "}
                            <UiName>Fácil</UiName>.
                        </li>
                        <li>
                            <b>Em uma questão:</b> escolha a alternativa e leia
                            a explicação.
                        </li>
                    </Actions>
                    <Tip>
                        Seja sincero na resposta dos flashcards: o app usa isso
                        para decidir quando mostrar cada cartão de novo. O que
                        você erra volta logo; o que você sabe bem demora mais a
                        voltar. Isso se chama <b>revisão espaçada</b>.
                    </Tip>
                    <p>
                        Quer escolher o que praticar? Em{" "}
                        <UiName>Questões</UiName> há{" "}
                        <UiName>Recomendadas</UiName>,{" "}
                        <UiName>Por disciplina</UiName> e{" "}
                        <UiName>Erradas recentemente</UiName>, e em{" "}
                        <UiName>Flashcards</UiName> você revisa uma disciplina
                        com <UiName>Começar revisão</UiName>.
                    </p>
                </StepCard>

                <StepCard
                    number={6}
                    icon={Bot}
                    title="Tire dúvidas com o Tutor IA"
                    to="/tutor"
                    linkLabel="Ir para o Tutor IA"
                >
                    <p>
                        O tutor é um professor virtual que conhece os seus
                        materiais. Pergunte como perguntaria em sala de aula.
                    </p>
                    <Actions>
                        <li>
                            No menu, clique em <UiName>Tutor IA</UiName>.
                        </li>
                        <li>
                            Escolha a disciplina e, se quiser, um tópico
                            específico. Clique em{" "}
                            <UiName>Começar conversa</UiName>.
                        </li>
                        <li>
                            Escreva a sua dúvida, por exemplo: "Me explica de
                            outro jeito o que é TCP" ou "Me dá um exemplo".
                        </li>
                    </Actions>
                </StepCard>

                <StepCard
                    number={7}
                    icon={ChartNoAxesCombined}
                    title="Acompanhe o seu desempenho"
                    to="/desempenho"
                    linkLabel="Ver o desempenho"
                >
                    <p>
                        Em <UiName>Desempenho</UiName> você vê quanto tem
                        acertado ao longo do tempo e as{" "}
                        <b>Áreas de atenção</b>: os tópicos que mais precisam
                        de revisão agora.
                    </p>
                    <p>
                        A prioridade de cada tópico considera duas coisas:{" "}
                        <b>quanto você acerta</b> e{" "}
                        <b>há quanto tempo não pratica</b>. Um tópico em que você
                        erra muito e não vê há semanas fica no topo. Para ver o
                        cálculo, clique em <UiName>Como é calculada</UiName>.
                    </p>
                </StepCard>
            </ol>

            <h2 className="mb-4 mt-10 text-lg font-bold">Perguntas frequentes</h2>

            <div className="divide-y rounded-3xl border bg-white">
                <Question title="Quanto tempo demora para um material ficar pronto?">
                    Normalmente alguns minutos. Arquivos grandes demoram mais.
                    Você pode usar o resto do app enquanto espera; a tela se
                    atualiza sozinha.
                </Question>
                <Question title="Posso enviar um PDF escaneado (foto das páginas)?">
                    Pode, mas ele só é lido se a IA escolhida em Configurações
                    → Inteligência artificial ler PDF (OpenAI ou Google Gemini).
                    Se o material falhar, prefira um PDF com texto selecionável.
                </Question>
                <Question title='Apareceu "A última geração falhou". E agora?'>
                    Clique em gerar de novo. Se continuar falhando, espere
                    alguns minutos: o serviço de IA pode estar ocupado. Se a
                    mensagem falar de chave, confira em Configurações →
                    Inteligência artificial.
                </Question>
                <Question title="Preciso ter uma conta ou chave de IA?">
                    Não. O app já vem com uma IA configurada. Se quiser usar a
                    sua própria chave (do Google Gemini, Groq ou OpenAI), vá em
                    Configurações → Inteligência artificial.
                </Question>
                <Question title="A IA pode errar?">
                    Pode. Use os resumos, flashcards e questões como apoio e
                    confira com o material da aula. Exclua o que estiver errado.
                </Question>
                <Question title='O que são o "domínio geral" e a "sequência" na tela inicial?'>
                    O domínio geral é a sua porcentagem de acertos nas questões.
                    A sequência conta quantos dias seguidos você estudou: estude
                    um pouco todo dia para não perdê-la.
                </Question>
            </div>

            <section className="mt-10 flex flex-col items-start justify-between gap-5 rounded-3xl bg-indigo-50 p-7 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-bold">Pronto para começar?</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        O primeiro passo é criar a sua primeira disciplina.
                    </p>
                </div>
                <Link
                    to="/disciplinas"
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                    Criar uma disciplina <ArrowRight size={16} />
                </Link>
            </section>
        </div>
    );
}

function StepCard({
    number,
    icon: Icon,
    title,
    to,
    linkLabel,
    children,
}: {
    number: number;
    icon: LucideIcon;
    title: string;
    to: AppPath;
    linkLabel: string;
    children: ReactNode;
}) {
    return (
        <li className="rounded-3xl border bg-white p-6">
            <div className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                    {number}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 font-bold">
                        <Icon size={18} className="text-indigo-600" />
                        {title}
                    </h3>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                        {children}
                    </div>
                    <Link
                        to={to}
                        className="-ml-2 mt-3 inline-flex min-h-10 items-center gap-1 px-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                        {linkLabel} <ArrowRight size={15} />
                    </Link>
                </div>
            </div>
        </li>
    );
}

/** A lista do que fazer, em ordem. */
function Actions({ children }: { children: ReactNode }) {
    return (
        <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-indigo-600">
            {children}
        </ol>
    );
}

/** O nome de um botão, menu ou aviso, escrito igual ao que aparece na tela. */
function UiName({ children }: { children: ReactNode }) {
    return (
        <span className="whitespace-nowrap rounded-md bg-slate-100 px-1.5 py-0.5 text-[13px] font-semibold text-slate-800">
            {children}
        </span>
    );
}

function Tip({ children }: { children: ReactNode }) {
    return (
        <p className="flex gap-2 rounded-2xl bg-amber-50 p-4 text-amber-900">
            <Lightbulb size={17} className="mt-1 shrink-0 text-amber-500" />
            <span>{children}</span>
        </p>
    );
}

function Question({ title, children }: { title: string; children: ReactNode }) {
    return (
        <details className="group p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {title}
                <ChevronDown
                    size={18}
                    className="shrink-0 text-slate-400 transition group-open:rotate-180"
                />
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">{children}</p>
        </details>
    );
}
