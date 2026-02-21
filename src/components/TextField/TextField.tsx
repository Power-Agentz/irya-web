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
  "mt-2 h-11 w-full p-2 rounded-none border-0 border-b border-[#87967a] bg-transparent text-base font-light outline-none transition focus:border-[#6e7f61] focus:ring-0";

const TextField = (props: TextFieldProps) => {
  const { label, className = "" } = props;

  if (props.as === "select") {
    const { options, as, ...selectProps } = props;
    void as;

    return (
      <div className={`flex flex-col ${className}`.trim()}>
        {label && <label className="text-sm font-medium text-[#3f4c36] sm:text-base">{label}</label>}
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
      {label && <label className="text-sm font-medium text-[#3f4c36] sm:text-base">{label}</label>}
      <input {...inputProps} className={baseFieldClasses} />
    </div>
  );
};

export default TextField;
