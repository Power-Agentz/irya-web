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
          label: "Questionário",
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
    <div className="sticky top-0 z-50 w-full border-b border-[#dfe6d4] bg-[#f7faf2]/88 backdrop-blur-xl">
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-5 py-3 sm:px-8 md:px-12">
        <Link to="/inicio" className="shrink-0">
          <img
            className="h-[48px] w-auto sm:h-[52px]"
            src={logo}
            alt="Logo da Irya"
          />
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-[#d7dfcb] bg-white/75 p-1.5 shadow-[0_12px_24px_rgba(35,46,28,0.08)] lg:flex">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-medium transition ${
                    item.active
                      ? "bg-[#8da07f] text-white shadow-[0_8px_16px_rgba(79,102,64,0.26)]"
                      : "text-[#4e5f43] hover:bg-[#f1f6ea]"
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
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-[#d4dccc] bg-[#fffdfa]/90 p-0 text-[#5f6f52] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition hover:border-[#b9c5ac] hover:bg-white lg:h-10 lg:w-10"
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
              className="absolute right-0 z-[80] mt-2 w-64 overflow-hidden rounded-2xl border border-[#d8d2c7] bg-[#fffdfa]/95 p-1.5 shadow-[0_12px_34px_rgb(0,0,0,0.12)] backdrop-blur-md"
            >
              <div className="mb-1 rounded-xl border border-[#e2e8d8] bg-[#f6f9f1] px-3 py-2">
                <p className="text-[10px] tracking-[0.14em] text-[#7a876f]">
                  Olá,
                </p>
                <p className="text-sm font-semibold text-[#46563c]">
                  {nome ? nome : "Paciente"}
                </p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate("/inicio")}
                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#4f5f43] transition hover:bg-[#f3f6ed]"
              >
                <FiHome className="h-4 w-4" />
                Início
              </button>

              {!possuiResultadoAnterior && podeResponder && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate("/questionario")}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#4f5f43] transition hover:bg-[#f3f6ed]"
                >
                  <FiClipboard className="h-4 w-4" />
                  Questionário
                </button>
              )}

              {possuiResultadoAnterior && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate("/resultado")}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#4f5f43] transition hover:bg-[#f3f6ed]"
                >
                  <FiBarChart2 className="h-4 w-4" />
                  Resultado
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate("/assinatura")}
                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#4f5f43] transition hover:bg-[#f3f6ed]"
              >
                <FiCreditCard className="h-4 w-4" />
                {subscriber ? "Minha assinatura" : "Assinatura"}
              </button>

              <button
                type="button"
                role="menuitem"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-[#8b9580] opacity-75"
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
                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#4f5f43] transition hover:bg-[#f3f6ed]"
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
