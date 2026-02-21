import axios from "axios";

interface ApiErrorBody {
  error?: string;
}

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error ?? fallbackMessage;
  }

  return fallbackMessage;
};
