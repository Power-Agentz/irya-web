import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import TextField from "../../components/TextField/TextField";
import { formatPhone, normalizePhone } from "../../utils/phone";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/errors";

const Login = () => {
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        await login({
          telefone: normalizePhone(phone),
          senha: password,
        });

        navigate("/inicio");
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(err, "Falha na conexao ou erro desconhecido."),
        );
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, password, phone],
  );

  return (
    <Container hasHeader={false}>
      <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center py-2 sm:py-4">
        <BrandLogo className="mb-4 sm:mb-6" />

        <div className="rounded-xl bg-white/72 p-6 backdrop-blur-md border border-white/70 shadow-[0_14px_34px_rgba(24,28,20,0.12)] sm:p-6">
          <h1 className="text-center text-sm font-semibold text-[#748768] sm:text-2xl">
            Entrar com telefone e senha
          </h1>

          {error && (
            <p className="mt-4 rounded-lg border border-[#f5c2c2] bg-[#ffebee] p-3 text-center text-sm font-medium text-[#e53935]">
              {error}
            </p>
          )}

          <form
            onSubmit={handleLogin}
            className="mt-6 flex w-full flex-col gap-5 sm:gap-6"
          >
            <TextField
              type="tel"
              inputMode="numeric"
              placeholder="Ex.:(xx) xxxxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              required
            />

            <TextField
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              variant="primary"
              type="submit"
              label={loading ? "Entrando..." : "Entrar"}
              className="mt-2"
            />

            <p className="text-center text-sm text-[#66705d]">
              ou
              <Link
                to="/cadastro"
                className="ml-1 font-semibold text-[#87967a] transition hover:text-[#efbd32] hover:underline"
              >
                crie sua conta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </Container>
  );
};

export default Login;
