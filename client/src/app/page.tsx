import type { Metadata } from "next";
import Link from "next/link";
import RouteSearch from "@/components/route-search";
import BusArrivalCard from "@/components/bus-arrival-card";
import CrowdLevelBadge from "@/components/crowd-level-badge";
import { MOCK_ARRIVALS, MOCK_ROUTES } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "CrowdFlow — Smarter Public Transport",
  description: "Check bus arrivals, route information and crowd levels with CrowdFlow.",
};

/* ─── Static data ─────────────────────────────────────────────────────────── */

const quickLinks = [
  {
    href: "/track",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      </svg>
    ),
    title: "Track a Bus",
    description: "Follow your bus stop-by-stop with live ETA updates.",
  },
  {
    href: "/routes",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    ),
    title: "Explore Routes",
    description: "Browse all bus routes, stops and timetables.",
  },
  {
    href: "/routes",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Journey Info",
    description: "Plan your journey with stop-by-stop information.",
  },
];

const steps = [
  {
    n: "01",
    title: "Search your route",
    description: "Enter your starting stop and destination to find matching bus services.",
  },
  {
    n: "02",
    title: "Check crowd levels",
    description: "See how busy each service is before you board — Low, Medium, or High.",
  },
  {
    n: "03",
    title: "Track and travel",
    description: "Follow your bus stop-by-stop and arrive with confidence.",
  },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const crowdSummary = [
    { label: "Low",    count: MOCK_ROUTES.filter((r) => r.crowdLevel === "Low").length,    level: "Low"    as const },
    { label: "Medium", count: MOCK_ROUTES.filter((r) => r.crowdLevel === "Medium").length, level: "Medium" as const },
    { label: "High",   count: MOCK_ROUTES.filter((r) => r.crowdLevel === "High").length,   level: "High"   as const },
  ];

  return (
    <div className="flex flex-col">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center"
        style={{
          background: "linear-gradient(160deg, var(--cf-dark) 0%, var(--cf-dark-2) 55%, #0f2a3f 100%)",
        }}
      >
        {/* Subtle grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(232,67,90,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(15,118,110,0.07) 0%, transparent 45%)",
          }}
        />

        {/* Eyebrow */}
        <p
          className="relative mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{ background: "rgba(232,67,90,0.15)", color: "var(--cf-accent)", border: "1px solid rgba(232,67,90,0.25)" }}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cf-accent)", display: "inline-block" }}
            aria-hidden="true"
          />
          Public Transport Platform
        </p>

        {/* Headline */}
        <h1
          className="relative max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          Your journey,{" "}
          <span style={{ color: "var(--cf-accent)" }}>smarter.</span>
        </h1>

        <p
          className="relative mt-5 max-w-xl text-lg leading-relaxed"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          CrowdFlow helps you check bus arrivals, explore route information and see crowd levels — so you can travel with confidence.
        </p>

        {/* CTA buttons */}
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/track" className="cf-btn-primary" style={{ padding: "12px 32px", fontSize: "0.9375rem" }}>
            Track a Bus
          </Link>
          <Link href="/routes" className="cf-btn-outline" style={{ padding: "12px 32px", fontSize: "0.9375rem" }}>
            Explore Routes
          </Link>
        </div>

        {/* Search panel */}
        <div
          className="relative mt-12 w-full max-w-3xl rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
          }}
        >
          <p
            className="mb-4 text-left text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Find a route
          </p>
          <RouteSearch dark />
        </div>

        {/* Bottom wave */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 48, background: "var(--cf-surface-2)", clipPath: "ellipse(55% 100% at 50% 100%)" }}
        />
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── UPCOMING ARRIVALS ─────────────────────────────────────────── */}
        <section className="py-14" aria-labelledby="arrivals-heading">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 id="arrivals-heading" className="cf-section-title">Upcoming Arrivals</h2>
            </div>
            <Link
              href="/track"
              className="cf-btn-outline-dark shrink-0"
              style={{ padding: "8px 18px", fontSize: "0.8125rem" }}
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_ARRIVALS.slice(0, 6).map((arrival) => (
              <BusArrivalCard key={arrival.id} arrival={arrival} />
            ))}
          </div>
        </section>

        {/* ── CROWD STATUS ──────────────────────────────────────────────── */}
        <section
          className="rounded-2xl p-8 mb-14"
          style={{ background: "var(--cf-dark-2)", border: "1px solid var(--cf-border-dark)" }}
          aria-labelledby="crowd-heading"
        >
          <div className="mb-6">
              <h2
              id="crowd-heading"
              className="text-xl font-bold text-white"
              style={{ letterSpacing: "-0.01em" }}
            >
              Current Crowd Status
            </h2>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Overview of crowd levels across sample routes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {crowdSummary.map(({ count, level }) => {
              const colors = {
                Low:    { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", num: "#10b981" },
                Medium: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", num: "#f59e0b" },
                High:   { bg: "rgba(232,67,90,0.12)",  border: "rgba(232,67,90,0.25)",  num: "var(--cf-accent)" },
              }[level];
              return (
                <div
                  key={level}
                  className="rounded-xl p-5 text-center"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                >
                  <p className="text-3xl font-extrabold" style={{ color: colors.num }}>{count}</p>
                  <div className="mt-2 flex justify-center">
                    <CrowdLevelBadge level={level} />
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>routes</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── QUICK ACCESS ──────────────────────────────────────────────── */}
        <section className="pb-14" aria-labelledby="quick-heading">
          <h2 id="quick-heading" className="cf-section-title mb-8">Quick Access</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {quickLinks.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="cf-card group flex flex-col gap-4 p-6 focus:outline-none focus:ring-2"
                style={{ textDecoration: "none" }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
                  style={{ background: "var(--cf-accent-light)", color: "var(--cf-accent)" }}
                >
                  {card.icon}
                </span>
                <div>
                  <p
                    className="font-semibold transition-colors"
                    style={{ color: "var(--cf-text-primary)", fontSize: "0.9375rem" }}
                  >
                    {card.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--cf-text-muted)" }}>
                    {card.description}
                  </p>
                </div>
                <span
                  className="mt-auto text-xs font-semibold"
                  style={{ color: "var(--cf-accent)" }}
                >
                  Go →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section
          className="rounded-2xl px-8 py-12 mb-14 text-center"
          style={{ background: "var(--cf-surface)", border: "1px solid var(--cf-border)" }}
          aria-labelledby="how-heading"
        >
          <h2 id="how-heading" className="cf-section-title centered mx-auto mb-10">
            How CrowdFlow Works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.n} className="flex flex-col items-center gap-4">
                {/* Step number */}
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <span
                    className="absolute inset-0 rounded-full opacity-15"
                    style={{ background: "var(--cf-accent)" }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-lg font-extrabold"
                    style={{ color: "var(--cf-accent)" }}
                  >
                    {s.n}
                  </span>
                </div>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden sm:block absolute"
                    style={{
                      width: "calc(33.33% - 56px)",
                      height: 1,
                      background: "var(--cf-border)",
                      top: "7rem",
                    }}
                  />
                )}
                <p className="font-semibold" style={{ color: "var(--cf-text-primary)" }}>{s.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--cf-text-muted)" }}>
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
