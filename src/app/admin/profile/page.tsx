import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { AdminNavigation } from "../components/AdminNavigation";
import { AdminProfileClient, type AdminProfile } from "./ProfileClient";
import "../../member4/Member4.css";

export const instant = false;

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  joined_at: string;
}

export default async function AdminProfilePage() {
  await connection();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/admin/login");
  if (user.app_metadata?.role !== "admin") redirect("/admin/login?error=admin_required");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, joined_at")
    .eq("id", user.id)
    .maybeSingle();

  let profile: AdminProfile | null = null;
  let status: "ready" | "missing" | "error" = "ready";
  if (error) status = "error";
  else if (!data) status = "missing";
  else {
    const row = data as ProfileRow;
    profile = { id: row.id, fullName: row.full_name, email: row.email, phone: row.phone, joinedAt: row.joined_at };
  }

  return <main className="memberPage">
    <AdminNavigation activePage="profile" />
    <AdminProfileClient profile={profile} initialStatus={status} />
  </main>;
}
