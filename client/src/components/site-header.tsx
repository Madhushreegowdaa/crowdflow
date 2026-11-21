"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/track", label: "Track Bus" },
  { href: "/routes", label: "Routes" },
];

function BusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="13" rx="2" />
      <path d="M2 10h20" />
      <circle cx="7" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <path d="M7 5V3M17 5V3" />
    </svg>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(255,255,255,0.97)",
        borderBottom: "1px solid var(--cf-border)",
        backdropFilter: "blur(12px)",
        boxShadow: "var(--cf-shadow-sm)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus:outline-none focus:ring-2 rounded-lg"
          style={{ color: "var(--cf-dark)" }}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ background: "var(--cf-accent)" }}
          >
            <BusIcon />
          </span>
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--cf-dark)" }}>
            Crowd<span style={{ color: "var(--cf-accent)" }}>Flow</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="relative px-4 py-2 text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2"
                style={{
                  color: active ? "var(--cf-accent)" : "var(--cf-text-secondary)",
                  background: active ? "var(--cf-accent-light)" : "transparent",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3" />

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-lg p-2 transition-colors focus:outline-none focus:ring-2"
          style={{ color: "var(--cf-text-secondary)" }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden px-4 pb-4 pt-2"
          style={{ borderTop: "1px solid var(--cf-border)", background: "#fff" }}
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className="rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                  style={{
                    color: active ? "var(--cf-accent)" : "var(--cf-text-primary)",
                    background: active ? "var(--cf-accent-light)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
