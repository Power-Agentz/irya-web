import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./Questionario.css";
import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import Loading from "../../components/Loading/Loading";

import BackButton from "../../components/BackButton/BackButton";

interface Pergunta {
  id: number;
  textoPergunta: string;
  ordem: number;
  ehInvertida: boolean;
  pilarNome: string;
}

interface Pilar {
  id: number;
  nomePilar: string;
  pontuacaoMaxima: number;
  perguntas: Pergunta[];
}

type AnswersState = Record<number, number>;

const Questionario: React.FC = () => {
  const navigate = useNavigate();

  const [pilaresData, setPilaresData] = useState<Pilar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersState>({});

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const allQuestions: Pergunta[] = useMemo(() => {
    return pilaresData.flatMap((pilar) =>
      pilar.perguntas.map((pergunta) => ({
        ...pergunta,
        pilarNome: pilar.nomePilar,
      })),
    );
  }, [pilaresData]);

  const questionMap: Record<number, Pergunta> = useMemo(() => {
    return allQuestions.reduce(
      (acc, q) => {
        acc[q.id] = q;
        return acc;
      },
      {} as Record<number, Pergunta>,
    );
  }, [allQuestions]);

  const totalQuestions = allQuestions.length;
  const currentQuestion = allQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  useEffect(() => {
    const fetchEstrutura = async () => {
      try {
        const response = await api.get("/questionario/estrutura");
        setPilaresData(response.data);
      } catch (err: any) {
        setError(
          "Falha ao carregar o questionário. Tente fazer login novamente.",
        );
        console.error("Erro ao buscar estrutura:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstrutura();
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setTimeout(() => {
        setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
      }, 100);
    }
  }, [currentQuestionIndex]);

  const handleNext = useCallback(() => {
    if (answers[currentQuestion.id] !== undefined && !isLastQuestion) {
      setTimeout(() => {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      }, 100);
    }
  }, [answers, currentQuestion, isLastQuestion]);

  const handleAnswerChange = useCallback(
    (perguntaId: number, score: number) => {
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [perguntaId]: score,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      if (Object.keys(answers).length !== totalQuestions) {
        setError("Erro interno: Nem todas as perguntas foram respondidas.");
        setLoading(false);
        return;
      }

      const submissionData = Object.entries(answers)
        .map(([id, score]) => {
          const perguntaId = parseInt(id);
          const questionMeta = questionMap[perguntaId];

          if (!questionMeta) {
            console.error(
              `Metadado de pergunta não encontrado para ID: ${perguntaId}`,
            );
            return null;
          }

          return {
            perguntaId: perguntaId,
            score: score,
            ehInvertida: questionMeta.ehInvertida,
          };
        })
        .filter((item) => item !== null);

      if (submissionData.length !== totalQuestions) {
        setError(
          "Erro na montagem do payload. Verifique se todas as perguntas foram carregadas corretamente.",
        );
        setLoading(false);
        return;
      }

      setError(null);
      try {
        await api.post("/questionario/submeter", submissionData);
        navigate("/resultado");
      } catch (err: any) {
        console.error("Erro ao submeter questionário:", err);
        setError(
          err.response?.data?.error ||
            "Falha ao enviar respostas. Verifique a conexão do servidor.",
        );
      } finally {
        setLoading(false);
      }
    },
    [answers, totalQuestions, navigate, questionMap],
  );

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Container> {error}</Container>;
  }

  const progressPercentage =
    ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isCurrentAnswered = answers[currentQuestion.id] !== undefined;

  const getMotivationalText = (progress: number) => {
    if (progress <= 0.2) {
      return "Você está cuidando de você.";
    }

    if (progress <= 0.4) {
      return "Estamos entendendo sua rotina.";
    }

    if (progress <= 0.75) {
      return "Seu plano está tomando forma.";
    }

    if (progress < 1) {
      return "Estamos finalizando tudo para você.";
    }

    return "Pronto. Agora é com você.";
  };

  const progress = (currentQuestionIndex + 1) / totalQuestions;
  const motivationalText = getMotivationalText(progress);

  <p className="questionario-subtitle">{motivationalText}</p>;

  return (
    <Container>
      <BackButton />
      <h1 className="login-title">Ritual de Florescimento</h1>

      <p className="questionario-subtitle">
        <em>{motivationalText}</em>
      </p>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <form onSubmit={handleSubmit} className="login-form">
        {currentQuestion && (
          <section key={currentQuestion.id} className="pergunta-card">
            <h2 className="pilar-title">{currentQuestion.pilarNome}</h2>

            <p className="pergunta-texto">{currentQuestion.textoPergunta}</p>

            <div className="options-group">
              {[1, 2, 3].map((score) => (
                <label key={score}>
                  <input
                    type="radio"
                    name={`pergunta_${currentQuestion.id}`}
                    value={score}
                    checked={answers[currentQuestion.id] === score}
                    onChange={() =>
                      handleAnswerChange(currentQuestion.id, score)
                    }
                    required
                  />
                  <span>
                    {score === 1 && "Nunca"}
                    {score === 2 && "Às vezes (até dois dias na semana)"}
                    {score === 3 &&
                      "Frequentemente (três ou mais dias na semana)"}
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        <div className="navigation-controls">
          {currentQuestionIndex > 0 && (
            <Button
              onClick={handlePrevious}
              variant="secondary"
              label="Voltar"
            />
          )}

          {isLastQuestion ? (
            <Button
              type="submit"
              variant="primary"
              label="Finalizar Questionário"
              disabled={!isCurrentAnswered}
            />
          ) : (
            <Button
              onClick={handleNext}
              variant="primary"
              label="Próximo"
              type="button"
              disabled={!isCurrentAnswered}
            />
          )}
        </div>
      </form>
    </Container>
  );
};

export default Questionario;
