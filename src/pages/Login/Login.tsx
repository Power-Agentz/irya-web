import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import "./Login.css";
import api from "../../api";
import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import logo from "../../../assets/logo-irya.png";

const Login = () => {
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const response = await api.post("/auth/login", {
          telefone: phone,
          senha: password,
        });

        const { token, paciente } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("pacienteData", JSON.stringify(paciente));
        navigate("/inicio");
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || "Falha na conexão ou erro desconhecido.";
        setError(errorMessage);
        console.error("Login Error:", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [phone, password, navigate]
  );
  console.log("API:", import.meta.env.VITE_API_URL);

  return (
    <Container hasHeader={false}>
      {" "}
      <div className="login-image-container">
        <img src={logo} alt="Irya Logo" className="login-image" />{" "}
      </div>
      {error && <p className="login-error">{error}</p>}
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="tel"
          placeholder="Digite seu telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Digite sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />

        <Button
          variant="primary"
          type="submit"
          label={loading ? "Entrando..." : "Entrar"}
        />

        <p className="login-link-text">
          ou
          <a href="/cadastro" className="login-link">
            crie sua conta
          </a>
        </p>
      </form>
    </Container>
  );
};

export default Login;
