import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import Loading from "../../components/Loading/Loading";
import BackButton from "../../components/BackButton/BackButton";
import AssessmentFinalizingOverlay from "../../components/AssessmentFinalizingOverlay/AssessmentFinalizingOverlay";
import { getApiErrorMessage } from "../../utils/errors";
import iryaReceptiva from "../../../assets/irya-receptiva.png";
import iryaSaudando from "../../../assets/irya-saudando.png";
import iryaPensando from "../../../assets/irya-pensando.png";
import iryaFrontal from "../../../assets/irya-de-frente.png";
import iryaGrata from "../../../assets/irya-grata.png";

const FINALIZATION_DELAY_MS = 5600;

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

const formatPesoInput = (value: number): string =>
  value.toFixed(1).replace(".", ",");

const formatAlturaInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 3);
  if (!digits) return "";

  if (digits.length === 1) return digits;
  if (digits.length === 2) return `${digits[0]},${digits[1]}`;

  return `${digits[0]},${digits.slice(1, 3)}`;
};

const parseAlturaInput = (value: string): number | null => {
  const sanitized = value
    .replace(/m/gi, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");

  if (!sanitized) return null;

  const parsed = Number(sanitized);
  if (!Number.isFinite(parsed) || parsed < 0.8 || parsed > 2.5) return null;

  return parsed;
};

type QuestionarioStatusPayload = {
  alturaM: number | null;
  pesoAtualKg: number | null;
};

type IryaDialogueStage = {
  maxProgress: number;
  avatarSrc: string;
  avatarAlt: string;
  message: string;
};

const IRYA_DIALOGUE_STAGES: IryaDialogueStage[] = [
  {
    maxProgress: 0.16,
    avatarSrc: iryaReceptiva,
    avatarAlt: "Irya receptiva guiando o início da avaliação",
    message: "Começamos pelo essencial. Me mostre seu ponto de partida.",
  },
  {
    maxProgress: 0.36,
    avatarSrc: iryaSaudando,
    avatarAlt: "Irya saudando durante o avanço da avaliação",
    message: "Ótimo ritmo. Já estou mapeando padrões da sua rotina.",
  },
  {
    maxProgress: 0.58,
    avatarSrc: iryaFrontal,
    avatarAlt: "Irya em posição frontal acompanhando a evolução da etapa",
    message: "Metade concluída. Vamos transformar percepção em direção prática.",
  },
  {
    maxProgress: 0.82,
    avatarSrc: iryaPensando,
    avatarAlt: "Irya pensativa refinando a leitura personalizada",
    message: "Agora refinamos os detalhes do seu plano personalizado.",
  },
  {
    maxProgress: 1,
    avatarSrc: iryaGrata,
    avatarAlt: "Irya com expressão de gratidão no encerramento da avaliação",
    message: "Últimos passos. Sua leitura já está quase pronta.",
  },
];

const Questionario: React.FC = () => {
  const navigate = useNavigate();

  const [pilaresData, setPilaresData] = useState<Pilar[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [pesoAtualInput, setPesoAtualInput] = useState<string>("");
  const [alturaInput, setAlturaInput] = useState<string>("");
  const [alturaBloqueada, setAlturaBloqueada] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showFinalizingOverlay, setShowFinalizingOverlay] = useState(false);

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
  const parsedAltura = parseAlturaInput(alturaInput);

  useEffect(() => {
    const fetchEstrutura = async () => {
      try {
        const [estruturaResponse, statusResponse] = await Promise.all([
          api.get("/questionario/estrutura"),
          api.get<QuestionarioStatusPayload>("/questionario/status"),
        ]);

        setPilaresData(estruturaResponse.data);

        const alturaM = statusResponse.data?.alturaM;
        const pesoAtualKg = statusResponse.data?.pesoAtualKg;

        if (typeof alturaM === "number" && Number.isFinite(alturaM) && alturaM > 0) {
          setAlturaInput(formatAlturaInput(String(Math.round(alturaM * 100))));
          setAlturaBloqueada(true);
        } else {
          setAlturaInput("");
          setAlturaBloqueada(false);
        }

        if (
          typeof pesoAtualKg === "number" &&
          Number.isFinite(pesoAtualKg) &&
          pesoAtualKg > 0
        ) {
          setPesoAtualInput(formatPesoInput(pesoAtualKg));
        }
      } catch (err) {
        setError("Falha ao carregar a avaliação. Tente fazer login novamente.");
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

      if (parsedAltura === null) {
        setError("Informe sua altura no formato 0,00m para continuar.");
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
  }, [answers, currentQuestion, isLastStep, isWeightStep, parsedAltura, parsedPesoAtual]);

  const handleAnswerChange = useCallback((perguntaId: number, score: number) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [perguntaId]: score,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (parsedPesoAtual === null) {
        setError("Informe seu peso atual em kg para finalizar.");
        return;
      }

      if (parsedAltura === null) {
        setError("Informe sua altura no formato 0,00m para finalizar.");
        return;
      }

      if (Object.keys(answers).length !== totalQuestions) {
        setError("Erro interno: Nem todas as perguntas foram respondidas.");
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
        return;
      }

      setError(null);
      setIsSubmitting(true);
      setShowFinalizingOverlay(true);

      const requestStartTime = Date.now();
      let resetSubmittingOnFinally = true;

      try {
        await api.post("/questionario/submeter", {
          pesoAtualKg: parsedPesoAtual,
          alturaM: parsedAltura,
          respostas: submissionData,
        });

        const elapsedMs = Date.now() - requestStartTime;
        const remainingDelay = Math.max(FINALIZATION_DELAY_MS - elapsedMs, 0);

        if (remainingDelay > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
        }

        resetSubmittingOnFinally = false;
        navigate("/resultado");
      } catch (err: unknown) {
        setShowFinalizingOverlay(false);
        setError(
          getApiErrorMessage(
            err,
            "Falha ao enviar respostas. Verifique a conexão do servidor.",
          ),
        );
      } finally {
        if (resetSubmittingOnFinally) {
          setIsSubmitting(false);
        }
      }
    },
    [answers, navigate, parsedAltura, parsedPesoAtual, questionMap, totalQuestions],
  );

  if (isFetching) {
    return <Loading />;
  }

  if (error && !isWeightStep && !currentQuestion) {
    return (
      <Container>
        <p className="mx-auto w-full max-w-[760px] rounded-lg border border-[#f5c2c2] bg-[#ffebee] p-4 text-sm text-[#b00020]">
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

  const progress = (currentStepIndex + 1) / totalSteps;
  const iryaDialogue =
    IRYA_DIALOGUE_STAGES.find((stage) => progress <= stage.maxProgress) ??
    IRYA_DIALOGUE_STAGES[IRYA_DIALOGUE_STAGES.length - 1];

  return (
    <Container>
      <div className="mx-auto w-full max-w-[860px]">
        <BackButton />

        <h1 className="text-2xl font-semibold text-[#3f4c36] sm:text-3xl">
          Avaliação de Estilo de Vida
        </h1>

        <div className="mt-4 h-2.5 w-full rounded-full bg-[#e3e6de]">
          <div
            className="h-full rounded-full bg-[#87967a] transition-[width] duration-200"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <section className="mt-4 rounded-2xl border border-[#d7e2c9] bg-gradient-to-r from-[#f6faef] to-[#edf5e2] p-2.5 shadow-[0_8px_20px_rgba(42,54,34,0.08)] sm:p-3">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <span className="irya-avatar-ring-outer pointer-events-none absolute inset-[-10px] rounded-full border border-[#79b56f]/55" />
              <span className="irya-avatar-ring-inner pointer-events-none absolute inset-[-5px] rounded-full border-2 border-[#79b56f]/70" />
              <img
                src={iryaDialogue.avatarSrc}
                alt={iryaDialogue.avatarAlt}
                className="relative h-16 w-16 rounded-full border-2 border-[#bfd0ae] object-cover object-[50%_22%] shadow-[0_10px_20px_rgba(70,93,57,0.2)] sm:h-24 sm:w-24"
              />
            </div>

            <div className="relative flex-1">
              <div className="absolute -left-2 top-6 h-4 w-4 rotate-45 border-b border-l border-[#dbe5ce] bg-white/90" />
              <div className="rounded-xl border border-[#dbe5ce] bg-white/90 p-2.5 text-sm text-[#4f5a45] shadow-[0_8px_16px_rgba(42,54,34,0.08)] sm:p-3 sm:text-[15px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d7a5d]">
                  Irya
                </p>
                <p className="mt-1 leading-relaxed">{iryaDialogue.message}</p>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
          {isWeightStep ? (
            <section className="min-h-[430px] rounded-xl border border-[#e8ebdf] bg-white/82 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:min-h-[420px] sm:p-6">
              <h2 className="text-lg font-semibold text-[#5f6f52] sm:text-xl">
                Seus dados físicos atuais
              </h2>

              <p className="mt-3 text-[15px] leading-relaxed text-[#3f3f3f] sm:text-base">
                Informe seu peso de hoje e sua altura para calcularmos seu IMC e acompanharmos sua evolução mensal.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:max-w-[520px] sm:grid-cols-2">
                <div>
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

                <div>
                  <label htmlFor="altura-atual" className="text-sm font-medium text-[#4f5a45]">
                    Altura em m
                  </label>
                  <div
                    className={`mt-2 flex items-center gap-2 rounded-lg border px-3 ${
                      alturaBloqueada
                        ? "border-[#d5dbc9] bg-[#eef3e7]"
                        : "border-[#d9dfcd] bg-[#f9fbf5]"
                    }`}
                  >
                    <input
                      id="altura-atual"
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex.: 1,65"
                      maxLength={4}
                      value={alturaInput}
                      disabled={alturaBloqueada}
                      onChange={(e) => {
                        setError(null);
                        setAlturaInput(formatAlturaInput(e.target.value));
                      }}
                      className="h-11 w-full bg-transparent text-base outline-none disabled:cursor-not-allowed disabled:text-[#5f6f52]"
                    />
                    <span className="text-sm font-semibold text-[#5f6f52]">m</span>
                  </div>
                  {alturaBloqueada && (
                    <p className="mt-1 text-xs text-[#6b7762]">
                      Altura registrada no primeiro acesso e bloqueada para edição.
                    </p>
                  )}
                </div>
              </div>
            </section>
          ) : (
            currentQuestion && (
              <section className="min-h-[430px] rounded-xl border border-[#e8ebdf] bg-white/82 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:min-h-[420px] sm:p-6">
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
                          {score === 1 && "Nunca (nenhum dia da semana)"}
                          {score === 2 && "Às vezes (até quatro dias na semana)"}
                          {score === 3 && "Frequentemente (cinco ou mais dias na semana)"}
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
                className="order-2 sm:order-1"
              />
            ) : (
              <span className="hidden sm:order-1 sm:block" />
            )}

            {isLastStep ? (
              <Button
                type="submit"
                variant="primary"
                label={isSubmitting ? "Enviando..." : "Finalizar Avaliação"}
                loading={isSubmitting}
                disabled={!isCurrentAnswered || isSubmitting}
                className="order-1 sm:order-2"
              />
            ) : (
              <Button
                onClick={handleNext}
                variant="primary"
                label="Próxima pergunta"
                type="button"
                disabled={!isCurrentAnswered || isSubmitting}
                className="order-1 sm:order-2"
              />
            )}
          </div>
        </form>
      </div>
      <AssessmentFinalizingOverlay visible={showFinalizingOverlay} />
    </Container>
  );
};

export default Questionario;
