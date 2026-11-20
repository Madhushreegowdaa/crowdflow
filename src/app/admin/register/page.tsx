import Link from "next/link";
import { AdminAuthShell } from "../components/AdminAuthShell";
import { AdminRegisterForm } from "../components/AdminAuthForm";

export default function AdminRegisterPage() { return <AdminAuthShell eyebrow="ADMIN REGISTRATION" title="ADMIN REGISTRATION" description="Create an authorized administrator account." footer={<>Already registered? <Link href="/admin/login">Back to Admin Login</Link></>}><AdminRegisterForm /></AdminAuthShell>; }
