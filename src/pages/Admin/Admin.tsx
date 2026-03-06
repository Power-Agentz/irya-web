import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api";
import {
  FiArrowLeft,
  FiFilter,
  FiLock,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTrendingUp,
  FiUserCheck,
  FiUserMinus,
  FiUsers,
} from "react-icons/fi";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import logoIrya from "../../../assets/logo-irya.png";

type AdminOverview = {
  totalPacientes: number;
  totalQuestionarios: number;
  totalRespostas: number;
  totalAssinantesAtivos: number;
};

type AdminPaciente = {
  telefone: string;
  nomeCompleto: string;
  alturaM: number | null;
  dataCadastro: string;
  isSubscriber: boolean;
  subscriptionStartedAt: string | null;
  subscriptionCanceledAt: string | null;
};

type AdminPontuacaoPilar = {
  pilar: {
    nomePilar: string;
    pontuacaoMaxima: number;
  };
  pontuacaoObtida: number;
};

type AdminQuestionarioDetalhe = {
  id: number;
  dataConclusao: string;
  pontuacaoTotal: number;
  percentualGlobal: number;
  classificacao: string;
  pontuacoes: AdminPontuacaoPilar[];
};

type AdminAnswer = {
  id: number;
  questionarioConcluidoId: number | null;
  questionText: string;
  answerValue: number;
  pilarCategory: string;
  createdAt: string;
};

type AdminPeso = {
  id: number;
  pesoKg: number;
  imc: number | null;
  dataRegistro: string;
};

type AdminPacienteDetalhes = {
  telefone: string;
  nomeCompleto: string;
  alturaM: number | null;
  dataCadastro: string;
  isSubscriber: boolean;
  subscriptionStartedAt: string | null;
  subscriptionCanceledAt: string | null;
  historicoPesos: AdminPeso[];
  questionariosConcluidos: AdminQuestionarioDetalhe[];
  answers: AdminAnswer[];
};

