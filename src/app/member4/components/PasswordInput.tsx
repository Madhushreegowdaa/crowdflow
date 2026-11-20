"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export function PasswordInput({ label, error, id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className={"field"}>
      <label htmlFor={id}>{label}</label>
      <div className={"passwordWrap"}>
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={error ? "inputError" : undefined}
        />
        <button
          type="button"
          className={"visibilityButton"}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error && (
        <p id={errorId} className={"fieldError"} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
