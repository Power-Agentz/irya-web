import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useQuestionarioStatus } from "../../hooks/useQuestionarioStatus";
import Loading from "../../components/Loading/Loading";
import { getPacientePrimeiroNome, isPacienteSubscriber } from "../../utils/session";

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
  const diasRestantes = getDiasRestantes(resultadoAnterior?.dataLimite);

  if (!resultadoAnterior) {
    return (
      <Container>
        <div className="mx-auto w-full max-w-[900px] space-y-5 pb-4 sm:space-y-6">
          <section className="relative overflow-hidden rounded-[28px] border border-[#d6e0c7] bg-gradient-to-br from-[#f8fced] via-[#f2f8e7] to-[#edf4e0] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
            <div className="pointer-events-none absolute -top-10 right-0 h-40 w-40 rounded-full bg-[#d9c69f]/28 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#98ab8a]/24 blur-3xl" />

            <header className="relative z-10 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7a5d]">
                Portal Irya
              </p>
              <h1 className="max-w-[20ch] font-['Iowan_Old_Style','Georgia',serif] text-2xl font-medium tracking-tight text-[#34412d] sm:text-4xl">
                {nome ? `Olá, ${nome}` : "Olá"}, vamos começar seu primeiro ritual?
              </h1>
              <p className="max-w-[56ch] text-sm leading-relaxed text-[#4f5a45] sm:text-base">
                Seu primeiro check-in leva poucos minutos e inaugura o acompanhamento da sua evolução.
              </p>
            </header>

            <div className="relative z-10 mt-7 grid grid-cols-1 gap-3 sm:max-w-[430px]">
              <Button
                onClick={() => navigate("/questionario")}
                variant="primary"
                label="Iniciar questionário MEV"
              />
              {!isSubscriber && (
                <Button
                  onClick={() => navigate("/assinatura")}
                  variant="secondary"
                  label="Conhecer assinatura mensal"
                />
              )}
              <p className="text-center text-xs font-medium text-[#6d7762] sm:text-sm">
                Leva menos de 5 minutos para concluir.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#e3e7db] bg-[#fffdfa]/90 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7d63]">
                Clareza
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#53604a] sm:text-base">
                Entenda seu momento atual com uma leitura estruturada.
              </p>
            </article>

            <article className="rounded-2xl border border-[#e3e7db] bg-[#fffdfa]/90 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7d63]">
                Direção
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#53604a] sm:text-base">
                Receba orientações práticas alinhadas com sua rotina.
              </p>
            </article>

            <article className="rounded-2xl border border-[#e3e7db] bg-[#fffdfa]/90 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7d63]">
                Acompanhamento
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#53604a] sm:text-base">
                Compare sua evolução a cada novo check-in mensal.
              </p>
            </article>
          </section>

          <section className="rounded-2xl border border-[#e2e7d7] bg-[#fffdfa]/90 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6f7d63]">
              Como funciona
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#e7ebde] bg-[#f7f9f2] p-4">
                <p className="text-sm font-semibold text-[#3f4c36]">1. Responda</p>
                <p className="mt-1 text-sm text-[#59664f]">Preencha seu primeiro MEV.</p>
              </div>
              <div className="rounded-xl border border-[#e7ebde] bg-[#f7f9f2] p-4">
                <p className="text-sm font-semibold text-[#3f4c36]">2. Receba leitura</p>
                <p className="mt-1 text-sm text-[#59664f]">Veja seu resultado por pilares.</p>
              </div>
              <div className="rounded-xl border border-[#e7ebde] bg-[#f7f9f2] p-4">
                <p className="text-sm font-semibold text-[#3f4c36]">3. Evolua</p>
                <p className="mt-1 text-sm text-[#59664f]">Acompanhe sua consistência mês a mês.</p>
              </div>
            </div>
          </section>
        </div>
      </Container>
    );
  }

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
                Leva menos de 5 minutos e ajuda a manter sua evolução alinhada
                com o momento atual.
              </p>
            </header>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <Button
                onClick={() => navigate("/questionario")}
                variant="primary"
                label="Iniciar questionário agora"
              />

              <div className="grid grid-cols-1 gap-3">
                {resultadoAnterior && (
                  <button
                    type="button"
                    className="h-11 cursor-pointer rounded-lg border border-[#87967a]/40 bg-white/50 px-4 text-sm font-semibold text-[#6b7c5d] transition hover:bg-white/80"
                    onClick={() => navigate("/resultado")}
                  >
                    Ver meu último resultado
                  </button>
                )}

                {!isSubscriber && (
                  <button
                    type="button"
                    className="h-11 cursor-pointer rounded-lg border border-[#87967a]/40 bg-white/50 px-4 text-sm font-semibold text-[#6b7c5d] transition hover:bg-white/80"
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
          <section className="mb-5 rounded-2xl border border-[#d6e0c7] bg-gradient-to-br from-[#f8fced] via-[#f2f8e7] to-[#edf4e0] p-5 shadow-[0_14px_34px_rgba(24,28,20,0.12)] sm:mb-6 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6d7a5d]">
              Assinatura mensal
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#34412d] sm:text-xl">
              Ative seu plano para acompanhamento contínuo
            </h2>
            <p className="mt-2 text-sm text-[#4f5548] sm:text-base">
              Cobrança mensal via Asaas. Seu acesso fica marcado como assinante após a ativação.
            </p>
            <div className="mt-4 sm:max-w-[260px]">
              <Button
                onClick={() => navigate("/assinatura")}
                variant="primary"
                label="Ir para pagamento"
              />
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
            Aqui você acompanha sua evolução com clareza e em pequenos passos. O
            foco não é perfeição, é constância com leveza.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-[#e2e7d7] bg-[#f7f9f2] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">
                Seu momento
              </p>
              <p className="mt-2 text-sm font-medium text-[#46533e]">
                {resultadoAnterior?.classificacao || "Primeiro ciclo"}
              </p>
            </article>

            <article className="rounded-xl border border-[#e2e7d7] bg-[#f7f9f2] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">
                Último ritual
              </p>
              <p className="mt-2 text-sm font-medium text-[#46533e]">
                {resultadoAnterior?.dataConclusao
                  ? formatDate(resultadoAnterior.dataConclusao)
                  : "Ainda não respondido"}
              </p>
            </article>

            <article className="rounded-xl border border-[#e2e7d7] bg-[#f7f9f2] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">
                Próximo check-in
              </p>
              <p className="mt-2 text-sm font-medium text-[#46533e]">
                {podeResponder
                  ? "Disponível agora"
                  : `Disponível em ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""}`}
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
              </div>
            </>
          </section>
        )}
      </div>
    </Container>
  );
};

export default Home;
