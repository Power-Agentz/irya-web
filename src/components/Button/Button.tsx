import LoadingIcon from "../LoadingIcon/LoadingIcon";

interface ButtonProps {
  variant: "primary" | "secondary";
  onClick?: () => void;
  label: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  loading?: boolean;
}

const baseClasses =
  "inline-flex min-h-12 items-center justify-center border px-6 py-[14px] text-base transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c9d72]/25 disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<ButtonProps["variant"], string> = {
  primary:
    "rounded-[50px] border-[#3a4d3f] bg-[#3a4d3f] font-['Libre_Baskerville',serif] font-bold text-white shadow-[0_8px_24px_rgba(74,93,79,0.24)] hover:-translate-y-0.5 hover:bg-[#6a8d60] hover:shadow-[0_12px_28px_rgba(74,93,79,0.3)] active:translate-y-0",
  secondary:
    "rounded-xl border-2 border-[#4a5d4f] bg-transparent font-semibold text-[#4a5d4f] shadow-none hover:-translate-y-0.5 hover:bg-[#7c9d72]/8 hover:shadow-[0_4px_16px_rgba(74,93,79,0.12)] active:translate-y-0",
};

const Button = ({
  variant,
  onClick,
  label,
  type = "button",
  disabled = false,
  className = "",
  fullWidth = true,
  loading = false,
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? "w-full" : "w-auto"} ${className}`.trim()}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <LoadingIcon size="sm" className="text-current" />
          <span>{label}</span>
        </span>
      ) : (
        label
      )}
    </button>
  );
};

export default Button;
