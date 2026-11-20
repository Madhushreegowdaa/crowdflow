"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import styles from "../styles/AdminDashboard.module.css";

export function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setLoading(true);
    setError("");
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) throw signOutError;
      window.location.assign("/admin/login");
    } catch {
      setError("Logout could not be completed. Please try again.");
      setLoading(false);
    }
  }

  return <div className={styles.logoutArea}>
    <button className={styles.logoutButton} type="button" onClick={logout} disabled={loading}>
      {loading ? "Signing out…" : "Logout"}
    </button>
    {error && <p className={styles.error} role="alert">{error}</p>}
  </div>;
}
