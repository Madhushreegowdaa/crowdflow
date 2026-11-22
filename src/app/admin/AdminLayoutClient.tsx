"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminHeader from "@/components/admin/Adminheader";
import AdminNavigation from "@/components/admin/AdminNavigation";

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/register",
  "/admin/access-denied",
]);

export default function AdminLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(true);

  const isPublicAuthPage = PUBLIC_ADMIN_PATHS.has(pathname);

  function toggleNavigation() {
    setNavigationOpen((open) => !open);
  }

  // Admin login, registration, and access-denied pages must NOT display the admin sidebar or header
  if (isPublicAuthPage) {
    return <div className="min-h-screen bg-[#F8F8F7]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      <AdminHeader
        navigationOpen={navigationOpen}
        onToggleNavigation={toggleNavigation}
      />

      <AdminNavigation
        isOpen={navigationOpen}
        onClose={() => setNavigationOpen(false)}
      />

      <main
        className={`min-w-0 px-4 py-6 transition-[margin] duration-300 sm:px-6 md:px-8 md:py-8 ${
          navigationOpen ? "lg:ml-[250px]" : "lg:ml-0"
        }`}
      >
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}
