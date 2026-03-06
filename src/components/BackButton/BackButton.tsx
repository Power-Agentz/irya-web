import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="mb-4 inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-[#6d7f60] transition hover:text-[#55684a] sm:mb-5 sm:text-base"
      onClick={() => navigate(-1)}
    >
      <FiArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
      Voltar para o ínicio
    </button>
  );
};

export default BackButton;
