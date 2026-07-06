import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

type SharedProps = {
  label?: string;
  className?: string;
};

type InputProps = SharedProps &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: "input";
  };

type SelectProps = SharedProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    as: "select";
    options: Array<{ value: string; label: string }>;
  };

type TextFieldProps = InputProps | SelectProps;

const baseFieldClasses =
  "mt-2 h-12 w-full rounded-[8px] border border-[#f1e3b9] bg-[#fefefe] px-4 text-base font-normal text-[#4a5d4f] outline-none transition duration-200 placeholder:text-[#8da399] focus:border-[#4a5d4f] focus:shadow-[0_0_0_3px_rgba(124,157,114,0.15)] focus:ring-0";

const TextField = (props: TextFieldProps) => {
  const { label, className = "" } = props;

  if (props.as === "select") {
    const { options, as, ...selectProps } = props;
    void as;

    return (
      <div className={`flex flex-col ${className}`.trim()}>
        {label && (
          <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#7c9d72] sm:text-xs">
            {label}
          </label>
        )}
        <select {...selectProps} className={baseFieldClasses}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const { as, ...inputProps } = props;
  void as;

  return (
    <div className={`flex flex-col ${className}`.trim()}>
      {label && (
        <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#7c9d72] sm:text-xs">
          {label}
        </label>
      )}
      <input {...inputProps} className={baseFieldClasses} />
    </div>
  );
};

export default TextField;
