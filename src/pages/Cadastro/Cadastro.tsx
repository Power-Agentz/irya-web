import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../components/Container/Container.css";
import "./Cadastro.css";
import api from "../../api";
import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import logo from "../../../assets/logo-irya.png";
import { useNavigate } from "react-router-dom";

const steps = [
  "welcome",
  "manifesto",
  "preferredName",
  "phone",
  "gender",
  "password",
  "confirm",
] as const;

export default function Cadastro() {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const currentStep = steps[stepIndex];

  const [formData, setFormData] = useState({
    preferredName: "",
    phone: "",
    gender: "Feminino",
    password: "",
    confirmPassword: "",
  });

  const update = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const next = () => setStepIndex((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStepIndex((s) => Math.max(s - 1, 0));

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post("/auth/register", {
        nomeSocialApelido: formData.preferredName,
        telefone: formData.phone,
        sexo: formData.gender,
        senha: formData.password,
      });

      const loginResponse = await api.post("/auth/login", {
        telefone: formData.phone,
        senha: formData.password,
      });

      const { token, paciente } = loginResponse.data;

      localStorage.setItem("token", token);
      localStorage.setItem("pacienteData", JSON.stringify(paciente));

      navigate("/inicio");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const isValidName = (name: string) => /^[A-Za-zÀ-ÿ\s]+$/.test(name.trim());
  const isValidPhone = (phone: string) => /^\(\d{2}\) \d{5}-\d{4}$/.test(phone);
  const isValidPassword = (password: string, confirm: string) =>
    password.length >= 6 && password === confirm;

  const canProceed = () => {
    switch (currentStep) {
      case "preferredName":
        return isValidName(formData.preferredName);

      case "phone":
        return isValidPhone(formData.phone);

      case "gender":
        return Boolean(formData.gender);

      case "password":
        return isValidPassword(formData.password, formData.confirmPassword);

      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="register-info-box">
            <div className="register-info-text">
              <h1>Olá, eu sou a Irya</h1>
              <p>
                Estarei ao seu lado nessa jornada.
                <br />
                Antes de começarmos, quero te conhecer um pouquinho melhor.
                <br />É bem rapidinho.
                <p>
                  {" "}
                  Já nos conhecemos? <a href="/login">Entrar</a>.
                </p>
              </p>
            </div>
          </div>
        );

      case "manifesto":
        return (
          <div className="register-info-box">
            <div className="register-info-text">
              {" "}
              <p>
                Eu fui criada por médicos especialistas no cuidado da mulher
                40+,
                <br />
                com base na medicina do estilo de vida.
              </p>
              <p>
                Nasci para acompanhar mulheres que estão vivendo uma fase de
                mudanças — no corpo, na mente e na rotina.
              </p>
              <p>
                Se você sente que precisa de mais clareza, constância e apoio no
                dia a dia, você está no lugar certo.
              </p>
            </div>
          </div>
        );

      case "preferredName":
        return (
          <div className="slide-input-group">
            <label>Como posso te chamar?</label>
            <input
              className="slide-input"
              value={formData.preferredName}
              onChange={(e) => update("preferredName", e.target.value)}
            />
          </div>
        );

      case "phone":
        return (
          <div>
            <div className="register-info-box">
              <div className="register-info-text">
                <p>Eu não funciono como um aplicativo comum.</p>
                <p>
                  {" "}
                  Gosto de estar <b>presente</b> no dia a dia, com{" "}
                  <b>proximidade e cuidado</b>. Por isso, uso o WhatsApp para
                  conversar com você.
                </p>
              </div>
            </div>
            <div className="slide-input-group">
              <label>Seu número de WhatsApp</label>
              <input
                className="slide-input"
                value={formData.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
          </div>
        );

      case "gender":
        return (
          <div className="slide-input-group">
            <label>Qual gênero você se identifica?</label>
            <select
              className="slide-input"
              value={formData.gender}
              onChange={(e) => update("gender", e.target.value)}
            >
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        );

      case "password":
        return (
          <div>
            <div className="slide-input-group">
              <label>Crie uma senha</label>
              <input
                type="password"
                className="slide-input"
                value={formData.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
            <div className="slide-input-group">
              <label>Confirme sua senha</label>

              <input
                type="password"
                className="slide-input"
                value={formData.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="confirm-box">
            <h3>Prontinho</h3>
            <p>
              Daqui a pouco, eu vou te chamar no WhatsApp. Quero te ouvir com
              presença, cuidado e sem pressa.
            </p>
            <p>
              Quando você clicar em <b>Criar conta</b>, seguimos juntas com mais
              consciência e leveza.
            </p>
          </div>
        );
    }
  };

  return (
    <Container hasHeader={false}>
      <div className="register-image-container">
        <img src={logo} alt="Irya Logo" className="register-image" />
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="slide-wrapper"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {error && <p className="error-msg">{error}</p>}

      <div className="wizard-buttons">
        {stepIndex > 0 && (
          <Button onClick={back} label="Voltar" variant="secondary" />
        )}

        {stepIndex < steps.length - 1 && (
          <Button
            onClick={next}
            variant="primary"
            disabled={!canProceed()}
            label={
              currentStep === "welcome"
                ? "Começar"
                : currentStep === "manifesto"
                  ? "Quero continuar"
                  : "Próximo"
            }
          />
        )}

        {stepIndex === steps.length - 1 && (
          <Button
            onClick={handleRegister}
            label={loading ? "Criando..." : "Criar conta"}
            variant="primary"
          />
        )}
      </div>
    </Container>
  );
}
