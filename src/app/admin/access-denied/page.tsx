import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert size={36} />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-red-600">
          Authorization Required
        </p>

        <h1 className="mt-2 text-2xl font-bold text-[#172A30]">
          Access Denied
        </h1>

        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Your current account does not have administrator privileges. Only verified administrators with the <strong>admin</strong> role can access the CrowdFlow Operations Portal.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/admin/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#172A30] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#243F52]"
          >
            <LogIn size={16} />
            Sign in as Administrator
          </Link>

          <Link
            href="/home"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Return to Passenger Home
          </Link>
        </div>
      </div>
    </div>
  );
}
