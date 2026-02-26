import React from "react";
import { useNavigate } from "react-router-dom";
import back from "../../../assets/back.png";

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="mb-4 inline-flex h-11 w-fit items-center gap-2 rounded-lg border border-[#87967a]/20 bg-[#87967a]/5 px-3 text-sm font-medium text-[#87967a] transition hover:bg-[#87967a]/10 sm:mb-5 sm:text-base"
      onClick={() => navigate(-1)}
    >
      <img src={back} alt="Voltar" className="h-3.5 w-auto sm:h-4" />
      ir para home
    </button>
  );
};

export default BackButton;
