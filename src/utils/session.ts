export const TOKEN_KEY = "token";
export const PACIENTE_KEY = "pacienteData";
export const AUTH_CHANGE_EVENT = "irya:auth-changed";

export interface PacienteSession {
  telefone: string;
  nomeCompleto?: string;
  nome?: string;
  isSubscriber?: boolean;
  subscriptionStartedAt?: string | null;
  subscriptionCanceledAt?: string | null;
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const isAuthenticated = (): boolean => Boolean(getToken());

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PACIENTE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const getPaciente = (): PacienteSession | null => {
  const raw = localStorage.getItem(PACIENTE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PacienteSession;
  } catch {
    localStorage.removeItem(PACIENTE_KEY);
    return null;
  }
};

export const setPaciente = (paciente: PacienteSession): void => {
  localStorage.setItem(PACIENTE_KEY, JSON.stringify(paciente));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const saveSession = (token: string, paciente: PacienteSession): void => {
  setToken(token);
  setPaciente(paciente);
};

export const getPacienteNome = (): string => {
  const paciente = getPaciente();
  return paciente?.nomeCompleto || paciente?.nome || "";
};

export const getPacientePrimeiroNome = (): string => {
  const nome = getPacienteNome().trim();

  if (!nome) {
    return "";
  }

  return nome.split(/\s+/)[0];
};

export const isPacienteSubscriber = (): boolean => {
  const paciente = getPaciente();
  return paciente?.isSubscriber === true;
};
