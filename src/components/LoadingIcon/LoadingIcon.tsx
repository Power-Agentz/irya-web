interface LoadingIconProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClassMap: Record<NonNullable<LoadingIconProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

const LoadingIcon = ({ size = "md", className = "" }: LoadingIconProps) => {
  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClassMap[size]} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-full w-full animate-spin" fill="none">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="3"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};

export default LoadingIcon;
