import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className={"authPage"}>
      <div className={"authPanel"}>
        <Link href="/" className={"brand"}>
          <span className={"brandMark"}>C</span>
          <span>CrowdFlow</span>
        </Link>
        <div className={"authHeading"}>
          <p className={"eyebrow"}>{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
        <div className={"authFooter"}>{footer}</div>
      </div>
    </main>
  );
}
