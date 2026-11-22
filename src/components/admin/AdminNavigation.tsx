
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BusFront,
  Route,
  ChartNoAxesCombined,
  Bell,
  BrainCircuit,
  Settings,
  TicketCheck,
  ChevronRight,
  X,
} from "lucide-react";

const navigationItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Fleet Tracking", href: "/admin/fleet", icon: BusFront },
  { name: "Routes & Stops", href: "/admin/routes", icon: Route },
  { name: "Crowd Analytics", href: "/admin/analytics", icon: ChartNoAxesCombined },
  { name: "Alerts", href: "/admin/alerts", icon: Bell },
  { name: "Bus Deployment", href: "/admin/recommendations", icon: BrainCircuit },
  { name: "Pass Management", href: "/admin/passes", icon: TicketCheck },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminNavigation({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      {isOpen && (
        <aside className="fixed bottom-0 left-0 top-[82px] z-30 hidden w-[250px] flex-col overflow-y-auto bg-[#172A30] text-white lg:flex">
          <div className="flex items-start justify-between border-b border-white/10 px-6 py-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E94F70]">
                Administration
              </p>
              <h2 className="mt-2 text-lg font-bold">Control Centre</h2>
              <p className="mt-1 text-xs text-white/50">
                Manage your transport network
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin sidebar"
              className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              Main Menu
            </p>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm transition ${
                    isActive
                      ? "bg-[#E94F70] font-semibold text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.name}
                  </span>

                  {isActive && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/10 p-5">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#269D83]" />
                <span className="text-xs font-semibold text-white">
                  Operations Dashboard
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-white/50">
                CrowdFlow transport management portal
              </p>
            </div>
          </div>
        </aside>
      )}

      {/* MOBILE NAVIGATION */}
      {isOpen && (
        <div className="sticky top-[82px] z-30 border-b border-gray-200 bg-[#172A30] px-3 py-3 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white">
              Admin Navigation
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin navigation"
              className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                    isActive
                      ? "bg-[#E94F70] text-white"
                      : "bg-white/10 text-white/75"
                  }`}
                >
                  <Icon size={15} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
