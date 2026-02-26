import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import Loading from "../../components/Loading/Loading";
import BackButton from "../../components/BackButton/BackButton";
import { getApiErrorMessage } from "../../utils/errors";

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

const parsePesoInput = (value: string): number | null => {
  const sanitized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  if (!sanitized) return null;

  const parsed = Number(sanitized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
};

const Questionario: React.FC = () => {
  const navigate = useNavigate();

  const [pilaresData, setPilaresData] = useState<Pilar[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [pesoAtualInput, setPesoAtualInput] = useState<string>("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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
  const totalSteps = totalQuestions + 1;

  const isWeightStep = currentStepIndex === 0;
  const questionIndex = currentStepIndex - 1;
  const currentQuestion = !isWeightStep ? allQuestions[questionIndex] : undefined;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const parsedPesoAtual = parsePesoInput(pesoAtualInput);

  useEffect(() => {
    const fetchEstrutura = async () => {
      try {
        const response = await api.get("/questionario/estrutura");
        setPilaresData(response.data);
      } catch (err) {
        setError("Falha ao carregar o questionário. Tente fazer login novamente.");
        console.error("Erro ao buscar estrutura:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchEstrutura();
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prevIndex) => prevIndex - 1);
      setError(null);
    }
  }, [currentStepIndex]);

  const handleNext = useCallback(() => {
    if (isWeightStep) {
      if (parsedPesoAtual === null) {
        setError("Informe seu peso atual em kg para continuar.");
        return;
      }

      setError(null);
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
      return;
    }

    if (currentQuestion && answers[currentQuestion.id] !== undefined && !isLastStep) {
      setError(null);
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
    }
  }, [answers, currentQuestion, isLastStep, isWeightStep, parsedPesoAtual]);

  const handleAnswerChange = useCallback((perguntaId: number, score: number) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [perguntaId]: score,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      if (parsedPesoAtual === null) {
        setError("Informe seu peso atual em kg para finalizar.");
        setIsSubmitting(false);
        return;
      }

      if (Object.keys(answers).length !== totalQuestions) {
        setError("Erro interno: Nem todas as perguntas foram respondidas.");
        setIsSubmitting(false);
        return;
      }

      const submissionData = Object.entries(answers)
        .map(([id, score]) => {
          const perguntaId = parseInt(id, 10);
          const questionMeta = questionMap[perguntaId];

          if (!questionMeta) {
            console.error(`Metadado de pergunta não encontrado para ID: ${perguntaId}`);
            return null;
          }

          return {
            perguntaId,
            score,
            ehInvertida: questionMeta.ehInvertida,
          };
        })
        .filter((item) => item !== null);

      if (submissionData.length !== totalQuestions) {
        setError(
          "Erro na montagem do payload. Verifique se todas as perguntas foram carregadas corretamente.",
        );
        setIsSubmitting(false);
        return;
      }

      setError(null);

      try {
        await api.post("/questionario/submeter", {
          pesoAtualKg: parsedPesoAtual,
          respostas: submissionData,
        });
        navigate("/resultado");
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "Falha ao enviar respostas. Verifique a conexão do servidor.",
          ),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, navigate, parsedPesoAtual, questionMap, totalQuestions],
  );

  if (isFetching) {
    return <Loading />;
  }

  if (error && !isWeightStep && !currentQuestion) {
    return (
      <Container>
        <p className="mx-auto w-full max-w-[620px] rounded-lg border border-[#f5c2c2] bg-[#ffebee] p-4 text-sm text-[#b00020]">
          {error}
        </p>
      </Container>
    );
  }

  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;
  const isCurrentAnswered = isWeightStep
    ? parsedPesoAtual !== null
    : currentQuestion
      ? answers[currentQuestion.id] !== undefined
      : false;

  const getMotivationalText = (progress: number) => {
    if (progress <= 0.15) return "Começamos pelo que mais importa hoje.";
    if (progress <= 0.35) return "Estamos entendendo sua rotina.";
    if (progress <= 0.7) return "Seu plano está tomando forma.";
    if (progress < 1) return "Estamos finalizando tudo para você.";
    return "Pronto. Agora é com você.";
  };

  const progress = (currentStepIndex + 1) / totalSteps;
  const motivationalText = getMotivationalText(progress);

  return (
    <Container>
      <div className="mx-auto w-full max-w-[660px]">
        <BackButton />

        <h1 className="text-2xl font-semibold text-[#3f4c36] sm:text-3xl">
          Ritual de Florescimento
        </h1>

        <p className="mt-1 text-sm italic text-[#5f6657] sm:text-base">{motivationalText}</p>

        <div className="mt-4 h-2.5 w-full rounded-full bg-[#e3e6de]">
          <div
            className="h-full rounded-full bg-[#87967a] transition-[width] duration-200"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <p className="mt-2 text-xs font-medium text-[#66705d] sm:text-sm">
          Etapa {currentStepIndex + 1} de {totalSteps}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
          {isWeightStep ? (
            <section className="rounded-xl border border-[#e8ebdf] bg-white/82 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-6">
              <h2 className="text-lg font-semibold text-[#5f6f52] sm:text-xl">Seu peso atual</h2>

              <p className="mt-3 text-[15px] leading-relaxed text-[#3f3f3f] sm:text-base">
                Qual é o seu peso hoje? Esse dado é essencial para acompanharmos sua evolução mensal.
              </p>

              <div className="mt-5 max-w-[220px]">
                <label htmlFor="peso-atual" className="text-sm font-medium text-[#4f5a45]">
                  Peso em kg
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#d9dfcd] bg-[#f9fbf5] px-3">
                  <input
                    id="peso-atual"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex.: 90,4"
                    value={pesoAtualInput}
                    onChange={(e) => {
                      setError(null);
                      setPesoAtualInput(e.target.value);
                    }}
                    className="h-11 w-full bg-transparent text-base outline-none"
                  />
                  <span className="text-sm font-semibold text-[#5f6f52]">kg</span>
                </div>
              </div>
            </section>
          ) : (
            currentQuestion && (
              <section className="rounded-xl border border-[#e8ebdf] bg-white/82 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-6">
                <h2 className="text-lg font-semibold text-[#5f6f52] sm:text-xl">
                  {currentQuestion.pilarNome}
                </h2>

                <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#3f3f3f] sm:text-base">
                  {currentQuestion.textoPergunta}
                </p>

                <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:gap-3">
                  {[1, 2, 3].map((score) => {
                    const isSelected = answers[currentQuestion.id] === score;

                    return (
                      <label
                        key={score}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition sm:text-base ${
                          isSelected
                            ? "border-[#87967a] bg-[#eef2e8]"
                            : "border-[#e3e6de] bg-white hover:border-[#87967a]/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`pergunta_${currentQuestion.id}`}
                          value={score}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(currentQuestion.id, score)}
                          required
                          className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5"
                        />
                        <span className="leading-relaxed">
                          {score === 1 && "Nunca"}
                          {score === 2 && "Às vezes (até dois dias na semana)"}
                          {score === 3 && "Frequentemente (três ou mais dias na semana)"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            )
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-[#f5c2c2] bg-[#ffebee] p-3 text-sm text-[#b00020]">
              {error}
            </p>
          )}

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-2">
            {currentStepIndex > 0 ? (
              <Button
                onClick={handlePrevious}
                variant="secondary"
                label="Voltar para pergunta anterior"
                disabled={isSubmitting}
              />
            ) : (
              <span className="hidden sm:block" />
            )}

            {isLastStep ? (
              <Button
                type="submit"
                variant="primary"
                label={isSubmitting ? "Enviando..." : "Finalizar Questionário"}
                loading={isSubmitting}
                disabled={!isCurrentAnswered || isSubmitting}
              />
            ) : (
              <Button
                onClick={handleNext}
                variant="primary"
                label="Próxima pergunta"
                type="button"
                disabled={!isCurrentAnswered || isSubmitting}
              />
            )}
          </div>
        </form>
      </div>
    </Container>
  );
};

export default Questionario;
