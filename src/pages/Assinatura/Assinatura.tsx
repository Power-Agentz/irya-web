import { useCallback, useEffect, useState } from "react";
import { FiCheckCircle, FiShield } from "react-icons/fi";
import Button from "../../components/Button/Button";
import BackButton from "../../components/BackButton/BackButton";
import Container from "../../components/Container/Container";
import api from "../../api";
import { getPacientePrimeiroNome, setPaciente, getPaciente } from "../../utils/session";
import PremiumBadge from "../../components/PremiumBadge/PremiumBadge";

type SubscriptionStatusResponse = {
  telefone: string;
  isSubscriber: boolean;
  subscriptionStartedAt: string | null;
  subscriptionCanceledAt: string | null;
};

type CheckoutResponse = {
  message: string;
  checkoutUrl: string | null;
  subscription: {
    isSubscriber: boolean;
    subscriptionStartedAt: string | null;
    subscriptionCanceledAt: string | null;
  };
};

type CancelResponse = {
  message: string;
  subscription: {
    isSubscriber: boolean;
    subscriptionStartedAt: string | null;
    subscriptionCanceledAt: string | null;
  };
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const Assinatura = () => {
  const nome = getPacientePrimeiroNome();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const isSubscriber = status?.isSubscriber === true;

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<SubscriptionStatusResponse>("/subscription/status");
      setStatus(response.data);
    } catch {
      setError("Não foi possível carregar o status da assinatura.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleCheckout = useCallback(async () => {
    const digits = cpfCnpj.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      setError("Informe um CPF ou CNPJ válido para continuar.");
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await api.post<CheckoutResponse>("/subscription/checkout", {
        cpfCnpj: digits,
      });
      setStatus((current) =>
        current
          ? {
              ...current,
              isSubscriber: true,
              subscriptionStartedAt: response.data.subscription.subscriptionStartedAt,
              subscriptionCanceledAt: response.data.subscription.subscriptionCanceledAt,
            }
          : current,
      );

      const paciente = getPaciente();
      if (paciente) {
        setPaciente({
          ...paciente,
          isSubscriber: true,
          subscriptionStartedAt: response.data.subscription.subscriptionStartedAt,
          subscriptionCanceledAt: response.data.subscription.subscriptionCanceledAt,
        });
      }

      if (response.data.checkoutUrl) {
        window.location.assign(response.data.checkoutUrl);
      }
    } catch (requestError: unknown) {
      const maybeAxios = requestError as { response?: { data?: { error?: string } } };
      setError(maybeAxios.response?.data?.error ?? "Não foi possível iniciar o pagamento.");
    } finally {
      setCheckoutLoading(false);
    }
  }, [cpfCnpj]);

  const handleCancelSubscription = useCallback(async () => {
    setCancelLoading(true);
    setError(null);

    try {
      const response = await api.post<CancelResponse>("/subscription/cancel");

      setStatus((current) =>
        current
          ? {
              ...current,
              isSubscriber: response.data.subscription.isSubscriber,
              subscriptionStartedAt: response.data.subscription.subscriptionStartedAt,
              subscriptionCanceledAt: response.data.subscription.subscriptionCanceledAt,
            }
          : current,
      );

      const paciente = getPaciente();
      if (paciente) {
        setPaciente({
          ...paciente,
          isSubscriber: false,
          subscriptionCanceledAt: response.data.subscription.subscriptionCanceledAt,
        });
      }

      setCancelDialogOpen(false);
    } catch (requestError: unknown) {
      const maybeAxios = requestError as { response?: { data?: { error?: string } } };
      setError(maybeAxios.response?.data?.error ?? "Não foi possível cancelar a assinatura.");
    } finally {
      setCancelLoading(false);
    }
  }, []);

  return (
    <Container>
      <div className="mx-auto w-full max-w-[1040px] pb-4">
        <BackButton />
        <section className="rounded-[32px] border border-[#f1e3b9] bg-white/88 p-5 shadow-[0_8px_32px_rgba(74,93,79,0.16)] backdrop-blur-md sm:p-7">
          <p className="irya-section-label">
            Checkout protegido
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="irya-heading text-2xl sm:text-3xl">
              {isSubscriber
                ? nome
                  ? `${nome}, seu Premium está ativo`
                  : "Seu Premium está ativo"
                : nome
                  ? `${nome}, seu plano personalizado está pronto.`
                  : "Seu plano personalizado está pronto."}
            </h1>
            {isSubscriber && <PremiumBadge />}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#4a5d4f] sm:text-base">
            {isSubscriber
              ? "Sua assinatura está ativa. Aqui você gerencia o plano premium e o cancelamento quando quiser."
              : "Ative o Premium para liberar seu plano e começar hoje."}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] px-3 py-2 text-sm text-[#4a5d4f]">
            <FiShield className="h-4 w-4" />
            Pagamento seguro via Asaas
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[#7c9d72]">Carregando status da assinatura...</p>
          ) : isSubscriber ? (
            <article className="mt-6 rounded-[28px] border border-[#f1e3b9] bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(244,238,216,0.74)_100%)] p-5">
              <p className="irya-section-label">Premium ativo</p>
              <p className="mt-3 text-lg font-semibold text-[#4a5d4f]">
                Seu acesso premium está liberado.
              </p>
              <p className="mt-2 text-sm text-[#4a5d4f]">
                Início: {formatDate(status?.subscriptionStartedAt ?? null)}
              </p>
              <p className="mt-1 text-sm text-[#4a5d4f]">
                Cancelamento: {formatDate(status?.subscriptionCanceledAt ?? null)}
              </p>
              <div className="mt-4 rounded-2xl border border-[#f1e3b9] bg-white/82 p-4">
                <p className="text-sm text-[#4a5d4f]">
                  Seu plano personalizado está liberado e o acompanhamento premium segue ativo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancelDialogOpen(true)}
                className="mt-5 inline-flex h-10 items-center rounded-xl border border-[#efc0c0] bg-[#fff1f1] px-3 text-sm font-semibold text-[#9b3131] transition hover:bg-[#ffe4e4]"
              >
                Cancelar assinatura
              </button>
            </article>
          ) : (
            <article className="mt-6 rounded-[28px] border border-[#f1e3b9] bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(244,238,216,0.74)_100%)] p-4 sm:p-5">
              <p className="irya-section-label">
                Plano Premium
              </p>

              <div className="mt-3 space-y-2.5">
                <p className="inline-flex items-center gap-2 text-sm text-[#4a5d4f] sm:text-base">
                  <FiCheckCircle className="h-4 w-4 text-[#cea952]" />
                  Plano personalizado baseado no seu resultado
                </p>
                <p className="inline-flex items-center gap-2 text-sm text-[#4a5d4f] sm:text-base">
                  <FiCheckCircle className="h-4 w-4 text-[#cea952]" />
                  Acompanhamento diário da Irya
                </p>
                <p className="inline-flex items-center gap-2 text-sm text-[#4a5d4f] sm:text-base">
                  <FiCheckCircle className="h-4 w-4 text-[#cea952]" />
                  Ajustes práticos na sua rotina
                </p>
              </div>

              <div className="mt-4">
                <p className="text-2xl font-semibold text-[#4a5d4f]">R$49/mês</p>
                <p className="mt-1 text-sm text-[#4a5d4f]">Assinatura recorrente mensal</p>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#7c9d72]">
                  CPF ou CNPJ
                </label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="Digite seu CPF/CNPJ"
                  className="h-11 w-full rounded-[8px] border border-[#f1e3b9] bg-[#fefefe] px-3 text-sm text-[#4a5d4f] outline-none transition placeholder:text-[#8da399] focus:border-[#4a5d4f] focus:shadow-[0_0_0_3px_rgba(124,157,114,0.15)]"
                />
              </div>

              <div className="mt-4">
                <Button
                  variant="primary"
                  label="Ativar Premium agora"
                  onClick={() => void handleCheckout()}
                  loading={checkoutLoading}
                />
              </div>
            </article>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-3 text-sm font-medium text-[#c0392b]">
              {error}
            </p>
          )}
        </section>
      </div>

      {cancelDialogOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1f2a20]/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-[#e5cbc9] bg-white p-5 shadow-[0_20px_50px_rgba(35,39,32,0.28)]">
            <h3 className="text-lg font-semibold text-[#3c4a39]">Cancelar assinatura</h3>
            <p className="mt-2 text-sm text-[#5f6b5c]">
              Você pode cancelar agora em 1 clique. O acesso premium será encerrado e o cancelamento
              ficará registrado imediatamente.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelDialogOpen(false)}
                disabled={cancelLoading}
                className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[#d6decb] bg-[#f8fbf5] px-3 text-sm font-medium text-[#4f5e49] transition hover:bg-[#eef4e8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => void handleCancelSubscription()}
                disabled={cancelLoading}
                className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[#efc0c0] bg-[#fff1f1] px-3 text-sm font-semibold text-[#9b3131] transition hover:bg-[#ffe4e4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLoading ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Assinatura;
