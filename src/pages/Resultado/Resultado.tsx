import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PolarAngleAxis,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import { FiLock } from "react-icons/fi";
import Container from "../../components/Container/Container";
import Loading from "../../components/Loading/Loading";
import Button from "../../components/Button/Button";
import BackButton from "../../components/BackButton/BackButton";
import { useQuestionarioStatus } from "../../hooks/useQuestionarioStatus";
import { isPacienteSubscriber } from "../../utils/session";
import ChatOffer from "../../components/ChatOffer/ChatOffer";
import iryaSaudando from "../../../assets/irya-saudando.png";

const PILAR_COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];

type FaixaNarrativa = {
  badge: string;
  titulo: string;
  mensagem: string;
  proximoPasso: string;
  accentClass: string;
};

type PilarNarrativa = {
  nivel: string;
  mensagem: string;
};

const formatAltura = (altura: number | null): string => {
  if (altura === null || Number.isNaN(altura)) return "Não registrada";
  return `${altura.toFixed(2).replace(".", ",")} m`;
};

const formatImc = (imc: number | null): string => {
  if (imc === null || Number.isNaN(imc)) return "Não calculado";
  return imc.toFixed(1).replace(".", ",");
};

const getImcClassificacao = (imc: number | null): string => {
  if (imc === null || Number.isNaN(imc)) return "";
  if (imc < 18.5) return "Abaixo do ideal";
  if (imc < 25) return "Faixa saudável";
  if (imc < 30) return "Acima do ideal";
  if (imc < 35) return "Obesidade I";
  if (imc < 40) return "Obesidade II";
  return "Obesidade III";
};

const getFaixaNarrativa = (percentual: number): FaixaNarrativa => {
  if (percentual <= 20) {
    return {
      badge: "Momento de Recomeço",
      titulo: "Você tem espaço real para evoluir",
      mensagem:
        "Seu resultado mostra que este é um ótimo ponto de virada. Pequenos ajustes consistentes já podem gerar mudanças importantes.",
      proximoPasso:
        "Comece com 1 hábito simples por vez e mantenha por 7 dias antes de avançar para o próximo.",
      accentClass: "border-l-[#cf5a5a]",
    };
  }

  if (percentual <= 40) {
    return {
      badge: "Base em Construção",
      titulo: "Você está perto de uma vida mais equilibrada",
      mensagem:
        "Existe progresso acontecendo. Com mais constância nas rotinas essenciais, seu bem-estar tende a crescer rápido.",
      proximoPasso:
        "Priorize sono e alimentação nesta semana. Fortalecer a base acelera todo o resto.",
      accentClass: "border-l-[#e68c3f]",
    };
  }

  if (percentual <= 60) {
    return {
      badge: "Ritmo de Equilíbrio",
      titulo: "Você está no caminho certo",
      mensagem:
        "Seu cenário já mostra estabilidade em áreas importantes. O foco agora é reduzir oscilações e manter o ritmo.",
      proximoPasso:
        "Escolha 1 pilar que está abaixo dos outros e concentre energia nele pelos próximos dias.",
      accentClass: "border-l-[#d8ad35]",
    };
  }

  if (percentual <= 80) {
    return {
      badge: "Fase de Consolidação",
      titulo: "Sua rotina já sustenta bons resultados",
      mensagem:
        "Você está em um nível muito positivo. A meta agora é transformar bons comportamentos em padrão de longo prazo.",
      proximoPasso:
        "Mantenha o que já funciona e ajuste apenas pontos específicos para evitar recaídas.",
      accentClass: "border-l-[#7fa04f]",
    };
  }

  return {
    badge: "Vitalidade em Alta",
    titulo: "Seu estilo de vida está muito bem alinhado",
    mensagem:
      "Parabéns. Você alcançou um nível forte de equilíbrio e vitalidade. Continue refinando sem perder a leveza.",
    proximoPasso:
      "Use essa fase para consolidar hábitos-chave e apoiar outras áreas com micro ajustes.",
    accentClass: "border-l-[#4caf50]",
  };
};

