import Container from "../../components/Container/Container";
import Button from "../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useQuestionarioStatus } from "../../hooks/useQuestionarioStatus";
import "./Home.css";
import Loading from "../../components/Loading/Loading";

const Home = () => {
  const navigate = useNavigate();

  const pacienteRaw = localStorage.getItem("pacienteData");
  const paciente = pacienteRaw ? JSON.parse(pacienteRaw) : null;
  const nome = paciente?.nomeSocialApelido || paciente?.nome || "";

  const { status, loading } = useQuestionarioStatus();

  if (loading) return <Loading />;

  const podeResponder = status?.podeResponder;

  return (
    <Container>
      <p className="home-title">{nome ? `Olá, ${nome}!` : "Olá!"}</p>

      <section className="home-content">
        {podeResponder ? (
          <>
            <header className="home-header">
              <h1 className="home-subtitle">
                Sou a <strong>Irya</strong>
              </h1>
              <h2 className="home-description">
                Meu objetivo é te ajudar a entender melhor seu perfil por meio
                de uma avaliação simples e personalizada.
              </h2>
            </header>
            <p className="home-message">
              Para isso, responda um breve questionário. Com base nas suas
              respostas, conseguirei gerar uma análise mais precisa para você.
            </p>

            <div className="home-actions">
              <Button
                onClick={() => navigate("/questionario")}
                variant="primary"
                label="Iniciar questionário"
              />

              <button
                className="home-secondary-link"
                onClick={() => navigate("/resultado")}
              >
                Ver meu resultado anterior
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="home-message">
              Percebi que você já respondeu ao questionário recentemente. Para
              manter a precisão da avaliação, é necessário aguardar um período
              antes de responder novamente.
            </p>

            <div className="home-actions">
              <Button
                onClick={() => navigate("/resultado")}
                variant="primary"
                label="Ver meu resultado"
              />
            </div>
          </>
        )}
      </section>

      {podeResponder && (
        <p className="home-helper">⏱ Leva menos de 5 minutos</p>
      )}
    </Container>
  );
};

export default Home;
