import { FiPlus } from "react-icons/fi";

type PremiumBadgeProps = {
  size?: "sm" | "md";
  className?: string;
};

const PremiumBadge = ({ size = "md", className = "" }: PremiumBadgeProps) => {
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[#e4c884] bg-gradient-to-r from-[#f4eed8] to-[#eacf93] px-2.5 py-1 font-semibold uppercase tracking-[0.12em] text-[#6f5723] shadow-[0_4px_12px_rgba(206,169,82,0.18)] ${
        isSmall ? "text-[9px]" : "text-[10px]"
      } ${className}`.trim()}
    >
      <span
        className={`inline-flex items-center justify-center rounded-[4px] bg-[#6b5622] text-[#f7ebc7] ${
          isSmall ? "h-3.5 w-3.5" : "h-4 w-4"
        }`}
      >
        <FiPlus className={isSmall ? "h-2.5 w-2.5" : "h-3 w-3"} />
      </span>
      Premium
    </span>
  );
};

export default PremiumBadge;
