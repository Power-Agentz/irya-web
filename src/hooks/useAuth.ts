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

interface ActivateInvitePayload {
  id: string;
  senha: string;
}

interface AuthResponse {
  token: string;
  paciente: PacienteSession;
}

interface TelefoneDisponivelResponse {
  disponivel: boolean;
}

interface PreCadastroResponse {
  id: string;
  nomeCompleto: string | null;
  telefone: string | null;
  senhaJaCriada: boolean;
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

  const getPreCadastroById = useCallback(async (id: string) => {
    const response = await api.get<PreCadastroResponse>(`/auth/pre-cadastro/${id}`);
    return response.data;
  }, []);

  const activatePreCadastroAndLogin = useCallback(
    async ({ id, senha }: ActivateInvitePayload) => {
      const response = await api.post<AuthResponse>("/auth/pre-cadastro/ativar", {
        id,
        senha,
      });

      const { token, paciente } = response.data;
      saveSession(token, paciente);

      return response.data;
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
  }, []);

  const checkTelefoneDisponivel = useCallback(async (telefone: string) => {
    const response = await api.get<TelefoneDisponivelResponse>(
      `/auth/telefone-disponivel/${telefone}`,
    );

    if (typeof response.data?.disponivel !== "boolean") {
      throw new Error("Resposta inválida ao validar telefone.");
    }

    return response.data.disponivel;
  }, []);

  return {
    login,
    logout,
    registerAndLogin,
    getPreCadastroById,
    activatePreCadastroAndLogin,
    checkTelefoneDisponivel,
    getPaciente,
    isAuthenticated,
  };
};
