import type { ReactNode } from "react";
import Link from "next/link";
import styles from "../styles/AdminAuth.module.css";

export function AdminAuthShell({ eyebrow, title, description, footer, children }: { eyebrow: string; title: string; description: string; footer: ReactNode; children: ReactNode }) {
  return <main className={styles.page}>
    <section className={styles.card} aria-label="CrowdFlow administrator authentication">
      <Link href="/admin/login" className={styles.brand}><span className={styles.brandMark}>C</span><span>CrowdFlow</span></Link>
      <header className={styles.heading}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>
      {children}
      <div className={styles.footer}>{footer}</div>
    </section>
  </main>;
}
