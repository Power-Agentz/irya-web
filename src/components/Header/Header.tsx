import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo-irya.png";
import { useAuth } from "../../hooks/useAuth";
import { useQuestionarioStatus } from "../../hooks/useQuestionarioStatus";
import {
  FiBarChart2,
  FiClipboard,
  FiCreditCard,
  FiHome,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { GiFlowerPot } from "react-icons/gi";
import {
  getPacientePrimeiroNome,
  isPacienteSubscriber,
} from "../../utils/session";
import PremiumBadge from "../PremiumBadge/PremiumBadge";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const authenticated = isAuthenticated();
  const { status } = useQuestionarioStatus(authenticated);
  const nome = getPacientePrimeiroNome();
  const subscriber = isPacienteSubscriber();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const podeResponder = status?.podeResponder === true;
  const possuiResultadoAnterior = Boolean(status?.resultadoAnterior);
  const isHome = location.pathname === "/inicio";
  const isQuestionario = location.pathname === "/questionario";
  const isResultado = location.pathname === "/resultado";
  const isAssinatura = location.pathname === "/assinatura";

  const navItems = useMemo(() => {
    const questionnaireOrResultItem = possuiResultadoAnterior
      ? {
          label: "Resultado",
          icon: FiBarChart2,
          path: "/resultado",
          visible: true,
          active: isResultado,
        }
      : {
          label: "Avaliação",
          icon: FiClipboard,
          path: "/questionario",
          visible: podeResponder,
          active: isQuestionario,
        };

    return [
      {
        label: "Início",
        icon: FiHome,
        path: "/inicio",
        visible: true,
        active: isHome,
      },
      questionnaireOrResultItem,
      {
        label: "Assinatura",
        icon: FiCreditCard,
        path: "/assinatura",
        visible: true,
        active: isAssinatura,
      },
    ];
  }, [
    isHome,
    isQuestionario,
    isResultado,
    isAssinatura,
    podeResponder,
    possuiResultadoAnterior,
  ]);

  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  if (!authenticated) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-[#f1e3b9] bg-[#fffaf1]/88 backdrop-blur-xl">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-5 py-3 sm:px-8 md:px-10 lg:px-12">
        <Link to="/inicio" className="shrink-0">
          <img
            className="h-[52px] w-auto sm:h-[56px]"
            src={logo}
            alt="Logo da Irya"
            width={7656}
            height={3616}
          />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-[#f1e3b9] bg-white/85 p-1.5 shadow-[0_4px_16px_rgba(74,93,79,0.15)] lg:flex">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
                    item.active
                      ? "bg-[#3a4d3f] text-white shadow-[0_8px_18px_rgba(74,93,79,0.24)]"
                      : "text-[#4a5d4f] hover:bg-[#f7f1df]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
        </nav>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#f1e3b9] bg-white/92 p-0 text-[#4a5d4f] shadow-[0_4px_16px_rgba(74,93,79,0.15)] transition hover:border-[#e4c884] hover:bg-white lg:h-10 lg:w-10"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            {menuOpen ? (
              <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <FiMenu className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-[80] mt-2 w-64 overflow-hidden rounded-[24px] border border-[#f1e3b9] bg-[#fffefb]/95 p-1.5 shadow-[0_12px_34px_rgba(74,93,79,0.18)] backdrop-blur-md"
            >
              <div className="mb-1 rounded-[18px] border border-[#f1e3b9] bg-[#fbf7ee] px-3 py-2">
                <p className="text-[10px] tracking-[0.14em] text-[#7c9d72]">
                  Olá,
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#4a5d4f]">
                    {nome ? nome : "Paciente"}
                  </p>
                  {subscriber && <PremiumBadge size="sm" />}
                </div>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate("/inicio")}
                className="flex w-full items-center gap-2 rounded-[18px] px-3 py-2.5 text-left text-sm font-medium text-[#4a5d4f] transition hover:bg-[#fbf7ee]"
              >
                <FiHome className="h-4 w-4" />
                Início
              </button>

              {!possuiResultadoAnterior && podeResponder && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate("/questionario")}
                  className="flex w-full items-center gap-2 rounded-[18px] px-3 py-2.5 text-left text-sm font-medium text-[#4a5d4f] transition hover:bg-[#fbf7ee]"
                >
                  <FiClipboard className="h-4 w-4" />
                  Avaliação
                </button>
              )}

              {possuiResultadoAnterior && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate("/resultado")}
                  className="flex w-full items-center gap-2 rounded-[18px] px-3 py-2.5 text-left text-sm font-medium text-[#4a5d4f] transition hover:bg-[#fbf7ee]"
                >
                  <FiBarChart2 className="h-4 w-4" />
                  Resultado
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate("/assinatura")}
                className="flex w-full items-center gap-2 rounded-[18px] px-3 py-2.5 text-left text-sm font-medium text-[#4a5d4f] transition hover:bg-[#fbf7ee]"
              >
                <FiCreditCard className="h-4 w-4" />
                {subscriber ? "Minha assinatura" : "Assinatura"}
              </button>

              <button
                type="button"
                role="menuitem"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-between rounded-[18px] px-3 py-2.5 text-left text-sm text-[#8da399] opacity-75"
                title="Em breve"
              >
                <span className="inline-flex items-center gap-2">
                  <GiFlowerPot className="h-4 w-4" />
                  Jardim
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide">
                  (em breve)
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-[18px] px-3 py-2.5 text-left text-sm font-medium text-[#4a5d4f] transition hover:bg-[#fbf7ee]"
              >
                <FiLogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default Header;
