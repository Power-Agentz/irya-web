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
  "preferredName",
  "gender",
  "phone",
  "password",
  "confirm",
] as const;

type Step = (typeof steps)[number];

export default function Cadastro() {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    preferredName: "",
    gender: "Feminino",
    phone: "",
    password: "",
  });

  const currentStep = steps[stepIndex];

  const update = (field: Step, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const next = () => setStepIndex((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStepIndex((s) => Math.max(s - 1, 0));

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Cadastro
      await api.post("/auth/register", {
        senha: formData.password,
        nomeSocialApelido: formData.preferredName,
        telefone: formData.phone || null,
        sexo: formData.gender,
      });

      // 2. Login automático
      const loginResponse = await api.post("/auth/login", {
        telefone: formData.phone,
        senha: formData.password,
      });

      const { token, paciente } = loginResponse.data;

      // 3. Persistência
      localStorage.setItem("token", token);
      localStorage.setItem("pacienteData", JSON.stringify(paciente));

      // 4. Redirect pós-login
      navigate("/inicio");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "preferredName":
        return (
          <div className="slide-input-group">
            <input
              className="slide-input"
              placeholder="Qual seu nome?"
              value={formData.preferredName}
              onChange={(e) => update("preferredName", e.target.value)}
            />{" "}
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
              <option>Feminino</option>
              <option>Masculino</option>
              <option>Outro</option>
            </select>
          </div>
        );

      case "phone":
        return (
          <div className="slide-input-group">
            <input
              className="slide-input"
              placeholder="Seu número do Whatsapp"
              value={formData.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
        );

      case "password":
        return (
          <div className="slide-input-group">
            <input
              type="password"
              className="slide-input"
              placeholder="Crie uma senha"
              value={formData.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>
        );

      case "confirm":
        return (
          <div className="confirm-box">
            <h3>Prontinho!</h3>
            <p>
              Já temos tudo o que precisamos. Agora é só clicar em{" "}
              <b>Criar Conta</b> e nós vamos te chamar no Whatsapp para
              conversarmos melhor.
            </p>
          </div>
        );
    }
  };

  return (
    <Container hasHeader={false}>
      <div className="register-image-container">
        <img src={logo} alt="Irya Logo" className="register-image" />{" "}
      </div>
      {stepIndex < steps.length - 1 && (
        <div className="welcome-text">
          <h1>
            {" "}
            Olá, eu sou a <b>Irya </b>
          </h1>
          Gostaria de te conhecer! E para isso, preciso que você responda
          algumas perguntinhas para começarmos.
          <p>
            {" "}
            Já nos conhecemos? <a href="/login">Entrar</a>.
          </p>
        </div>
      )}
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

      {stepIndex >= 4 && error && <p className="error-msg">{error}</p>}

      <div className="wizard-buttons">
        {stepIndex > 0 && (
          <Button onClick={back} label="Voltar" variant="secondary" />
        )}
        {stepIndex < steps.length - 1 && (
          <Button onClick={next} label="Próximo" variant="primary" />
        )}

        {stepIndex === steps.length - 1 && (
          <Button
            onClick={handleRegister}
            label={loading ? "Enviando..." : "Criar Conta"}
            variant="primary"
          />
        )}
      </div>
    </Container>
  );
}
