"use client";

import { useState, type ReactNode } from "react";
import AdminHeader from "@/components/admin/Adminheader";
import AdminNavigation from "@/components/admin/AdminNavigation";

export default function AdminLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const [navigationOpen, setNavigationOpen] = useState(true);

  function toggleNavigation() {
    setNavigationOpen((open) => !open);
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
