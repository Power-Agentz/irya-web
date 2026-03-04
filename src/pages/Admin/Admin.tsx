import { useCallback, useMemo, useState } from "react";
import api from "../../api";
import { FiBarChart2, FiClipboard, FiDatabase, FiKey, FiLogOut, FiRefreshCw, FiUsers } from "react-icons/fi";

type AdminOverview = {
  totalPacientes: number;
  totalQuestionarios: number;
  totalRespostas: number;
  totalAssinantesAtivos: number;
};

type AdminPaciente = {
  telefone: string;
  nomeCompleto: string;
  dataCadastro: string;
  isSubscriber: boolean;
  metricas: {
    questionariosConcluidos: number;
    respostasRegistradas: number;
    registrosDePeso: number;
  };
};

type AdminQuestionario = {
  id: number;
  dataConclusao: string;
  pacienteTelefone: string;
  pacienteNome: string | null;
  pontuacaoTotal: number;
  percentualGlobal: number;
  classificacao: string;
};

type AdminPontuacao = {
  id: number;
  pilar: string;
  pontuacaoObtida: number;
  pontuacaoMaxima: number;
  questionarioId: number;
  dataConclusao: string;
  pacienteTelefone: string;
};

type DashboardTab = "patients" | "questionnaires" | "scores";