const ADMIN_KEY_STORAGE = "irya_admin_access_key";
type SubscriberFilter = "all" | "free" | "subscriber";
type SortMode = "cadastro_desc" | "cadastro_asc" | "nome_asc" | "nome_desc";

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatHeight = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(2).replace(".", ",")} m`;
};

const formatImc = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(1).replace(".", ",");
};

const Admin = () => {
  const [adminKeyInput, setAdminKeyInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [restoreChecked, setRestoreChecked] = useState(false);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [pacientes, setPacientes] = useState<AdminPaciente[]>([]);

  const [selectedPacienteDetalhes, setSelectedPacienteDetalhes] = useState<AdminPacienteDetalhes | null>(null);
  const [selectedQuestionarioId, setSelectedQuestionarioId] = useState<number | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [subscriberFilter, setSubscriberFilter] = useState<SubscriberFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("cadastro_desc");
  const [deletingPhone, setDeletingPhone] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminPaciente | null>(null);

  const headers = useMemo(
    () => ({ "x-admin-key": adminKeyInput.trim() }),
    [adminKeyInput],
  );

  const fetchAdminData = useCallback(async () => {
    if (!adminKeyInput.trim()) {
      setError("Informe a chave de acesso.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [overviewRes, pacientesRes] = await Promise.all([
        api.get<AdminOverview>("/admin/overview", { headers }),
        api.get<AdminPaciente[]>("/admin/pacientes", { headers }),
      ]);

      setOverview(overviewRes.data);
      setPacientes(pacientesRes.data);
      setIsUnlocked(true);
      localStorage.setItem(ADMIN_KEY_STORAGE, adminKeyInput.trim());
    } catch {
      setError("Acesso inválido ou indisponível no momento.");
      setIsUnlocked(false);
      localStorage.removeItem(ADMIN_KEY_STORAGE);
    } finally {
      setLoading(false);
    }
  }, [adminKeyInput, headers]);

  useEffect(() => {
    if (restoreChecked) return;
    setRestoreChecked(true);

    if (adminKeyInput.trim()) {
      void fetchAdminData();
    }
  }, [adminKeyInput, fetchAdminData, restoreChecked]);

  const loadPacienteDetalhes = useCallback(
    async (phone: string) => {
      setSelectedQuestionarioId(null);
      setDetailsLoading(true);
      setError(null);

      try {
        const response = await api.get<AdminPacienteDetalhes>(`/admin/pacientes/${phone}`, {
          headers,
        });
        setSelectedPacienteDetalhes(response.data);
      } catch {
        setError("Não foi possível carregar os detalhes do paciente.");
      } finally {
        setDetailsLoading(false);
      }
    },
    [headers],
  );

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    setIsUnlocked(false);
    setOverview(null);
    setPacientes([]);
    setSelectedPacienteDetalhes(null);
    setSelectedQuestionarioId(null);
    setError(null);
    setAdminKeyInput("");
  };

  const allPilares = useMemo(() => {
    if (!selectedPacienteDetalhes) return [];
    const names = new Set<string>();
    selectedPacienteDetalhes.questionariosConcluidos.forEach((q) => {
      q.pontuacoes.forEach((p) => names.add(p.pilar.nomePilar));
    });
    return Array.from(names);
  }, [selectedPacienteDetalhes]);

  const selectedQuestionarioAnswers = useMemo(() => {
    if (!selectedPacienteDetalhes || !selectedQuestionarioId) return [];
    return selectedPacienteDetalhes.answers.filter(
      (ans) => ans.questionarioConcluidoId === selectedQuestionarioId,
    );
  }, [selectedPacienteDetalhes, selectedQuestionarioId]);

  const pesoChartData = useMemo(() => {
    if (!selectedPacienteDetalhes) return [];

    return [...selectedPacienteDetalhes.historicoPesos]
      .sort(
        (a, b) => new Date(a.dataRegistro).getTime() - new Date(b.dataRegistro).getTime(),
      )
      .map((peso) => ({
        id: peso.id,
        pesoKg: peso.pesoKg,
        data: new Date(peso.dataRegistro).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
      }));
  }, [selectedPacienteDetalhes]);

  const imcAtual = selectedPacienteDetalhes?.historicoPesos?.[0]?.imc ?? null;

  const filteredPacientes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = pacientes.filter((paciente) => {
      const byFilter =
        subscriberFilter === "all" ||
        (subscriberFilter === "subscriber" && paciente.isSubscriber) ||
        (subscriberFilter === "free" && !paciente.isSubscriber);

      if (!byFilter) return false;
      if (!search) return true;

      return (
        paciente.nomeCompleto.toLowerCase().includes(search) ||
        paciente.telefone.includes(search)
      );
    });

    return filtered.sort((a, b) => {
      if (sortMode === "cadastro_desc") {
        return new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime();
      }
      if (sortMode === "cadastro_asc") {
        return new Date(a.dataCadastro).getTime() - new Date(b.dataCadastro).getTime();
      }
      if (sortMode === "nome_asc") {
        return a.nomeCompleto.localeCompare(b.nomeCompleto, "pt-BR");
      }
      return b.nomeCompleto.localeCompare(a.nomeCompleto, "pt-BR");
    });
  }, [pacientes, searchTerm, sortMode, subscriberFilter]);

  const cycleFilter = () => {
    setSubscriberFilter((current) => {
      if (current === "all") return "free";
      if (current === "free") return "subscriber";
      return "all";
    });
  };

  const cycleSort = () => {
    setSortMode((current) => {
      if (current === "cadastro_desc") return "cadastro_asc";
      if (current === "cadastro_asc") return "nome_asc";
      if (current === "nome_asc") return "nome_desc";
      return "cadastro_desc";
    });
  };

  const filterLabel =
    subscriberFilter === "all"
      ? "Todos"
      : subscriberFilter === "free"
        ? "Somente gratuitos"
        : "Somente assinantes";

  const sortLabel =
    sortMode === "cadastro_desc"
      ? "Cadastro: mais recentes"
      : sortMode === "cadastro_asc"
        ? "Cadastro: mais antigos"
        : sortMode === "nome_asc"
          ? "Nome: A-Z"
          : "Nome: Z-A";

  const handleDeletePaciente = async () => {
    if (!deleteCandidate) return;

    const phone = deleteCandidate.telefone;
    setDeletingPhone(phone);
    setError(null);
    try {
      await api.delete(`/admin/pacientes/${phone}`, { headers });
      setPacientes((current) => current.filter((paciente) => paciente.telefone !== phone));
      setDeleteCandidate(null);
      await fetchAdminData();
    } catch {
      setError("Não foi possível excluir o cadastro.");
    } finally {
      setDeletingPhone(null);
    }
  };

  if (!isUnlocked) {
    return (
      <main className="relative min-h-dvh w-full overflow-hidden bg-[radial-gradient(1200px_640px_at_10%_-6%,rgba(136,156,117,0.26),transparent_58%),radial-gradient(980px_560px_at_96%_100%,rgba(180,157,114,0.18),transparent_63%),linear-gradient(180deg,#243629_0%,#1e2f24_52%,#17261d_100%)] text-[#334234]">
        <section className="mx-auto flex min-h-dvh w-full max-w-[1180px] items-center justify-center px-5 py-8 sm:px-8">
          <article className="w-full max-w-[560px] rounded-[32px] border border-white/70 bg-white/92 p-7 shadow-[0_30px_70px_rgba(45,57,39,0.16)] backdrop-blur sm:p-10">
            <img
              src={logoIrya}
              alt="Logo Minha Irya"
              width={7656}
              height={3616}
              className="h-14 w-auto"
            />
            <div className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff4e8] text-[#5a6d4f]">
              <FiLock className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7a62]">
              Acesso interno protegido
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#374633] sm:text-4xl">
              Dashboard Irya
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#5d6c57] sm:text-base">
              Use a chave da equipe para liberar o ambiente administrativo.
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="Insira a chave de acesso"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void fetchAdminData();
                  }
                }}
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
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f4f7f2] text-[#2f3b2f] w-full">
      <header className="border-b border-[#dbe2d2] bg-white">
        <div className="mx-auto flex w-[90%] items-center justify-between gap-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7a62]">
             Painel de visualização interno para o time WHIM
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#394836]">Dashboard Irya</h1>
          </div>
          <div className="flex flex-col items-center gap-2 md:flex-row">
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

        {overview && (
          <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-xl border border-[#d7e1cc] bg-white p-4 shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f7252]">
                <FiUsers className="h-4 w-4" /> Usuários
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#344531]">{overview.totalPacientes}</p>
            </article>
            <article className="rounded-xl border border-[#d7e1cc] bg-white p-4 shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f7252]">
                <FiUserMinus className="h-4 w-4" />
                Usuários gratuitos
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#344531]">
                {Math.max(overview.totalPacientes - overview.totalAssinantesAtivos, 0)}
              </p>
            </article>
            <article className="rounded-xl border border-[#d7e1cc] bg-white p-4 shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5f7252]">
                <FiUserCheck className="h-4 w-4" />
                Usuários assinantes
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#344531]">{overview.totalAssinantesAtivos}</p>
            </article>
          </section>
        )}

        {!selectedPacienteDetalhes && (
          <section className="rounded-2xl border border-[#d7e1cc] bg-white shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
            <div className="border-b border-[#ebf0e3] p-4">
              <h2 className="text-lg font-semibold text-[#394836]">Lista de Cadastros</h2>
              <p className="mt-1 text-sm text-[#62725a]">
                Clique em uma linha para abrir os detalhes completos do paciente.
              </p>
              <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center">
                <label className="relative w-full lg:max-w-sm">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758468]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou telefone"
                    className="h-10 w-full rounded-lg border border-[#d5decb] bg-[#fafcf8] pl-9 pr-3 text-sm text-[#334234] outline-none transition focus:border-[#96a88b] focus:ring-2 focus:ring-[#a5b798]/30"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={cycleFilter}
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#d0dac4] bg-[#f6faf1] px-3 text-sm font-medium text-[#495a42] transition hover:bg-[#edf4e4]"
                  >
                    <FiFilter className="h-4 w-4" />
                    {filterLabel}
                  </button>
                  <button
                    type="button"
                    onClick={cycleSort}
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#d0dac4] bg-[#f6faf1] px-3 text-sm font-medium text-[#495a42] transition hover:bg-[#edf4e4]"
                  >
                    <FiTrendingUp className="h-4 w-4" />
                    {sortLabel}
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="text-[#687a5e]">
                  <tr>
                    <th className="pb-2">Nome</th>
                    <th className="pb-2">Telefone</th>
                    <th className="pb-2">Altura</th>
                    <th className="pb-2">Data de Cadastro</th>
                    <th className="pb-2">Assinatura (S/N)</th>
                    <th className="pb-2">Data de Assinatura</th>
                    <th className="pb-2">Data de Cancelamento</th>
                    <th className="pb-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPacientes.length === 0 && (
                    <tr>
                      <td className="py-3 text-[#6f7c66]" colSpan={8}>
                        Nenhum cadastro encontrado com os filtros atuais.
                      </td>
                    </tr>
                  )}
                  {filteredPacientes.map((p) => (
                    <tr
                      key={p.telefone}
                      onClick={() => void loadPacienteDetalhes(p.telefone)}
                      className="cursor-pointer border-t border-[#edf2e7] text-[#2f3d2d] transition hover:bg-[#f5f9f0]"
                    >
                      <td className="py-2">{p.nomeCompleto}</td>
                      <td className="py-2">{p.telefone}</td>
                      <td className="py-2">{formatHeight(p.alturaM)}</td>
                      <td className="py-2">{formatDate(p.dataCadastro)}</td>
                      <td className="py-2">{p.isSubscriber ? "S" : "N"}</td>
                      <td className="py-2">{formatDate(p.subscriptionStartedAt)}</td>
                      <td className="py-2">{formatDate(p.subscriptionCanceledAt)}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteCandidate(p);
                          }}
                          disabled={deletingPhone === p.telefone}
                          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-[#efc0c0] bg-[#fff2f2] px-2 text-xs font-semibold text-[#9b3131] transition hover:bg-[#ffe6e6] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                          {deletingPhone === p.telefone ? "Excluindo..." : "Excluir"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {selectedPacienteDetalhes && (
          <section className="rounded-2xl border border-[#d7e1cc] bg-white shadow-[0_8px_20px_rgba(43,52,37,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebf0e3] p-4">
              <div>
                <h2 className="text-lg font-semibold text-[#394836]">
                  Detalhes: {selectedPacienteDetalhes.nomeCompleto}
                </h2>
                <p className="text-sm text-[#62725a]">{selectedPacienteDetalhes.telefone}</p>
                <p className="mt-1 text-sm text-[#62725a]">
                  Altura: {formatHeight(selectedPacienteDetalhes.alturaM)} | IMC atual:{" "}
                  {formatImc(imcAtual)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPacienteDetalhes(null);
                  setSelectedQuestionarioId(null);
                }}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#ccd6bf] bg-[#f7faf3] px-3 text-sm font-medium text-[#4d5c45] transition hover:bg-[#edf3e6]"
              >
                <FiArrowLeft className="h-4 w-4" />
                Voltar para cadastros
              </button>
            </div>

            {detailsLoading && (
              <p className="p-4 text-sm text-[#62725a]">Carregando detalhes...</p>
            )}

            {!detailsLoading && (
              <div className="grid gap-5 p-4">
                <article className="rounded-xl border border-[#e4eadc] bg-[#f9fcf6] p-4">
                  <h3 className="text-base font-semibold text-[#394836]">Histórico de Pesos</h3>
                  {pesoChartData.length > 0 && (
                    <div className="mt-4 h-56 w-full rounded-lg border border-[#e5ecdd] bg-white p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pesoChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid stroke="#e9efe2" strokeDasharray="3 3" />
                          <XAxis dataKey="data" stroke="#72826a" tick={{ fontSize: 12 }} />
                          <YAxis
                            dataKey="pesoKg"
                            stroke="#72826a"
                            tick={{ fontSize: 12 }}
                            width={42}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 10,
                              border: "1px solid #d8e2cd",
                              backgroundColor: "#ffffff",
                            }}
                            labelStyle={{ color: "#52624c", fontWeight: 600 }}
                            formatter={(value: number) => [`${value.toFixed(1)} kg`, "Peso"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="pesoKg"
                            stroke="#7f926f"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#5f7252" }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-sm">
                      <thead className="text-[#687a5e]">
                        <tr>
                          <th className="pb-2">Data</th>
                          <th className="pb-2">Peso (kg)</th>
                          <th className="pb-2">IMC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPacienteDetalhes.historicoPesos.length === 0 && (
                          <tr>
                            <td className="py-2 text-[#6f7c66]" colSpan={3}>
                              Sem registros de peso.
                            </td>
                          </tr>
                        )}
                        {selectedPacienteDetalhes.historicoPesos.map((peso) => (
                          <tr key={peso.id} className="border-t border-[#edf2e7] text-[#2f3d2d]">
                            <td className="py-2">{formatDateTime(peso.dataRegistro)}</td>
                            <td className="py-2">{peso.pesoKg.toFixed(1)}</td>
                            <td className="py-2">{formatImc(peso.imc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="rounded-xl border border-[#e4eadc] bg-[#f9fcf6] p-4">
                  <h3 className="text-base font-semibold text-[#394836]">Avaliações Concluídas</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left text-sm">
                      <thead className="text-[#687a5e]">
                        <tr>
                          <th className="pb-2">Avaliação</th>
                          <th className="pb-2">Data de Resposta</th>
                          <th className="pb-2">Pontuação Total</th>
                          {allPilares.map((pilar) => (
                            <th key={pilar} className="pb-2">
                              {pilar}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPacienteDetalhes.questionariosConcluidos.length === 0 && (
                          <tr>
                            <td className="py-2 text-[#6f7c66]" colSpan={3 + allPilares.length}>
                              Sem avaliações concluídas.
                            </td>
                          </tr>
                        )}
                        {selectedPacienteDetalhes.questionariosConcluidos.map((q, index) => (
                          <tr
                            key={q.id}
                            onClick={() => setSelectedQuestionarioId(q.id)}
                            className={`cursor-pointer border-t border-[#edf2e7] text-[#2f3d2d] transition hover:bg-[#f2f7ed] ${
                              selectedQuestionarioId === q.id ? "bg-[#edf4e6]" : ""
                            }`}
                          >
                            <td className="py-2">{`Avaliação ${index + 1}`}</td>
                            <td className="py-2">{formatDateTime(q.dataConclusao)}</td>
                            <td className="py-2">{q.pontuacaoTotal}</td>
                            {allPilares.map((pilar) => {
                              const pilarData = q.pontuacoes.find(
                                (p) => p.pilar.nomePilar === pilar,
                              );
                              return (
                                <td key={`${q.id}-${pilar}`} className="py-2">
                                  {pilarData ? `${pilarData.pontuacaoObtida}` : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                {selectedQuestionarioId && (
                  <article className="rounded-xl border border-[#e4eadc] bg-[#f9fcf6] p-4">
                    <h3 className="text-base font-semibold text-[#394836]">
                      Respostas da Avaliação {selectedQuestionarioId}
                    </h3>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[980px] text-left text-sm">
                        <thead className="text-[#687a5e]">
                          <tr>
                            <th className="pb-2">Data</th>
                            <th className="pb-2">Pilar</th>
                            <th className="pb-2">Pergunta</th>
                            <th className="pb-2">Resposta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedQuestionarioAnswers.length === 0 && (
                            <tr>
                              <td className="py-2 text-[#6f7c66]" colSpan={4}>
                                Sem respostas associadas para esta avaliação.
                              </td>
                            </tr>
                          )}
                          {selectedQuestionarioAnswers.map((answer) => (
                            <tr key={answer.id} className="border-t border-[#edf2e7] text-[#2f3d2d]">
                              <td className="py-2">{formatDateTime(answer.createdAt)}</td>
                              <td className="py-2">{answer.pilarCategory}</td>
                              <td className="py-2">{answer.questionText}</td>
                              <td className="py-2">{answer.answerValue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {deleteCandidate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1f2a20]/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-[#e5cbc9] bg-white p-5 shadow-[0_20px_50px_rgba(35,39,32,0.28)]">
            <h3 className="text-lg font-semibold text-[#3c4a39]">Excluir cadastro</h3>
            <p className="mt-2 text-sm text-[#5f6b5c]">
              Você está prestes a excluir <strong>{deleteCandidate.nomeCompleto}</strong> (
              {deleteCandidate.telefone}). Esta ação remove também histórico de pesos, avaliações e
              respostas.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={!!deletingPhone}
                className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[#d6decb] bg-[#f8fbf5] px-3 text-sm font-medium text-[#4f5e49] transition hover:bg-[#eef4e8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDeletePaciente()}
                disabled={!!deletingPhone}
                className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[#efc0c0] bg-[#fff1f1] px-3 text-sm font-semibold text-[#9b3131] transition hover:bg-[#ffe4e4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingPhone ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Admin;
