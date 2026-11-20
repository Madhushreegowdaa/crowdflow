import Link from "next/link";
import { AdminLogoutButton } from "./AdminLogoutButton";
import styles from "../styles/AdminDashboard.module.css";

export function AdminNavigation({ activePage }: { activePage: "dashboard" | "profile" }) {
  return <header className={styles.navigation}>
    <div className={styles.navigationInner}>
      <Link className={styles.brand} href="/admin/dashboard"><span className={styles.brandMark}>C</span><span>CrowdFlow Admin</span></Link>
      <nav className={styles.navLinks} aria-label="Admin navigation">
        <Link href="/admin/dashboard" aria-current={activePage === "dashboard" ? "page" : undefined}>Dashboard</Link>
        <Link href="/admin/profile" aria-current={activePage === "profile" ? "page" : undefined}>Profile</Link>
      </nav>
      <AdminLogoutButton />
    </div>
  </header>;
}
