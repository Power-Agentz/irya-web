import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo-irya.png";
import { useAuth } from "../../hooks/useAuth";
import { useQuestionarioStatus } from "../../hooks/useQuestionarioStatus";
import { FiBarChart2, FiClipboard, FiCreditCard, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { GiFlowerPot } from "react-icons/gi";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const authenticated = isAuthenticated();
  const { status } = useQuestionarioStatus(authenticated);
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

  if (!authenticated) {
    return null;
  }

  const podeResponder = status?.podeResponder === true;
  const possuiResultadoAnterior = Boolean(status?.resultadoAnterior);

  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="relative z-50 w-full border-b border-[#e9e4d8] bg-[#fdfcf9]/92 backdrop-blur-md">
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-5 py-3 sm:px-8 md:px-12">
        <Link to="/inicio" className="shrink-0">
          <img className="h-[48px] w-auto sm:h-[52px]" src={logo} alt="Logo da Irya" />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-[#d4dccc] bg-[#fffdfa]/90 p-0 text-[#5f6f52] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition hover:border-[#b9c5ac] hover:bg-white"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            {menuOpen ? <FiX className="h-5 w-5 sm:h-6 sm:w-6" /> : <FiMenu className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-[70] mt-2 w-56 overflow-hidden rounded-2xl border border-[#d8d2c7] bg-[#fffdfa]/95 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-md"
            >
              {podeResponder && (
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
                Assinatura
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
                <span className="text-xs font-semibold uppercase tracking-wide">(em breve)</span>
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
