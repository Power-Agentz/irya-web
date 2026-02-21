import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo-irya.png";
import logoutIcon from "../../../assets/logout.png";
import { useAuth } from "../../hooks/useAuth";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="w-full p-3 sm:px-4 md:px-6 md:pt-5">
      <header className="mx-auto flex w-full max-w-[960px] items-center justify-between rounded-2xl border border-white/40 bg-[#f6f4ef]/75 px-4 py-2.5 shadow-[0_10px_28px_rgba(27,33,24,0.12)] backdrop-blur-md sm:px-6 md:px-8">
        <Link to="/inicio" className="shrink-0">
          <img className="h-[48px] w-auto sm:h-[56px]" src={logo} alt="Logo da Irya" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#87967a]/20 bg-white/55 p-0 transition hover:-translate-y-0.5 hover:border-[#87967a]/40 hover:bg-white"
          aria-label="Encerrar sessao"
        >
          <img className="h-5 w-5 sm:h-6 sm:w-6" src={logoutIcon} alt="Icone de logout" />
        </button>
      </header>
    </div>
  );
};

export default Header;
