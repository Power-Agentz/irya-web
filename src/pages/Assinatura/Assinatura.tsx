import { useCallback, useEffect, useState } from "react";
import { FiCheckCircle, FiCreditCard, FiExternalLink, FiLock, FiShield } from "react-icons/fi";
import Button from "../../components/Button/Button";
import BackButton from "../../components/BackButton/BackButton";
import Container from "../../components/Container/Container";
import api from "../../api";
import { getPacientePrimeiroNome, setPaciente, getPaciente } from "../../utils/session";

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
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

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
      setCheckoutUrl(response.data.checkoutUrl);
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
        <section className="rounded-3xl border border-[#dbe4cf] bg-white/85 p-5 shadow-[0_14px_34px_rgba(24,28,20,0.12)] backdrop-blur-md sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7a5d]">
            Checkout protegido
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#3c4934] sm:text-3xl">
            {nome ? `${nome}, ative seu plano mensal` : "Ative seu plano mensal"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#56614b] sm:text-base">
            Você será redirecionada para a plataforma Asaas para concluir o pagamento em ambiente seguro.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#d7e2cb] bg-[#f7fbf2] px-3 py-2 text-sm text-[#516148]">
              <FiShield className="h-4 w-4" />
              Plataforma de pagamento verificada
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#d7e2cb] bg-[#f7fbf2] px-3 py-2 text-sm text-[#516148]">
              <FiLock className="h-4 w-4" />
              Processo criptografado e protegido
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[#5c6951]">Carregando status da assinatura...</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-[#e1e8d7] bg-[#f8fbf3] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a60]">
                  Status atual
                </p>
                <p className="mt-2 text-sm font-semibold text-[#41503a]">
                  {status?.isSubscriber ? "Assinante ativa" : "Plano gratuito"}
                </p>
                <p className="mt-1 text-sm text-[#55634a]">
                  Início: {formatDate(status?.subscriptionStartedAt ?? null)}
                </p>
                <p className="mt-1 text-sm text-[#55634a]">
                  Cancelamento: {formatDate(status?.subscriptionCanceledAt ?? null)}
                </p>
                {status?.isSubscriber && (
                  <button
                    type="button"
                    onClick={() => setCancelDialogOpen(true)}
                    className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-lg border border-[#efc0c0] bg-[#fff1f1] px-3 text-sm font-semibold text-[#9b3131] transition hover:bg-[#ffe4e4]"
                  >
                    Cancelar assinatura
                  </button>
                )}
              </article>

              <article className="rounded-2xl border border-[#d4dfc6] bg-gradient-to-br from-[#f8fcee] via-[#f2f8e7] to-[#ebf3de] p-4">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f7252]">
                  <FiCreditCard className="h-4 w-4" />
                  Plano mensal
                </p>
                <p className="mt-2 text-xl font-semibold text-[#384835]">R$ 49,00 / mês</p>
                <p className="mt-1 text-sm text-[#55634a]">
                  Assinatura mensal recorrente exclusiva no cartão de crédito via Asaas.
                </p>

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#647558]">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    placeholder="Digite seu CPF/CNPJ"
                    className="h-11 w-full rounded-xl border border-[#d5decb] bg-white/90 px-3 text-sm text-[#334234] outline-none transition focus:border-[#96a88b] focus:ring-2 focus:ring-[#a5b798]/30"
                  />
                </div>

                <div className="mt-4">
                  <Button
                    variant="primary"
                    label={status?.isSubscriber ? "Assinatura ativa" : "Continuar"}
                    onClick={() => void handleCheckout()}
                    disabled={status?.isSubscriber}
                    loading={checkoutLoading}
                  />
                </div>
                <p className="mt-3 text-xs text-[#65735c]">
                  Ao continuar, você será redirecionada para o checkout seguro do Asaas.
                </p>
                <p className="mt-2 text-xs text-[#65735c]">
                  Cancelamento simples, online e em poucos cliques, sem burocracia.
                </p>
              </article>
            </div>
          )}

          {checkoutUrl && (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#5d7250] underline underline-offset-2"
            >
              Abrir pagamento em nova aba
              <FiExternalLink className="h-4 w-4" />
            </a>
          )}

          {status?.isSubscriber && (
            <div className="mt-4 rounded-xl border border-[#cfe1bc] bg-[#f1f8e6] p-3 text-sm font-medium text-[#46603a]">
              <span className="inline-flex items-center gap-2">
                <FiCheckCircle className="h-4 w-4" />
                Sua conta já está marcada como assinante.
              </span>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-3 text-sm font-medium text-[#b91c1c]">
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
