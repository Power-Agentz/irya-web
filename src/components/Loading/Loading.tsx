import React from "react";
import LoadingIcon from "../LoadingIcon/LoadingIcon";

const Loading: React.FC = () => {
  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 py-10 text-[#6f8061]">
      <LoadingIcon size="lg" className="text-[#87967a]" />
      <p className="text-sm font-medium tracking-wide">Carregando...</p>
    </div>
  );
};

export default Loading;
