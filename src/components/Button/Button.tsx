import "./Button.css";

interface ButtonProps {
  variant: "primary" | "secondary";
  onClick?: () => void;
  label: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const Button = ({ variant, onClick, label, type, disabled }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={
        variant === "primary"
          ? "whim-button--primary"
          : "whim-button--secondary"
      }
    >
      {label}
    </button>
  );
};

export default Button;