const ADMIN_KEY_STORAGE = "irya_admin_access_key";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const Admin = () => {
  const [adminKeyInput, setAdminKeyInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
  });
  const [activeTab, setActiveTab] = useState<DashboardTab>("patients");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [pacientes, setPacientes] = useState<AdminPaciente[]>([]);
  const [questionarios, setQuestionarios] = useState<AdminQuestionario[]>([]);
  const [pontuacoes, setPontuacoes] = useState<AdminPontuacao[]>([]);

  const hasData = useMemo(
    () => Boolean(overview || pacientes.length || questionarios.length || pontuacoes.length),
    [overview, pacientes.length, questionarios.length, pontuacoes.length],
  );

  const fetchAdminData = useCallback(async () => {
    if (!adminKeyInput.trim()) {
      setError("Informe a chave de acesso.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = { "x-admin-key": adminKeyInput.trim() };
      const [overviewRes, pacientesRes, questionariosRes, pontuacoesRes] =
        await Promise.all([
          api.get<AdminOverview>("/admin/overview", { headers }),
          api.get<AdminPaciente[]>("/admin/pacientes", { headers }),
          api.get<AdminQuestionario[]>("/admin/questionarios-concluidos", { headers }),
          api.get<AdminPontuacao[]>("/admin/pontuacoes", { headers }),
        ]);

      setOverview(overviewRes.data);
      setPacientes(pacientesRes.data);
      setQuestionarios(questionariosRes.data);
      setPontuacoes(pontuacoesRes.data);
      setIsUnlocked(true);
      sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKeyInput.trim());
    } catch {
      setError("Acesso inválido ou indisponível no momento.");
      setIsUnlocked(false);
    } finally {
      setLoading(false);
    }
  }, [adminKeyInput]);

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setIsUnlocked(false);
    setOverview(null);
    setPacientes([]);
    setQuestionarios([]);
    setPontuacoes([]);
    setError(null);
    setAdminKeyInput("");
  };

  if (!isUnlocked) {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-[#eef3ea] text-[#334234]">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#b8c8a8]/30 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#d8c7a2]/30 blur-3xl" />

        <section className="mx-auto flex min-h-dvh w-full max-w-[980px] items-center px-5 py-8 sm:px-8">
          <div className="grid w-full gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="hidden rounded-3xl border border-white/60 bg-white/55 p-8 shadow-[0_20px_45px_rgba(43,52,37,0.10)] backdrop-blur-sm lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f7d63]">
                Acesso interno à Irya 
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.15] text-[#394836]">
                ADMIN
              </h1>
              <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-[#5e6a58]">
                Ambiente interno para monitorar cadastros, performance dos questionários e evolução por pilar.
              </p>
            </article>

            <article className="rounded-3xl border border-white/70 bg-white p-6 shadow-[0_20px_45px_rgba(43,52,37,0.14)] sm:p-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff4e8] text-[#5a6d4f]">
                <FiKey className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-[#384835]">Admin Login</h2>
              <p className="mt-1 text-sm text-[#66705f]">
                Insira a chave de acesso do time Irya.
              </p>

              <div className="mt-6 space-y-3">
                <input
                  type="password"
                  placeholder="Admin access key"
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#d5ddca] bg-[#fafcf7] px-4 text-sm text-[#2f3c2c] outline-none transition focus:border-[#8da183] focus:ring-2 focus:ring-[#a5b798]/30"
                />
                <button
                  type="button"
                  onClick={() => void fetchAdminData()}
                  disabled={loading}
                  className="h-12 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#87967a] to-[#758766] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(62,79,50,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Validando..." : "Entrar no dashboard"}
                </button>
              </div>

              {error && (
                <p className="mt-4 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-3 text-sm font-medium text-[#b91c1c]">
                  {error}
                </p>
              )}
            </article>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f4f7f2] text-[#2f3b2f]">
      <header className="border-b border-[#dbe2d2] bg-white">
        <div className="mx-auto flex w-[90%] items-center justify-between gap-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7a62]">
              Irya Internal Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#394836]">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchAdminData()}
              disabled={loading}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#ccd6bf] bg-[#f7faf3] px-3 text-sm font-medium text-[#4d5c45] transition hover:bg-[#edf3e6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#e5c7c7] bg-[#fff5f5] px-3 text-sm font-medium text-[#9b3131] transition hover:bg-[#ffeaea]"
            >
              <FiLogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-[90%] py-5">
        {error && (
          <div className="mb-4 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-3 text-sm font-medium text-[#b91c1c]">
            {error}
          </div>
        )}

        {hasData && overview && (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <article className="rounded-xl border border-[#d7e1cc] bg-white p-4 shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f7252]">
                  <FiUsers className="h-4 w-4" /> Pacientes
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#344531]">{overview.totalPacientes}</p>
              </article>
              <article className="rounded-xl border border-[#d7e1cc] bg-white p-4 shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f7252]">
                  <FiClipboard className="h-4 w-4" /> Questionários
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#344531]">{overview.totalQuestionarios}</p>
              </article>
              <article className="rounded-xl border border-[#d7e1cc] bg-white p-4 shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f7252]">
                  <FiDatabase className="h-4 w-4" /> Respostas
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#344531]">{overview.totalRespostas}</p>
              </article>
              <article className="rounded-xl border border-[#d7e1cc] bg-white p-4 shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f7252]">
                  <FiBarChart2 className="h-4 w-4" /> Assinantes
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#344531]">{overview.totalAssinantesAtivos}</p>
              </article>
            </section>

            <section className="mt-5 rounded-2xl border border-[#d7e1cc] bg-white shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
              <div className="flex flex-wrap gap-2 border-b border-[#ebf0e3] p-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("patients")}
                  className={`h-9 cursor-pointer rounded-lg px-3 text-sm font-medium transition ${
                    activeTab === "patients"
                      ? "bg-[#394836] text-white"
                      : "bg-[#f4f8ef] text-[#53644b] hover:bg-[#e8f0df]"
                  }`}
                >
                  Cadastros
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("questionnaires")}
                  className={`h-9 cursor-pointer rounded-lg px-3 text-sm font-medium transition ${
                    activeTab === "questionnaires"
                      ? "bg-[#394836] text-white"
                      : "bg-[#f4f8ef] text-[#53644b] hover:bg-[#e8f0df]"
                  }`}
                >
                  Questionários
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("scores")}
                  className={`h-9 cursor-pointer rounded-lg px-3 text-sm font-medium transition ${
                    activeTab === "scores"
                      ? "bg-[#394836] text-white"
                      : "bg-[#f4f8ef] text-[#53644b] hover:bg-[#e8f0df]"
                  }`}
                >
                  Pontuações
                </button>
              </div>

              {activeTab === "patients" && (
                <div className="overflow-x-auto p-4">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="text-[#687a5e]">
                      <tr>
                        <th className="pb-2">Nome</th>
                        <th className="pb-2">Telefone</th>
                        <th className="pb-2">Cadastro</th>
                        <th className="pb-2">Assinante</th>
                        <th className="pb-2">Questionários</th>
                        <th className="pb-2">Respostas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pacientes.slice(0, 180).map((p) => (
                        <tr key={p.telefone} className="border-t border-[#edf2e7] text-[#2f3d2d]">
                          <td className="py-2">{p.nomeCompleto}</td>
                          <td className="py-2">{p.telefone}</td>
                          <td className="py-2">{formatDate(p.dataCadastro)}</td>
                          <td className="py-2">{p.isSubscriber ? "Sim" : "Não"}</td>
                          <td className="py-2">{p.metricas.questionariosConcluidos}</td>
                          <td className="py-2">{p.metricas.respostasRegistradas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "questionnaires" && (
                <div className="overflow-x-auto p-4">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="text-[#687a5e]">
                      <tr>
                        <th className="pb-2">Data</th>
                        <th className="pb-2">Paciente</th>
                        <th className="pb-2">Telefone</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">%</th>
                        <th className="pb-2">Classificação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionarios.slice(0, 200).map((q) => (
                        <tr key={q.id} className="border-t border-[#edf2e7] text-[#2f3d2d]">
                          <td className="py-2">{formatDate(q.dataConclusao)}</td>
                          <td className="py-2">{q.pacienteNome ?? "-"}</td>
                          <td className="py-2">{q.pacienteTelefone}</td>
                          <td className="py-2">{q.pontuacaoTotal}</td>
                          <td className="py-2">{q.percentualGlobal.toFixed(2)}%</td>
                          <td className="py-2">{q.classificacao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "scores" && (
                <div className="overflow-x-auto p-4">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="text-[#687a5e]">
                      <tr>
                        <th className="pb-2">Data</th>
                        <th className="pb-2">Telefone</th>
                        <th className="pb-2">Pilar</th>
                        <th className="pb-2">Pontuação</th>
                        <th className="pb-2">Máxima</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pontuacoes.slice(0, 220).map((p) => (
                        <tr key={p.id} className="border-t border-[#edf2e7] text-[#2f3d2d]">
                          <td className="py-2">{formatDate(p.dataConclusao)}</td>
                          <td className="py-2">{p.pacienteTelefone}</td>
                          <td className="py-2">{p.pilar}</td>
                          <td className="py-2">{p.pontuacaoObtida}</td>
                          <td className="py-2">{p.pontuacaoMaxima}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Admin;
