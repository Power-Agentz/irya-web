import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Button from "../../components/Button/Button";
import AuthLayout from "../../components/AuthLayout/AuthLayout";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { formatPhone, normalizePhone } from "../../utils/phone";
import { useAuth } from "../../hooks/useAuth";
import TextField from "../../components/TextField/TextField";
import { getApiErrorMessage } from "../../utils/errors";
import LoadingIcon from "../../components/LoadingIcon/LoadingIcon";

const steps = [
  "welcome",
  "manifesto",
  "fullName",
  "phone",
  "password",
  "confirm",
] as const;

type Step = (typeof steps)[number];
type PhoneStatus = "idle" | "checking" | "available" | "taken" | "error";
type PhoneAvailabilityResult = "available" | "taken" | "error";

type InviteContext = {
  id: string;
  nomeCompleto: string | null;
  telefone: string | null;
  senhaJaCriada: boolean;
};

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showPhoneConfirm, setShowPhoneConfirm] = useState<boolean>(false);
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>("idle");
  const [lastCheckedPhone, setLastCheckedPhone] = useState<string>("");
  const [inviteContext, setInviteContext] = useState<InviteContext | null>(null);

  const navigate = useNavigate();
  const {
    registerAndLogin,
    checkTelefoneDisponivel,
    getPreCadastroById,
    activatePreCadastroAndLogin,
  } = useAuth();

  const inviteId = useMemo(
    () => searchParams.get("id")?.trim().replace(/^"+|"+$/g, "") ?? "",
    [searchParams],
  );
  const activeSteps = useMemo(
    () => (inviteContext ? (["password", "confirm"] as const) : steps),
    [inviteContext],
  );
  const PHONE_STEP_INDEX = inviteContext ? -1 : steps.indexOf("phone");

  const progress = ((stepIndex + 1) / activeSteps.length) * 100;
  const currentStep: Step = activeSteps[stepIndex] as Step;

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!inviteId) return;

    let isMounted = true;

    const bootstrapInvite = async () => {
      setInviteLoading(true);
      setError(null);
      setStepError(null);

      try {
        const data = await getPreCadastroById(inviteId);
        if (!isMounted) return;

        if (data.senhaJaCriada) {
          setError(
            "Esse acesso já foi ativado. Entre com seu telefone e senha para continuar.",
          );
          setInviteContext(null);
          setStepIndex(0);
          return;
        }

        setInviteContext(data);
        setFormData((prev) => ({
          ...prev,
          fullName: data.nomeCompleto ?? "",
          phone: data.telefone ? formatPhone(data.telefone) : "",
        }));
        setPhoneStatus("available");
        setLastCheckedPhone(data.telefone ?? "");
        setStepIndex(0);
      } catch (err: unknown) {
        if (!isMounted) return;
        setInviteContext(null);
        setError(
          getApiErrorMessage(
            err,
            "Não foi possível validar o link enviado. Você pode seguir com o cadastro manual.",
          ),
        );
      } finally {
        if (isMounted) {
          setInviteLoading(false);
        }
      }
    };

    void bootstrapInvite();

    return () => {
      isMounted = false;
    };
  }, [getPreCadastroById, inviteId]);

  const update = (field: keyof typeof formData, value: string) => {
    setStepError(null);
    setError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const next = () => {
    setStepError(null);
    setStepIndex((s) => Math.min(s + 1, activeSteps.length - 1));
  };

  const back = () => {
    setStepError(null);
    setStepIndex((s) => Math.max(s - 1, 0));
  };

  const isValidName = (name: string) =>
    /^[A-Za-z\u00C0-\u00FF\s]+$/.test(name.trim()) && name.trim().length >= 2;

  const isValidPhone = (phone: string) => /^\(\d{2}\) \d{5}-\d{4}$/.test(phone);

  const isValidPasswordLength = (password: string) => password.length >= 6;

  const isPasswordMatch = (password: string, confirm: string) =>
    password === confirm;

  const normalizedPhone = useMemo(
    () => normalizePhone(formData.phone),
    [formData.phone],
  );

  const validatePhoneAvailability = useCallback(
    async (phoneDigits: string): Promise<PhoneAvailabilityResult> => {
      try {
        setPhoneStatus("checking");
        const disponivel = await checkTelefoneDisponivel(phoneDigits);
        setLastCheckedPhone(phoneDigits);
        const result: PhoneAvailabilityResult = disponivel
          ? "available"
          : "taken";
        setPhoneStatus(result);
        return result;
      } catch {
        setLastCheckedPhone(phoneDigits);
        setPhoneStatus("error");
        return "error";
      }
    },
    [checkTelefoneDisponivel],
  );

  useEffect(() => {
    if (currentStep !== "phone") return;

    if (!isValidPhone(formData.phone)) {
      setPhoneStatus("idle");
      setLastCheckedPhone("");
      return;
    }

    if (normalizedPhone === lastCheckedPhone && phoneStatus !== "checking") {
      return;
    }

    const timer = setTimeout(() => {
      void validatePhoneAvailability(normalizedPhone);
    }, 350);

    return () => clearTimeout(timer);
  }, [
    currentStep,
    formData.phone,
    lastCheckedPhone,
    normalizedPhone,
    phoneStatus,
    validatePhoneAvailability,
  ]);

  const canProceed = () => {
    switch (currentStep) {
      case "fullName":
        return isValidName(formData.fullName);
      case "phone":
        return (
          isValidPhone(formData.phone) &&
          phoneStatus !== "checking" &&
          phoneStatus !== "error" &&
          phoneStatus !== "taken"
        );
      case "password":
        return (
          isValidPasswordLength(formData.password) &&
          isPasswordMatch(formData.password, formData.confirmPassword)
        );
      default:
        return true;
    }
  };

  const handleNext = async () => {
    setStepError(null);

    if (currentStep === "fullName" && !isValidName(formData.fullName)) {
      setStepError("Digite seu nome completo com pelo menos 2 caracteres.");
      return;
    }

    if (currentStep === "phone") {
      if (!isValidPhone(formData.phone)) {
        setStepError("Digite um telefone válido no formato (XX) XXXXX-XXXX.");
        return;
      }

      const isCurrentPhoneAlreadyChecked =
        normalizedPhone === lastCheckedPhone && phoneStatus !== "checking";

      const availabilityResult: PhoneAvailabilityResult =
        isCurrentPhoneAlreadyChecked
          ? phoneStatus === "available"
            ? "available"
            : phoneStatus === "taken"
              ? "taken"
              : "error"
          : await validatePhoneAvailability(normalizedPhone);

      if (availabilityResult !== "available") {
        setStepError(
          availabilityResult === "taken"
            ? "Este telefone já está cadastrado. Faça login ou use outro número."
            : "Não foi possível validar o telefone agora. Tente novamente.",
        );
        return;
      }

      setShowPhoneConfirm(true);
      return;
    }

    if (currentStep === "password") {
      if (!isValidPasswordLength(formData.password)) {
        setStepError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }

      if (!isPasswordMatch(formData.password, formData.confirmPassword)) {
        setStepError("As senhas não conferem. Revise e tente novamente.");
        return;
      }
    }

    next();
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      if (inviteContext) {
        await activatePreCadastroAndLogin({
          id: inviteContext.id,
          senha: formData.password,
        });
      } else {
        await registerAndLogin({
          nomeCompleto: formData.fullName,
          telefone: normalizedPhone,
          senha: formData.password,
        });
      }

      navigate("/inicio");
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        "Erro inesperado ao criar conta.",
      );
      setError(message);

      const isTelefoneConflito =
        axios.isAxiosError(err) &&
        err.response?.status === 409 &&
        message.toLowerCase().includes("telefone");

      const isInviteAlreadyActivated =
        inviteContext &&
        axios.isAxiosError(err) &&
        err.response?.status === 409;

      if (isTelefoneConflito) {
        setStepIndex(PHONE_STEP_INDEX);
        setStepError(
          "Este telefone já está cadastrado. Faça login ou use outro número.",
        );
        setPhoneStatus("taken");
      } else if (isInviteAlreadyActivated) {
        setStepError(
          "Esse acesso já foi ativado. Faça login com seu telefone e senha.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepFeedback = () => {
    if (currentStep === "phone") {
      if (phoneStatus === "checking") {
        return (
          <p className="inline-flex items-center gap-2 text-sm text-[#6d7565]">
            <LoadingIcon size="sm" className="text-[#6d7565]" />
            <span>Validando telefone...</span>
          </p>
        );
      }

      if (phoneStatus === "available" && isValidPhone(formData.phone)) {
        return <p className="text-sm text-[#4a5d4f]">Telefone disponível.</p>;
      }

      if (phoneStatus === "taken") {
        return (
          <p className="text-sm text-[#b00020]">
            Este telefone já está cadastrado. Faça login ou use outro número.
          </p>
        );
      }

      if (phoneStatus === "error") {
        return (
          <p className="text-sm text-[#b00020]">
            Não foi possível validar o telefone agora. Tente novamente.
          </p>
        );
      }
    }

    if (currentStep === "password") {
      if (
        formData.password.length > 0 &&
        !isValidPasswordLength(formData.password)
      ) {
        return (
          <p className="text-sm text-[#b00020]">
            A senha deve ter pelo menos 6 caracteres.
          </p>
        );
      }

      if (
        formData.confirmPassword.length > 0 &&
        !isPasswordMatch(formData.password, formData.confirmPassword)
      ) {
        return (
          <p className="text-sm text-[#b00020]">As senhas não conferem.</p>
        );
      }

      if (
        isValidPasswordLength(formData.password) &&
        isPasswordMatch(formData.password, formData.confirmPassword) &&
        formData.confirmPassword.length > 0
      ) {
        return (
          <p className="text-sm text-[#4a5d4f]">
            Senha confirmada com sucesso.
          </p>
        );
      }
    }

    return null;
  };

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="flex min-h-[180px] flex-col justify-center">
            <div className="space-y-3 text-[15px] font-light sm:text-base">
              <h1 className="flex items-center gap-0.5 font-['Libre_Baskerville',serif] text-[1.5rem] font-normal tracking-tight text-[#4a5d4f] sm:text-[2rem]">
                Bem-vinda à Minha Irya <span className="ml-0.5 text-xs">©</span>
              </h1>
              <p>
                Antes de começarmos, vou precisar de algumas informações
                básicas.
              </p>
              <p>
                Já possui conta?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#4a5d4f] hover:text-[#3a4d3f] hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        );

      case "manifesto":
        return (
          <div className="flex min-h-[180px] flex-col justify-center">
            <div className="space-y-3 text-[15px] font-light sm:text-base">
              <p>
                Eu fui criada por médicos especialistas no cuidado da mulher
                40+, com base na medicina do estilo de vida.
              </p>
              <p>
                Nasci para acompanhar mulheres em uma fase de mudanças, no
                corpo, na mente e na rotina.
              </p>
            </div>
          </div>
        );

      case "fullName":
        return (
          <TextField
            label="Nome completo"
            value={formData.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className="mt-1"
          />
        );

      case "phone":
        return (
          <div className="space-y-4">
            <p className="text-[15px] font-light sm:text-base">
              Uso o WhatsApp para estar presente no seu dia a dia, com
              proximidade e cuidado.
            </p>
            <TextField
              label="Seu número de WhatsApp"
              className="mt-1"
              placeholder="(XX) XXXXX-XXXX"
              inputMode="numeric"
              value={formData.phone}
              onChange={(e) => {
                const value = formatPhone(e.target.value);
                if (value !== formData.phone) {
                  setPhoneStatus("idle");
                  setLastCheckedPhone("");
                }
                update("phone", value);
              }}
            />
          </div>
        );

      case "password":
        return (
          <div className="space-y-4">
            {inviteContext && (
              <div className="rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] p-4 text-sm text-[#4a5d4f]">
                <p className="irya-section-label">Acesso preparado para você</p>
                <p className="mt-2">
                  {inviteContext.nomeCompleto || "Seu cadastro"} já foi iniciado.
                </p>
                {inviteContext.telefone && (
                  <p className="mt-1 text-[#7c9d72]">
                    WhatsApp: {formatPhone(inviteContext.telefone)}
                  </p>
                )}
                <p className="mt-2">
                  Agora falta apenas criar sua senha para liberar sua entrada.
                </p>
              </div>
            )}
            <TextField
              type="password"
              label="Crie uma senha"
              className="mt-1"
              value={formData.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <TextField
              type="password"
              label="Confirme sua senha"
              className="mt-1"
              value={formData.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
            />
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-3">
            <h3 className="font-['Libre_Baskerville',serif] text-xl font-normal text-[#4a5d4f]">Prontinho!</h3>
            <p className="text-[15px] font-light sm:text-base">
              {inviteContext
                ? <>Sua senha será vinculada ao seu cadastro existente e sua entrada na Minha Irya<span className="ml-0.5 text-xs">©</span> será liberada.</>
                : <>Agora você terá acesso à Minha Irya<span className="ml-0.5 text-xs">©</span>, aqui você vai acompanhar o seu progresso e entender como estamos juntas atingindo os seus objetivos.</>}
            </p>
            <p className="text-[15px] font-light sm:text-base">
              Ao clicar em <b>{inviteContext ? "Ativar acesso" : "Criar conta"}</b>, seguimos juntas com mais leveza.
            </p>
          </div>
        );
    }
  };

  if (inviteLoading) {
    return (
      <AuthLayout>
        <div className="mt-8 flex min-h-[220px] items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-[#f1e3b9] bg-[#fffaf1] px-5 py-4 text-sm text-[#4a5d4f]">
            <LoadingIcon size="sm" className="text-[#4a5d4f]" />
            <span>Validando seu acesso...</span>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mt-2 sm:mt-4"
      >
        <div className="mb-7 h-1.5 w-full overflow-hidden rounded-full bg-[#f1e3b9]/70">
          <div
            className="h-full rounded-full bg-[#4a5d4f] shadow-[0_0_14px_rgba(74,93,79,0.28)] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="min-h-[100px]"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 min-h-5">{renderStepFeedback()}</div>

        {stepError && (
          <p className="mt-4 rounded-2xl border border-[#f2c7c7] bg-[#fff1f1]/90 p-3 text-sm text-[#c0392b] backdrop-blur-sm">
            {stepError}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border border-[#f2c7c7] bg-[#fff1f1]/90 p-3 text-sm text-[#c0392b] backdrop-blur-sm">
            {error}
          </p>
        )}

        <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {stepIndex > 0 && (
            <Button
              onClick={back}
              label="Voltar"
              variant="secondary"
              fullWidth={false}
              className="sm:min-w-[120px]"
            />
          )}

          {stepIndex < activeSteps.length - 1 && (
            <Button
              onClick={() => void handleNext()}
              disabled={!canProceed()}
              variant="primary"
              label={
                currentStep === "welcome"
                  ? "Iniciar"
                  : currentStep === "manifesto"
                    ? "Quero continuar"
                    : inviteContext && currentStep === "password"
                      ? "Continuar"
                      : "Próximo"
              }
              fullWidth={false}
              className="sm:min-w-[180px]"
            />
          )}

          {stepIndex === activeSteps.length - 1 && (
            <Button
              onClick={handleRegister}
              label={loading ? (inviteContext ? "Ativando..." : "Criando...") : inviteContext ? "Ativar acesso" : "Criar conta"}
              variant="primary"
              loading={loading}
              fullWidth={false}
              className="sm:min-w-[180px]"
            />
          )}
        </div>
      </motion.div>
      {showPhoneConfirm && (
        <div className="fixed inset-0 z-[999] flex items-end justify-center bg-[#1d2119]/35 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="w-full max-w-[380px] rounded-[26px] border border-[#f1e3b9] bg-[#fffefb]/95 p-5 text-center shadow-[0_20px_40px_rgba(74,93,79,0.16)] sm:p-6">
            <p className="text-sm sm:text-base">
              Você digitou o número: <b>{formData.phone}</b>.
              <br />
              Está correto?
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button
                label="Corrigir"
                variant="secondary"
                onClick={() => setShowPhoneConfirm(false)}
                className="sm:min-w-[120px]"
              />
              <Button
                label="Sim"
                variant="primary"
                onClick={() => {
                  setShowPhoneConfirm(false);
                  next();
                }}
                className="sm:min-w-[150px]"
              />
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
