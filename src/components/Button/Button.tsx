interface ButtonProps {
  variant: "primary" | "secondary";
  onClick?: () => void;
  label: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const baseClasses =
  "inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-3 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87967a]/40 disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<ButtonProps["variant"], string> = {
  primary:
    "border-[#748768] bg-gradient-to-b from-[#93a686] to-[#7f9272] text-white shadow-[0_8px_18px_rgba(68,83,58,0.28)] hover:-translate-y-0.5 hover:from-[#9daf90] hover:to-[#869a78] active:translate-y-0",
  secondary:
    "border-[#87967a]/50 bg-white/55 text-[#6b7c5d] hover:bg-white/80 hover:border-[#87967a]",
};

const Button = ({
  variant,
  onClick,
  label,
  type = "button",
  disabled = false,
  className = "",
  fullWidth = true,
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? "w-full" : "w-auto"} ${className}`.trim()}
    >
      {label}
    </button>
  );
};

export default Button;
