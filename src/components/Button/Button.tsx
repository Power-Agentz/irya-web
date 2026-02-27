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
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border px-5 py-3 text-base font-medium tracking-tight transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87967a]/35 disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<ButtonProps["variant"], string> = {
  primary:
    "border-[#748768] bg-gradient-to-b from-[#93a686] to-[#7f9272] text-white shadow-[0_12px_30px_rgba(116,135,104,0.22)] hover:scale-[1.015] hover:from-[#9daf90] hover:to-[#869a78] active:scale-[0.995]",
  secondary:
    "border-[#ccd3c2] bg-white/78 text-[#627354] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:scale-[1.01] hover:border-[#aeb9a1] hover:bg-white",
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
