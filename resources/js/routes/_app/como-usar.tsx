import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowRight,
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
        <div className="page page-narrow">
            <PageHeader
                title="Como usar o Nexora"
                description="Um guia passo a passo para transformar os seus materiais de aula em resumos, flashcards e questões. Não precisa entender nada de tecnologia: é só seguir a ordem abaixo."
            />

            <section aria-labelledby="journey" className="sheet p-6">
                <h2 id="journey" className="section-title">
                    O caminho, em resumo
                </h2>
                <p className="mt-1.5 text-[15px] text-ink-soft">
                    Você só faz os passos 1, 2 e 4. O resto a inteligência
                    artificial (IA) faz por você.
                </p>
                <ol className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-rule-soft pt-5 sm:grid-cols-3">
                    {JOURNEY.map(([Icon, label], index) => (
                        <li key={label} className="flex items-center gap-3">
                            <span className="figure w-5 shrink-0 text-[26px] text-ink">
                                {index + 1}
                            </span>
                            <span className="flex min-w-0 items-center gap-2 text-[15px] leading-tight font-semibold">
                                <Icon
                                    size={16}
                                    strokeWidth={1.75}
                                    aria-hidden="true"
                                    className="shrink-0 text-muted"
                                />
                                {label}
                            </span>
                        </li>
                    ))}
                </ol>
            </section>

            <h2 className="section-title mt-12 mb-4">Passo a passo</h2>

            <ol className="sheet row-divider">
                <StepCard
                    number={1}
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

            <h2 className="section-title mt-12 mb-4">Perguntas frequentes</h2>

            <div className="sheet row-divider overflow-hidden">
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

            <section
                aria-labelledby="get-started"
                className="sheet mt-12 flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center"
            >
                <div>
                    <h2 id="get-started" className="section-title">
                        Pronto para começar?
                    </h2>
                    <p className="mt-1.5 text-[15px] text-ink-soft">
                        O primeiro passo é criar a sua primeira disciplina.
                    </p>
                </div>
                <Link to="/disciplinas" className="btn btn-primary shrink-0">
                    Criar uma disciplina
                    <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </section>
        </div>
    );
}

function StepCard({
    number,
    title,
    to,
    linkLabel,
    children,
}: {
    number: number;
    title: string;
    to: AppPath;
    linkLabel: string;
    children: ReactNode;
}) {
    return (
        <li className="grid grid-cols-[2rem_1fr] gap-x-4 p-6 sm:grid-cols-[2.5rem_1fr] sm:gap-x-5 sm:p-7">
            <span className="figure text-[34px] text-ink">
                {number}
            </span>
            <div className="min-w-0">
                <h3 className="pt-1 font-display text-[22px] leading-tight font-semibold">
                    {title}
                </h3>
                <div className="mt-3 max-w-[65ch] space-y-3 text-[15px] leading-[1.65] text-ink-soft">
                    {children}
                </div>
                <Link
                    to={to}
                    className="link mt-3 inline-flex min-h-10 items-center gap-1.5 text-[15px]"
                >
                    {linkLabel}
                    <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </div>
        </li>
    );
}

function Actions({ children }: { children: ReactNode }) {
    return (
        <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-ink">
            {children}
        </ol>
    );
}

function UiName({ children }: { children: ReactNode }) {
    return (
        <span className="rounded-sm border border-rule bg-paper px-1.5 py-px text-[14px] font-semibold whitespace-nowrap text-ink">
            {children}
        </span>
    );
}

function Tip({ children }: { children: ReactNode }) {
    return (
        <p className="flex gap-3 rounded bg-paper px-4 py-3.5">
            <Lightbulb
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className="mt-1 shrink-0 text-muted"
            />
            <span>
                <b className="font-semibold text-ink">Dica:</b> {children}
            </span>
        </p>
    );
}

function Question({ title, children }: { title: string; children: ReactNode }) {
    return (
        <details className="group [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold transition-colors hover:bg-paper">
                {title}
                <ChevronDown
                    size={18}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-muted transition-transform group-open:rotate-180"
                />
            </summary>
            <p className="max-w-[65ch] px-5 pb-5 text-[15px] leading-[1.65] text-ink-soft">
                {children}
            </p>
        </details>
    );
}
