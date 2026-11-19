import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={{ background: "var(--cf-dark)", color: "rgba(255,255,255,0.7)" }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">

          {/* Brand */}
          <div>
            <p className="text-xl font-bold text-white">
              Crowd<span style={{ color: "var(--cf-accent)" }}>Flow</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Intelligent public transportation platform. Check bus arrivals, route information and crowd levels.
            </p>
          </div>

          {/* Passenger links */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              Passenger
            </p>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Dashboard" },
                { href: "/track", label: "Track Bus" },
                { href: "/routes", label: "Routes" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Project info */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              Project
            </p>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              <li>Member 2 — Passenger UI</li>
              <li>Next.js 16 · TypeScript</li>
              <li>Tailwind CSS v4</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 text-center text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}
        >
          © CrowdFlow — Intelligent Public Transportation Platform
        </div>
      </div>
    </footer>
  );
}
