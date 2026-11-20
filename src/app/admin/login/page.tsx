import Link from "next/link";
import { AdminAuthShell } from "../components/AdminAuthShell";
import { AdminLoginForm } from "../components/AdminAuthForm";

export default function AdminLoginPage() { return <AdminAuthShell eyebrow="ADMIN PORTAL" title="ADMIN PORTAL" description="Sign in to manage public transport operations." footer={<>Need administrator access? <Link href="/admin/register">Register with an invitation</Link></>}><AdminLoginForm /></AdminAuthShell>; }
