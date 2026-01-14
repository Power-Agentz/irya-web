import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/logo-irya.png";
import logoutIcon from "../../../assets/logout.png";
import "./Header.css";

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  const isLoggedIn = !!localStorage.getItem("token");

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="header-container">
      <header className="header">
        <a href="/inicio">
          {" "}
          <img
            className="header-logo"
            src={logo}
            alt="Logo da Irya"
          />
        </a>

        <img
          className="header-logout"
          onClick={handleLogout}
          src={logoutIcon}
          alt="Ícone de logout"
        />
      </header>
    </div>
  );
};

export default Header;
