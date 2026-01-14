import { useState, useEffect } from "react";
import api from "../api";

interface QuestionarioStatus {
  podeResponder: boolean;
  resultadoAnterior: any | null;
}

export const useQuestionarioStatus = () => {
  const [status, setStatus] = useState<QuestionarioStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get("/questionario/status");
        setStatus(response.data);
      } catch {
        setError("Erro ao verificar status do questionário.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return { status, loading, error };
};
