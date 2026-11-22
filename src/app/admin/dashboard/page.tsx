import { connection } from "next/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { AdminNavigation } from "../components/AdminNavigation";
import styles from "../styles/AdminDashboard.module.css";

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (user.app_metadata?.role !== "admin") redirect("/admin/login?error=admin_required");
  return <main className={styles.page}>
    <AdminNavigation activePage="dashboard" />
    <section className={styles.dashboardMain} aria-labelledby="admin-welcome-title">
      <div className={styles.card}>
        <p className={styles.eyebrow}>ADMIN PORTAL</p>
        <h1 id="admin-welcome-title">Welcome, Administrator!</h1>
        <p className={styles.message}>Your administrator account is ready.</p>
        <p className={styles.message}>Fleet management dashboard integration is coming soon.</p>
      </div>
    </section>
  </main>;
}
