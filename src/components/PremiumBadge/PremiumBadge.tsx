import { FiPlus } from "react-icons/fi";

type PremiumBadgeProps = {
  size?: "sm" | "md";
  className?: string;
};

const PremiumBadge = ({ size = "md", className = "" }: PremiumBadgeProps) => {
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[#d8c58a] bg-gradient-to-r from-[#f6e8b8] to-[#e8d38f] px-2 py-1 font-semibold uppercase tracking-[0.08em] text-[#5f4a18] shadow-[0_4px_10px_rgba(90,71,24,0.16)] ${
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
