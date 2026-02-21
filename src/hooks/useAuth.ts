import { useCallback } from "react";
import api from "../api";
import {
  clearSession,
  getPaciente,
  isAuthenticated,
  type PacienteSession,
  saveSession,
} from "../utils/session";

interface LoginPayload {
  telefone: string;
  senha: string;
}

interface RegisterPayload {
  nomeCompleto: string;
  telefone: string;
  senha: string;
}

interface AuthResponse {
  token: string;
  paciente: PacienteSession;
}

interface TelefoneDisponivelResponse {
  disponivel: boolean;
}

export const useAuth = () => {
  const login = useCallback(async ({ telefone, senha }: LoginPayload) => {
    const response = await api.post<AuthResponse>("/auth/login", {
      telefone,
      senha,
    });

    const { token, paciente } = response.data;
    saveSession(token, paciente);

    return response.data;
  }, []);

  const registerAndLogin = useCallback(
    async ({ nomeCompleto, telefone, senha }: RegisterPayload) => {
      await api.post("/auth/register", {
        nomeCompleto,
        telefone,
        senha,
      });

      return login({ telefone, senha });
    },
    [login],
  );

  const logout = useCallback(() => {
    clearSession();
  }, []);

  const checkTelefoneDisponivel = useCallback(async (telefone: string) => {
    const response = await api.get<TelefoneDisponivelResponse>(
      `/auth/telefone-disponivel/${telefone}`,
    );
    return response.data.disponivel;
  }, []);

  return {
    login,
    logout,
    registerAndLogin,
    checkTelefoneDisponivel,
    getPaciente,
    isAuthenticated,
  };
};
