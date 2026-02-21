import { useState, useEffect, useCallback } from "react";
import api from "../api";

export interface DetalhePilar {
  nome: string;
  pontuacaoObtida: number;
  pontuacaoMaxima: number;
  percentualPilar: number;
}

export interface ResultadoData {
  questionarioId: number;
  dataConclusao: string;
  dataLimite?: string;
  pontuacaoTotal: number;
  percentualGlobal: number;
  classificacao: string;
  detalhesPilares: DetalhePilar[];
}

interface QuestionarioStatus {
  podeResponder: boolean;
  resultadoAnterior: ResultadoData | null;
  pesoAtualKg: number | null;
  variacaoPesoKg: number | null;
}

export const useQuestionarioStatus = () => {
  const [status, setStatus] = useState<QuestionarioStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<QuestionarioStatus>("/questionario/status");
      setStatus(response.data);
    } catch {
      setError("Erro ao verificar status do questionário.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
};
