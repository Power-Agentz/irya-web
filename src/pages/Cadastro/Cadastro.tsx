import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { useNavigate, Link } from "react-router-dom";
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

const PHONE_STEP_INDEX = steps.indexOf("phone");

export default function Cadastro() {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showPhoneConfirm, setShowPhoneConfirm] = useState<boolean>(false);
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>("idle");
  const [lastCheckedPhone, setLastCheckedPhone] = useState<string>("");

  const navigate = useNavigate();
  const { registerAndLogin, checkTelefoneDisponivel } = useAuth();

  const progress = ((stepIndex + 1) / steps.length) * 100;
  const currentStep: Step = steps[stepIndex];

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const update = (field: keyof typeof formData, value: string) => {
    setStepError(null);
    setError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const next = () => {
    setStepError(null);
    setStepIndex((s) => Math.min(s + 1, steps.length - 1));
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
        const result: PhoneAvailabilityResult = disponivel ? "available" : "taken";
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

      const availabilityResult: PhoneAvailabilityResult = isCurrentPhoneAlreadyChecked
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
      await registerAndLogin({
        nomeCompleto: formData.fullName,
        telefone: normalizedPhone,
        senha: formData.password,
      });

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

      if (isTelefoneConflito) {
        setStepIndex(PHONE_STEP_INDEX);
        setStepError(
          "Este telefone já está cadastrado. Faça login ou use outro número.",
        );
        setPhoneStatus("taken");
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
        return <p className="text-sm text-[#4f7b4f]">Telefone disponível.</p>;
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
          <p className="text-sm text-[#4f7b4f]">
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
              <h1 className="text-xl font-medium text-[#3f4c36] sm:text-3xl flex items-center gap-0.5">
                Bem-vindo ao Portal Irya <span className="text-xs">©</span>
              </h1>
              <p>
                Esse é o seu hub de experiências conectadas da{" "}
                <b className="font-bold">Irya</b>.
                <br />
                Antes de começarmos, vou precisar de algumas informações
                básicas.
              </p>
              <p>
                Já possui conta?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#87967a] hover:underline"
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
              <p>
                Se você busca clareza, constância e apoio, você está no lugar
                certo.
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
            <h3 className="text-xl font-semibold text-[#3f4c36]">Prontinho!</h3>
            <p className="text-[15px] font-light sm:text-base">
              Agora você terá acesso ao Portal Irya, aqui você vai acompanhar o
              seu progresso e entender como estamos juntas atingindo os seus
              objetivos.
            </p>
            <p className="text-[15px] font-light sm:text-base">
              Ao clicar em <b>Criar conta</b>, seguimos juntas com mais leveza.
            </p>
          </div>
        );
    }
  };

  return (
    <Container hasHeader={false}>
      <div className="mx-auto flex w-full max-w-[620px] flex-1 flex-col justify-center py-2 sm:py-4">
        <BrandLogo className="mb-4 sm:mb-6" />

        <div className="rounded-xl bg-white/72 p-4 border border-white/70 shadow-[0_14px_34px_rgba(24,28,20,0.12)] backdrop-blur-md sm:p-6">
          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-[#d7dccf]">
            <div
              className="h-full rounded-full bg-[#87967a] transition-[width] duration-300"
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
              className="min-h-[200px]"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <div className="mt-3 min-h-5">{renderStepFeedback()}</div>

          {stepError && (
            <p className="mt-3 rounded-lg border border-[#f5c2c2] bg-[#ffebee] p-3 text-sm text-[#b00020]">
              {stepError}
            </p>
          )}

          {error && (
            <p className="mt-3 rounded-lg border border-[#f5c2c2] bg-[#ffebee] p-3 text-sm text-[#b00020]">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {stepIndex > 0 && (
              <Button
                onClick={back}
                label="Voltar"
                variant="secondary"
                fullWidth={false}
                className="sm:min-w-[120px]"
              />
            )}

            {stepIndex < steps.length - 1 && (
              <Button
                onClick={() => void handleNext()}
                disabled={!canProceed()}
                variant="primary"
                label={
                  currentStep === "welcome"
                    ? "Iniciar"
                    : currentStep === "manifesto"
                      ? "Quero continuar"
                      : "Próximo"
                }
                fullWidth={false}
                className="sm:min-w-[180px]"
              />
            )}

            {stepIndex === steps.length - 1 && (
              <Button
                onClick={handleRegister}
                label={loading ? "Criando..." : "Criar conta"}
                variant="primary"
                loading={loading}
                fullWidth={false}
                className="sm:min-w-[180px]"
              />
            )}
          </div>
        </div>
      </div>

      {showPhoneConfirm && (
        <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6">
          <div className="w-full max-w-[360px] rounded-2xl bg-white p-5 text-center shadow-xl sm:p-6">
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
    </Container>
  );
}
