import type { ReactNode } from "react";
import Link from "next/link";
import styles from "../styles/AdminAuth.module.css";

export function AdminAuthShell({ eyebrow, title, description, footer, children }: { eyebrow: string; title: string; description: string; footer: ReactNode; children: ReactNode }) {
  return <div className={styles.page}>
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="CrowdFlow home">
          <span className={styles.brandIcon} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 11l19-9-9 19-2-8-8-2z" />
            </svg>
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>CROWD<span>FLOW</span></span>
            <span className={styles.brandTagline}>Real-Time Bus Intelligence</span>
          </span>
        </Link>
        <Link href="/" className={styles.homeLink}>Home</Link>
      </div>
    </header>
    <main className={styles.authArea}>
      <section className={styles.card} aria-label="CrowdFlow administrator authentication">
        <header className={styles.heading}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>
        {children}
        <div className={styles.footer}>{footer}</div>
      </section>
    </main>
  </div>;
}
