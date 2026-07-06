import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import ChatOffer from "../../components/ChatOffer/ChatOffer";
import { useNavigate } from "react-router-dom";
import { useQuestionarioStatus } from "../../hooks/useQuestionarioStatus";
import Loading from "../../components/Loading/Loading";
import { getPacientePrimeiroNome, isPacienteSubscriber } from "../../utils/session";
import PremiumBadge from "../../components/PremiumBadge/PremiumBadge";
import iryaReceptiva from "../../../assets/irya-receptiva.png";
import iryaSaudando from "../../../assets/irya-saudando.png";
import iryaGratidao from "../../../assets/irya-grata.png";

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

const formatAltura = (altura: number | null): string => {
  if (altura === null || Number.isNaN(altura)) {
    return "Não registrada";
  }

  return `${altura.toFixed(2).replace(".", ",")} m`;
};

const formatImc = (imc: number | null): string => {
  if (imc === null || Number.isNaN(imc)) {
    return "Não calculado";
  }

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

const Home = () => {
  const navigate = useNavigate();
  const nome = getPacientePrimeiroNome();
  const isSubscriber = isPacienteSubscriber();

  const { status, loading } = useQuestionarioStatus();

  if (loading) return <Loading />;

  const podeResponder = status?.podeResponder;
  const resultadoAnterior = status?.resultadoAnterior;
  const pesoAtualKg = status?.pesoAtualKg ?? null;
  const variacaoPesoKg = status?.variacaoPesoKg ?? null;
  const alturaM = status?.alturaM ?? null;
  const imcAtual = status?.imcAtual ?? null;
  const diasRestantes = getDiasRestantes(resultadoAnterior?.dataLimite);

  if (!resultadoAnterior) {
    return (
      <Container>
        <div className="mx-auto w-full max-w-[1200px] space-y-5 pb-4 sm:space-y-6">
          <section className="relative overflow-hidden rounded-[32px] border border-[#f1e3b9] bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(244,238,216,0.74)_100%)] p-6 shadow-[0_8px_32px_rgba(74,93,79,0.16)] backdrop-blur-md sm:p-8">
            <div className="pointer-events-none absolute -top-10 right-0 h-40 w-40 rounded-full bg-[#eacf93]/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#7c9d72]/14 blur-3xl" />
            <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div className="relative mx-auto w-full max-w-[340px] h-[260px] sm:h-[300px] lg:h-[350px]">
                <img
                  src={iryaReceptiva}
                  alt="Irya receptiva dando boas-vindas no início da jornada"
                  className="pointer-events-none absolute bottom-[-2px] left-1/2 h-[280px] w-auto -translate-x-1/2 object-contain sm:h-[320px] lg:h-[380px]"
                />
              </div>

              <div>
                <header className="space-y-3">
                  <p className="irya-section-label">
                    Bem-vinda à Minha Irya <span className="ml-0.5 text-xs">©</span>
                  </p>
                  <div className="flex max-w-[32rem] flex-wrap items-center gap-2 mb-0">
                    <h1 className="irya-display text-2xl sm:text-4xl">
                      {nome ? `Olá, ${nome}.` : "Olá"}
                    </h1>
                    {isSubscriber && <PremiumBadge />}
                  </div>
                  <h2 className="irya-display text-2xl sm:text-4xl">
                    Vamos começar seu primeiro ritual?
                  </h2>
                  <p className="max-w-[56ch] text-sm leading-relaxed text-[#4a5d4f] sm:text-base">
                    Seu primeiro check-in leva poucos minutos e inaugura o acompanhamento da sua evolução.
                  </p>
                </header>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:max-w-[430px]">
                  <Button
                    onClick={() => navigate("/questionario")}
                    variant="primary"
                    label="Iniciar avaliação de estilo de vida"
                  />
                  <p className="text-center text-xs font-medium text-[#7c9d72] sm:text-sm">
                    Leva menos de 5 minutos para concluir.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-[32px] border border-[#f1e3b9] bg-white/88 p-5 shadow-[0_4px_16px_rgba(74,93,79,0.12)] backdrop-blur-md">
              <p className="irya-section-label">
                Clareza
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#4a5d4f] sm:text-base">
                Entenda o que está acontecendo com seu corpo e sua rotina.
              </p>
            </article>

            <article className="rounded-[32px] border border-[#f1e3b9] bg-white/88 p-5 shadow-[0_4px_16px_rgba(74,93,79,0.12)] backdrop-blur-md">
              <p className="irya-section-label">
                Direção e acompanhamento
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#4a5d4f] sm:text-base">
                Receba orientações práticas e acompanhe sua evolução mês a mês.
              </p>
            </article>

            <article className="rounded-[32px] border border-[#f1e3b9] bg-white/88 p-5 shadow-[0_4px_16px_rgba(74,93,79,0.12)] backdrop-blur-md">
              <p className="irya-section-label">
                Transformação
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#4a5d4f] sm:text-base">
                Construa novos hábitos e veja sua saúde evoluir de forma consistente.
              </p>
            </article>
          </section>

          <section className="rounded-[32px] border border-[#f1e3b9] bg-white/88 p-5 shadow-[0_4px_16px_rgba(74,93,79,0.12)] backdrop-blur-md sm:p-6">
            <p className="irya-section-label">
              Como funciona
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] p-4">
                <p className="text-sm font-semibold text-[#4a5d4f]">1. Responda</p>
                <p className="mt-1 text-sm text-[#4a5d4f]">
                  Preencha sua primeira avaliação de estilo de vida em poucos minutos.
                </p>
              </div>
              <div className="rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] p-4">
                <p className="text-sm font-semibold text-[#4a5d4f]">2. Receba sua leitura</p>
                <p className="mt-1 text-sm text-[#4a5d4f]">
                  Entenda como estão os pilares da sua saúde e rotina.
                </p>
              </div>
              <div className="rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] p-4">
                <p className="text-sm font-semibold text-[#4a5d4f]">3. Evolua com constância</p>
                <p className="mt-1 text-sm text-[#4a5d4f]">
                  Acompanhe sua evolução e fortaleça novos hábitos mês a mês.
                </p>
              </div>
            </div>
          </section>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mx-auto w-full max-w-[980px] pb-4">
        {podeResponder && (
          <section className="mb-5 rounded-[32px] border border-[#f1e3b9] bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(244,238,216,0.74)_100%)] p-5 shadow-[0_8px_32px_rgba(74,93,79,0.16)] backdrop-blur-md sm:mb-6 sm:p-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px] lg:items-center">
              <header className="space-y-2">
                <p className="irya-section-label">
                  Check-in mensal liberado
                </p>
                <h2 className="irya-heading text-lg sm:text-xl">
                  Sua avaliação já pode ser respondida
                </h2>
                <p className="text-sm leading-relaxed text-[#4a5d4f] sm:text-base">
                  Leva menos de 5 minutos e ajuda a manter sua evolução alinhada
                  com o momento atual.
                </p>
              </header>
              <img
                src={iryaSaudando}
                alt="Irya saudando com o check-in mensal liberado"
                className="mx-auto h-[150px] w-[150px] rounded-[24px] border border-[#f1e3b9] object-cover object-top shadow-[0_8px_24px_rgba(74,93,79,0.16)]"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <Button
                onClick={() => navigate("/questionario")}
                variant="primary"
                label="Iniciar avaliação agora"
              />

              <div className="grid grid-cols-1 gap-3">
                {resultadoAnterior && (
                  <button
                    type="button"
                    className="h-11 rounded-xl border border-[#f1e3b9] bg-white/82 px-4 text-sm font-semibold text-[#4a5d4f] transition hover:bg-white"
                    onClick={() => navigate("/resultado")}
                  >
                    Ver meu último resultado
                  </button>
                )}

                {!isSubscriber && (
                  <button
                    type="button"
                    className="h-11 rounded-xl border border-[#f1e3b9] bg-white/82 px-4 text-sm font-semibold text-[#4a5d4f] transition hover:bg-white"
                    onClick={() => navigate("/assinatura")}
                  >
                    Assinar plano mensal
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {!isSubscriber && (
          <ChatOffer
            className="mb-5 sm:mb-6"
            avatarSrc={iryaGratidao}
            message="Sua avaliação de estilo de vida já abriu o caminho. No Premium, eu continuo com você no dia a dia com um plano exclusivo, metas claras e ajustes rápidos conforme sua evolução."
            priceLine="R$ 49,00/mês."
            policyLine="Cancele online a qualquer momento."
            ctaLabel="Liberar meu plano exclusivo"
            onClick={() => navigate("/assinatura")}
          />
        )}

          <section className="rounded-[32px] border border-[#f1e3b9] bg-white/86 p-5 shadow-[0_8px_32px_rgba(74,93,79,0.16)] backdrop-blur-md sm:p-7">
          <p className="irya-section-label">
            Minha Irya <span className="ml-0.5 text-xs">©</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="irya-heading text-2xl sm:text-3xl">
              {nome ? `Olá, ${nome}` : "Olá"}
            </h1>
            {isSubscriber && <PremiumBadge />}
          </div>
          <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-[#4a5d4f] sm:text-base">
            Aqui você acompanha sua evolução com clareza e em pequenos passos. O
            foco não é perfeição, é constância com leveza.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] p-4">
              <p className="irya-section-label text-[0.75rem]">
                Seu momento
              </p>
              <p className="mt-2 text-sm font-medium text-[#4a5d4f]">
                {resultadoAnterior?.classificacao || "Primeiro ciclo"}
              </p>
            </article>

            <article className="rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] p-4">
              <p className="irya-section-label text-[0.75rem]">
                Último ritual
              </p>
              <p className="mt-2 text-sm font-medium text-[#4a5d4f]">
                {resultadoAnterior?.dataConclusao
                  ? formatDate(resultadoAnterior.dataConclusao)
                  : "Ainda não respondido"}
              </p>
            </article>

            <article className="rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] p-4">
              <p className="irya-section-label text-[0.75rem]">
                Próximo check-in
              </p>
              <p className="mt-2 text-sm font-medium text-[#4a5d4f]">
                {podeResponder
                  ? "Disponível agora"
                  : `Disponível em ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""}`}
              </p>
            </article>
          </div>

          <div className="mt-4 rounded-2xl border border-[#f1e3b9] bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(244,238,216,0.7)_100%)] p-4">
            <p className="irya-section-label text-[0.75rem]">
              Peso Atual
            </p>
            <p className="mt-1 text-base font-semibold text-[#4a5d4f] sm:text-lg">
              {formatPeso(pesoAtualKg)}
            </p>
            <p className="mt-1 text-sm text-[#4a5d4f]">
              {pesoAtualKg === null
                ? "Seu primeiro registro será salvo ao concluir a próxima avaliação."
                : getVariacaoPesoTexto(variacaoPesoKg)}
            </p>

            <div className="mt-3 border-t border-[#f1e3b9] pt-3">
              <p className="irya-section-label text-[0.75rem]">
                Altura registrada
              </p>
              <p className="mt-1 text-sm font-medium text-[#4a5d4f]">{formatAltura(alturaM)}</p>

              <p className="mt-2 irya-section-label text-[0.75rem]">
                IMC atual
              </p>
              <p className="mt-1 text-sm font-medium text-[#4a5d4f]">
                {formatImc(imcAtual)}
                {imcAtual !== null && (
                  <span className="ml-1 text-[#7c9d72]">({getImcClassificacao(imcAtual)})</span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] p-4">
            <p className="irya-section-label text-[0.75rem]">
              Frequência do check-in
            </p>
            <p className="mt-2 text-sm font-medium text-[#4a5d4f] sm:text-base">
              A avaliação é mensal e deve ser respondida a cada 30 dias.
            </p>
          </div>
        </section>

        {!podeResponder && (
          <section className="mt-5 rounded-[32px] border border-[#f1e3b9] bg-white/86 p-5 shadow-[0_8px_32px_rgba(74,93,79,0.16)] backdrop-blur-md sm:mt-6 sm:p-7">
            <>
              <header className="space-y-2">
                <h2 className="irya-heading text-lg sm:text-xl">
                  Agora é fase de consolidação
                </h2>
                <p className="text-sm leading-relaxed text-[#4a5d4f] sm:text-base">
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
              </div>
            </>
          </section>
        )}
      </div>
    </Container>
  );
};

export default Home;
