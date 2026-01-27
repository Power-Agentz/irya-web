import React, { useMemo, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PolarAngleAxis,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import "./Resultado.css";
import api from "../../api";
import Container from "../../components/Container/Container";
import Loading from "../../components/Loading/Loading";
import Button from "../../components/Button/Button";
import BackButton from "../../components/BackButton/BackButton";

interface DetalhePilar {
  nome: string;
  pontuacaoObtida: number;
  pontuacaoMaxima: number;
  percentualPilar: number;
}

interface ResultadoData {
  questionarioId: number;
  dataConclusao: string;
  pontuacaoTotal: number;
  percentualGlobal: number;
  classificacao: string;
  detalhesPilares: DetalhePilar[];
}

const PILAR_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
];

const Resultado: React.FC = () => {
  const navigate = useNavigate();
  const { questionarioId } = useParams();
  const [resultadoData, setResultadoData] = useState<ResultadoData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/questionario/status")
      .then((res) => {
        if (res.data?.resultadoAnterior) {
          setResultadoData(res.data.resultadoAnterior);
        } else {
          setResultadoData(null);
        }
      })
      .catch(() => {
        setError("Erro ao buscar o último resultado.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    if (!questionarioId) return;

    api
      .get(`/questionario/resultado/${questionarioId}`)
      .then((res) => setResultadoData(res.data.resultado))
      .catch(() => setResultadoData(null));
  }, [questionarioId]);

  const chartData = useMemo(() => {
    if (!resultadoData) return [];

    return resultadoData.detalhesPilares.map((pilar, index) => ({
      name: pilar.nome,
      value: pilar.percentualPilar,
      fill: PILAR_COLORS[index % PILAR_COLORS.length],
      fullMark: 100,
    }));
  }, [resultadoData]);

  if (loading) {
    return <Loading />;
  }

  if (error || !resultadoData) {
    return (
      <Container>
        <h1 className="non-resultados-title">Sem resultados disponíveis</h1>
        <p className="non-resultados-description">
          Você ainda não concluiu o questionário ou não há resultados para
          exibir.
        </p>
        <Button
          onClick={() => navigate("/questionario")}
          variant="primary"
          label="Responder Questionário"
        />
      </Container>
    );
  }

  const { percentualGlobal, classificacao, dataConclusao } = resultadoData;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Container>
      <BackButton />
      <h1 className="resultados-title">Seu Ritual de Florescimento WHIM</h1>
      <p className="resultados-subtitle">
        Concluído em: {formatDate(dataConclusao)}
      </p>
      <div
        className={`card global-summary-card ${classificacao
          .toLowerCase()
          .replace(" ", "-")}`}
      >
        <p className="summary-label">Sua Classificação Atual:</p>
        <h2 className="classificacao">{classificacao}</h2>
        <div className="global-score">
          <span className="score-number">{percentualGlobal.toFixed(0)}%</span>
          <span className="score-label">do Potencial Máximo</span>
        </div>
      </div>
      <h3 className="section-title">Performance por Pilar</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart
            innerRadius="20%"
            outerRadius="80%"
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              label={{
                position: "insideStart",
                fill: "#fff",
                fontSize: "9px",
                offset: 10,
              }}
              background
              dataKey="value"
            />
            <Legend
              iconSize={10}
              layout="vertical"
              verticalAlign="top"
              align="left"
              wrapperStyle={{
                paddingLeft: "0px",
                fontSize: "10px",
                lineHeight: "15px",
              }}
            />
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <h3 className="section-title">Detalhe das Pontuações</h3>
      <div className="pillar-details-table">
        <table>
          <thead>
            <tr>
              <th>Pilar</th>
              <th>Score Obtido</th>
              <th>Score Máximo</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {resultadoData.detalhesPilares.map((pilar) => (
              <tr key={pilar.nome}>
                <td data-label="Pilar">{pilar.nome}</td>
                <td data-label="Score Obtido">{pilar.pontuacaoObtida}</td>
                <td data-label="Score Máximo">{pilar.pontuacaoMaxima}</td>
                <td data-label="%">{pilar.percentualPilar.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
};

export default Resultado;
