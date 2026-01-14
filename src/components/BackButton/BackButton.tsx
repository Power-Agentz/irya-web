import React from "react";
import { useNavigate } from "react-router-dom";
import back from "../../../assets/back.png";
import "./BackButton.css";

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button className="back-button" onClick={() => navigate(-1)}>
      <img src={back} alt="Voltar" />
      voltar
    </button>
  );
};

export default BackButton;
