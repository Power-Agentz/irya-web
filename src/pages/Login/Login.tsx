import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FiLock } from "react-icons/fi";

import Button from "../../components/Button/Button";
import TextField from "../../components/TextField/TextField";
import AuthLayout from "../../components/AuthLayout/AuthLayout";
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
    <AuthLayout title="Entrar com telefone e senha">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mt-8 sm:mt-9"
      >
        {error && (
          <p className="mb-5 rounded-2xl border border-[#f2c7c7] bg-[#fff1f1]/90 p-3 text-center text-sm font-medium text-[#b00020] backdrop-blur-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="flex w-full flex-col gap-6 sm:gap-7">
          <TextField
            type="tel"
            inputMode="numeric"
            label="Telefone"
            placeholder="(XX) XXXXX-XXXX"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            required
          />

          <TextField
            type="password"
            label="Senha"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            variant="primary"
            type="submit"
            label={loading ? "Entrando..." : "Entrar"}
            loading={loading}
            className="mt-2"
          />

          <p className="pt-1 text-center text-sm text-[#66705d]">
            ou
            <Link
              to="/cadastro"
              className="ml-1 font-semibold text-[#7d8e70] transition hover:text-[#6b7d5f] hover:underline"
            >
              crie sua conta
            </Link>
          </p>

          <div className="pt-1 text-center">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d6dfcc] bg-[#f7faf2] px-3 py-1 text-xs font-medium text-[#607053] transition hover:border-[#b8c6aa] hover:bg-[#eef4e5] hover:text-[#4f5f43]"
            >
              <FiLock className="h-3.5 w-3.5" />
              Acesso interno da equipe
            </Link>
          </div>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default Login;
