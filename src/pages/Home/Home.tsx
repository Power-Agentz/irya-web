import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useQuestionarioStatus } from "../../hooks/useQuestionarioStatus";
import Loading from "../../components/Loading/Loading";
import { getPacientePrimeiroNome } from "../../utils/session";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getDiasRestantes = (limite?: string | Date): number => {
  if (!limite) return 0;
  const dataLimite = new Date(limite);
  const hoje = new Date();
  const diff = dataLimite.getTime() - hoje.getTime();

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getMensagemFrequencia = (diasRestantes: number): string => {
  if (diasRestantes <= 0) {
    return "Seu próximo check-in mensal já está liberado.";
  }

  if (diasRestantes === 1) {
    return "Responda novamente em 1 dia.";
  }

  return `Responda novamente em ${diasRestantes} dias.`;
};

const formatPeso = (peso: number | null): string => {
  if (peso === null || Number.isNaN(peso)) {
    return "Não registrado";
  }

  return `${peso.toFixed(1).replace(".", ",")} kg`;
};

const getVariacaoPesoTexto = (variacao: number | null): string => {
  if (variacao === null || Number.isNaN(variacao) || variacao === 0) {
    return "sem variação desde o último registro";
  }

  const valor = Math.abs(variacao).toFixed(1).replace(".", ",");
  return variacao > 0 ? `ganhou ${valor} kg` : `perdeu ${valor} kg`;
};

const Home = () => {
  const navigate = useNavigate();
  const nome = getPacientePrimeiroNome();

  const { status, loading } = useQuestionarioStatus();

  if (loading) return <Loading />;

  const podeResponder = status?.podeResponder;
  const resultadoAnterior = status?.resultadoAnterior;
  const pesoAtualKg = status?.pesoAtualKg ?? null;
  const variacaoPesoKg = status?.variacaoPesoKg ?? null;
  const diasRestantes = getDiasRestantes(resultadoAnterior?.dataLimite);
  const mensagemFrequencia = getMensagemFrequencia(diasRestantes);

  return (
    <Container>
      <div className="mx-auto w-full max-w-[760px] pb-4">
        {podeResponder && (
          <section className="mb-5 rounded-2xl border border-[#c7d5b5] bg-gradient-to-r from-[#f6faef] to-[#eef5e2] p-5 shadow-[0_14px_34px_rgba(24,28,20,0.12)] sm:mb-6 sm:p-7">
            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7a5d]">
                Check-in mensal liberado
              </p>
              <h2 className="text-lg font-semibold text-[#34412d] sm:text-xl">
                Seu questionário já pode ser respondido
              </h2>
              <p className="text-sm leading-relaxed text-[#4f5548] sm:text-base">
                Leva menos de 5 minutos e ajuda a manter sua evolução alinhada com o momento atual.
              </p>
            </header>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <Button
                onClick={() => navigate("/questionario")}
                variant="primary"
                label="Iniciar questionário agora"
              />

              <button
                type="button"
                className="h-11 rounded-lg border border-[#87967a]/40 bg-white/50 px-4 text-sm font-semibold text-[#6b7c5d] transition hover:bg-white/80"
                onClick={() => navigate("/resultado")}
              >
                Ver meu último resultado
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_14px_34px_rgba(24,28,20,0.12)] backdrop-blur-md sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7d63]">
            Portal Irya
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#3c4934] sm:text-3xl">
            {nome ? `Olá, ${nome}` : "Olá"}
          </h1>
          <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-[#56614b] sm:text-base">
            Aqui você acompanha sua evolução com clareza e em pequenos passos.
            O foco não é perfeição, é constância com leveza.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-[#e2e7d7] bg-[#f7f9f2] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">Seu momento</p>
              <p className="mt-2 text-sm font-medium text-[#46533e]">
                {resultadoAnterior?.classificacao || "Primeiro ciclo"}
              </p>
            </article>

            <article className="rounded-xl border border-[#e2e7d7] bg-[#f7f9f2] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">Último ritual</p>
              <p className="mt-2 text-sm font-medium text-[#46533e]">
                {resultadoAnterior?.dataConclusao
                  ? formatDate(resultadoAnterior.dataConclusao)
                  : "Ainda não respondido"}
              </p>
            </article>

            <article className="rounded-xl border border-[#e2e7d7] bg-[#f7f9f2] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">Próxima ação</p>
              <p className="mt-2 text-sm font-medium text-[#46533e]">
                {podeResponder
                  ? "Questionário disponível"
                  : diasRestantes > 0
                    ? `Disponível em ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""}`
                    : "Acompanhe seu resultado"}
              </p>
            </article>
          </div>

          <div className="mt-4 rounded-xl border border-[#d8e2cc] bg-gradient-to-r from-[#f8fbf3] to-[#eef5e4] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">
              Peso Atual
            </p>
            <p className="mt-1 text-base font-semibold text-[#3f4c36] sm:text-lg">
              {formatPeso(pesoAtualKg)}
            </p>
            <p className="mt-1 text-sm text-[#5d6a50]">
              {pesoAtualKg === null
                ? "Seu primeiro registro será salvo ao concluir o próximo questionário."
                : getVariacaoPesoTexto(variacaoPesoKg)}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-[#e2e7d7] bg-[#f7f9f2] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">
              Frequência do check-in
            </p>
            <p className="mt-2 text-sm font-medium text-[#46533e] sm:text-base">
              O questionário é mensal e deve ser respondido a cada 30 dias.
            </p>
            <p className="mt-1 text-sm text-[#5d6a50]">{mensagemFrequencia}</p>
          </div>
        </section>

        {!podeResponder && (
          <section className="mt-5 rounded-2xl border border-white/70 bg-white/72 p-5 shadow-[0_14px_34px_rgba(24,28,20,0.12)] backdrop-blur-md sm:mt-6 sm:p-7">
            <>
              <header className="space-y-2">
                <h2 className="text-lg font-semibold text-[#34412d] sm:text-xl">
                  Agora é fase de consolidação
                </h2>
                <p className="text-sm leading-relaxed text-[#4f5548] sm:text-base">
                  Seu último ritual foi concluído recentemente. Use esse período
                  para praticar as recomendações e observar como seu corpo e sua
                  rotina respondem.
                </p>
              </header>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <Button
                  onClick={() => navigate("/resultado")}
                  variant="primary"
                  label="Revisar meu resultado"
                />
                <div className="inline-flex h-11 items-center rounded-lg border border-[#d2dac3] bg-[#f1f4ea] px-4 text-sm font-semibold text-[#5f6f52]">
                  {diasRestantes > 0
                    ? `Disponível em ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""}`
                    : "Em breve disponível"}
                </div>
              </div>
            </>
          </section>
        )}

        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-[#dfe6d4] bg-[#f7f9f2]/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">
              Dica da semana
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#4a5641] sm:text-base">
              Escolha um único hábito para fortalecer nos próximos 7 dias.
              Consistência vence intensidade.
            </p>
          </article>

          <article className="rounded-xl border border-[#dfe6d4] bg-[#f7f9f2]/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">
              Lembrete
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#4a5641] sm:text-base">
              Seu progresso é acumulativo. Toda escolha pequena conta para o
              resultado global.
            </p>
          </article>
        </section>
      </div>
    </Container>
  );
};

export default Home;
