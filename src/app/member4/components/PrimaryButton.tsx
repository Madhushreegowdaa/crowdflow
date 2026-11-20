import type { ButtonHTMLAttributes } from "react";

export function PrimaryButton({
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button className={"primaryButton"} disabled={loading || props.disabled} {...props}>
      {loading ? "Connecting…" : children}
      {!loading && <span aria-hidden="true">→</span>}
    </button>
  );
}