const getPilarNarrativa = (percentual: number): PilarNarrativa => {
  if (percentual <= 20) {
    return {
      nivel: "Atenção Prioritária",
      mensagem: "Esse pilar pede cuidado imediato. Pequenos passos diários farão diferença.",
    };
  }

  if (percentual <= 40) {
    return {
      nivel: "Em Desenvolvimento",
      mensagem: "Você já começou a evoluir aqui. Falta consistência para virar rotina.",
    };
  }

  if (percentual <= 60) {
    return {
      nivel: "Em Progresso",
      mensagem: "Há bons sinais neste pilar. Ajustes pontuais podem elevar seu resultado.",
    };
  }

  if (percentual <= 80) {
    return {
      nivel: "Bem Estruturado",
      mensagem: "Esse pilar está sólido. Mantenha constância para não perder tração.",
    };
  }

  return {
    nivel: "Ponto Forte",
    mensagem: "Excelente consistência. Use este pilar como referência para os demais.",
  };
};

const Resultado: React.FC = () => {
  const navigate = useNavigate();
  const { status, loading, error } = useQuestionarioStatus();
  const isSubscriber = isPacienteSubscriber();

  const resultadoData = status?.resultadoAnterior;
  const alturaM = status?.alturaM ?? resultadoData?.alturaM ?? null;
  const imcAtual = status?.imcAtual ?? resultadoData?.imcAtual ?? null;

  const chartData = useMemo(() => {
    if (!resultadoData) return [];

    return resultadoData.detalhesPilares.map((pilar, index) => ({
      name: pilar.nome,
      value: pilar.percentualPilar,
      pontuacaoObtida: pilar.pontuacaoObtida,
      pontuacaoMaxima: pilar.pontuacaoMaxima,
      fill: PILAR_COLORS[index % PILAR_COLORS.length],
      fullMark: 100,
      ...getPilarNarrativa(pilar.percentualPilar),
    }));
  }, [resultadoData]);

  if (loading) {
    return <Loading />;
  }

  if (error || !resultadoData) {
    return (
      <Container>
        <div className="mx-auto w-full max-w-[820px]">
          <BackButton />
          <div className="rounded-xl border border-white/70 bg-white/72 p-5 shadow-[0_14px_34px_rgba(24,28,20,0.12)] backdrop-blur-md sm:p-6">
            <h1 className="text-xl font-semibold text-[#3f4c36] sm:text-2xl">Sem resultados disponíveis</h1>
            <p className="mt-2 text-sm text-[#5a6251] sm:text-base">
              Você ainda não concluiu o questionário ou não há resultados para exibir.
            </p>
            <Button
              onClick={() => navigate("/questionario")}
              variant="primary"
              label="Responder Questionário"
              className="mt-5"
            />
          </div>
        </div>
      </Container>
    );
  }

  const { percentualGlobal, classificacao, dataConclusao } = resultadoData;
  const narrativaGlobal = getFaixaNarrativa(percentualGlobal);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Container>
      <div className="mx-auto w-full max-w-[980px]">
        <BackButton />

        <h1 className="text-2xl font-semibold text-[#3f4c36] sm:text-3xl">
          Prontinho! Confira o seu resultado abaixo.
        </h1>
        <p className="mt-1 text-sm text-[#5f6657] sm:text-base">
          Última atualização: {formatDate(dataConclusao)}
        </p>

        <div
          className={`mt-5 rounded-2xl border-l-[6px] bg-gradient-to-br from-white to-[#f4f1e8] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.12)] sm:p-6 ${narrativaGlobal.accentClass}`}
        >
          <div>
            <p className="inline-flex rounded-full bg-[#e9ecdf] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#5e6b4f]">
              {narrativaGlobal.badge}
            </p>

            <h2 className="mt-3 text-2xl font-bold text-[#384231] sm:text-3xl">
              {narrativaGlobal.titulo}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-[#59624f] sm:text-base">
              {narrativaGlobal.mensagem}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-[#dfe5d2] bg-[#f9faf6] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6f7b61]">
              Próximo passo sugerido
            </p>
            <p className="mt-1 text-sm text-[#4f5945] sm:text-base">{narrativaGlobal.proximoPasso}</p>
          </div>

          <p className="mt-4 text-xs text-[#707a66] sm:text-sm">
            Classificação técnica atual: <b>{classificacao}</b>
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#dce4cf] bg-[#f7faf2] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7a5d]">
                Altura considerada
              </p>
              <p className="mt-1 text-sm font-semibold text-[#42503a] sm:text-base">
                {formatAltura(alturaM)}
              </p>
            </div>
            <div className="rounded-xl border border-[#dce4cf] bg-[#f7faf2] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7a5d]">
                IMC atual
              </p>
              <p className="mt-1 text-sm font-semibold text-[#42503a] sm:text-base">
                {formatImc(imcAtual)}
                {imcAtual !== null && (
                  <span className="ml-1 font-medium text-[#5b684f]">
                    ({getImcClassificacao(imcAtual)})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <h3 className="mt-7 border-b-2 border-b-[#87967a] pb-2 text-lg font-semibold text-[#5f6f52] sm:mt-8 sm:text-xl">
          Leitura por Pilar
        </h3>

        <div className="mt-3 rounded-xl border border-white/70 bg-white/72 p-2 shadow-[0_14px_34px_rgba(24,28,20,0.12)] backdrop-blur-md sm:p-4">
          <div className="h-[320px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="20%"
                outerRadius="80%"
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border border-[#e2e7d7] bg-[#f7f9f2] px-3 py-2 text-sm"
              >
                <span className="inline-flex items-center gap-2 text-[#46533e]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-[#3f4c36]">
                  {item.pontuacaoObtida}/{item.pontuacaoMaxima}
                </span>
              </div>
            ))}
          </div>
        </div>

        <h3 className="mt-7 border-b-2 border-b-[#87967a] pb-2 text-lg font-semibold text-[#5f6f52] sm:mt-8 sm:text-xl">
          Insights por Pilar
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {resultadoData.detalhesPilares.map((pilar) => {
            const narrativa = getPilarNarrativa(pilar.percentualPilar);
            return (
              <article
                key={pilar.nome}
                className="rounded-xl border border-[#e2e6dc] bg-white/82 p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-semibold text-[#3f4c36]">{pilar.nome}</h4>
                  <span className="rounded-full bg-[#edf1e5] px-2.5 py-1 text-xs font-semibold text-[#5d6b4d]">
                    {narrativa.nivel}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#55604a] sm:text-base">
                  {narrativa.mensagem}
                </p>
              </article>
            );
          })}
        </div>

        {!isSubscriber && (
          <section className="mt-8 rounded-2xl border border-[#d6e0c7] bg-gradient-to-br from-[#f8fced] via-[#f2f8e7] to-[#edf4e0] p-5 shadow-[0_14px_34px_rgba(24,28,20,0.12)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6d7a5d]">Prévia do Premium</p>
            <h4 className="mt-2 text-lg font-semibold text-[#334329] sm:text-xl">
              EU JÁ BOLEI UM PLANO EXCLUSIVO E PERSONALIZADO PARA VOCÊ.
            </h4>
            <p className="mt-1 text-sm font-medium text-[#536248] sm:text-base">
              Essa prévia mostra o começo da sua virada. Desbloqueie o Premium e receba o plano completo agora.
            </p>

            <div className="relative mt-5 overflow-hidden rounded-xl border border-[#dce5cf] bg-white/80 p-4">
              <div className="pointer-events-none absolute inset-0 z-20 bg-white/25 backdrop-blur-[4px]" />
              <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#cddbbc] bg-[#f3f8ea]/95 text-[#5f7450] shadow-[0_10px_20px_rgba(36,49,30,0.18)]">
                  <FiLock className="h-7 w-7" />
                </span>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-16 bg-gradient-to-t from-[#edf4e0] to-transparent" />

              <p className="text-xs font-semibold uppercase tracking-wide text-[#6f7d63]">
                Prévia do plano exclusivo
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[#4f5a45] sm:grid-cols-2">
                <div className="rounded-lg border border-[#e5ebdb] bg-[#f8fbf3] p-3">
                  Pilar prioritário da semana: Energia e Sono
                </div>
                <div className="rounded-lg border border-[#e5ebdb] bg-[#f8fbf3] p-3">
                  Meta semanal: rotina noturna em 3 passos
                </div>
                <div className="rounded-lg border border-[#e5ebdb] bg-[#f8fbf3] p-3">
                  Plano alimentar guiado por sintomas
                </div>
                <div className="rounded-lg border border-[#e5ebdb] bg-[#f8fbf3] p-3">
                  Ajustes de estilo de vida com acompanhamento
                </div>
              </div>
            </div>

            <ChatOffer
              className="mt-5"
              avatarSrc={iryaSaudando}
              message="Seu resultado já mostrou o próximo passo. No Premium, eu transformo isso em um plano exclusivo e te acompanho diariamente para manter constância."
              priceLine="R$ 49,00/mês."
              policyLine="Cancele online a qualquer momento."
              ctaLabel="Quero continuar com meu plano exclusivo"
              onClick={() => navigate("/assinatura")}
            />
          </section>
        )}
      </div>
    </Container>
  );
};

export default Resultado;
