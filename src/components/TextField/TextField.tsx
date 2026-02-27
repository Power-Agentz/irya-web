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
  "mt-2 h-12 w-full rounded-2xl border border-[#d8d2c7] bg-[#fffdfa]/85 px-4 text-base font-light text-[#425039] outline-none transition duration-200 focus:border-[#90a081] focus:bg-white focus:shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:ring-0";

const TextField = (props: TextFieldProps) => {
  const { label, className = "" } = props;

  if (props.as === "select") {
    const { options, as, ...selectProps } = props;
    void as;

    return (
      <div className={`flex flex-col ${className}`.trim()}>
        {label && (
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#78866a] sm:text-xs">
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
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#78866a] sm:text-xs">
          {label}
        </label>
      )}
      <input {...inputProps} className={baseFieldClasses} />
    </div>
  );
};

export default TextField;
