import type { InputHTMLAttributes } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AuthInput({ label, error, id, ...props }: AuthInputProps) {
  const errorId = error && id ? `${id}-error` : undefined;
  return (
    <div className={"field"}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={error ? "inputError" : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className={"fieldError"} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
