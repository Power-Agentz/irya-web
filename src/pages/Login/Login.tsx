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
          <p className="mb-5 rounded-2xl border border-[#f2c7c7] bg-[#fff1f1]/90 p-3 text-center text-sm font-medium text-[#c0392b] backdrop-blur-sm">
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

          <p className="pt-1 text-center text-sm text-[#7c9d72]">
            ou
            <Link
              to="/cadastro"
              className="ml-1 font-semibold text-[#4a5d4f] transition hover:text-[#3a4d3f] hover:underline"
            >
              crie sua conta
            </Link>
          </p>

          <div className="pt-1 text-center">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#f1e3b9] bg-[#fffaf1] px-3 py-1 text-xs font-medium text-[#4a5d4f] transition hover:border-[#e4c884] hover:bg-white hover:text-[#3a4d3f]"
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
