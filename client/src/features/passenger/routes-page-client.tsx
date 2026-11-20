"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_ROUTES, searchRoutes } from "@/lib/mock-data";
import type { CrowdLevel } from "@/lib/mock-data";
import { SERVICE_LOCATIONS } from "@/lib/service-areas";
import CrowdLevelBadge from "@/components/crowd-level-badge";

const ALL_LEVELS: CrowdLevel[] = ["Low", "Medium", "High"];

export default function RoutesPageClient() {
  const [query, setQuery]             = useState("");
  const [origin, setOrigin]           = useState("");
  const [destination, setDestination] = useState("");
  const [crowdFilter, setCrowdFilter] = useState<CrowdLevel | "All">("All");

  // When origin/destination fields are used, delegate to the searchRoutes
  // helper from mock-data (ready to swap for the API version later).
  // The name/number query then filters that result set further.
  const byLocation = (origin || destination)
    ? searchRoutes(origin, destination)
    : MOCK_ROUTES;

  const filtered = byLocation.filter((r) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      r.number.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) ||
      r.stops.some((s) => s.name.toLowerCase().includes(q));
    const matchCrowd = crowdFilter === "All" || r.crowdLevel === crowdFilter;
    return matchQuery && matchCrowd;
  });

  const hasFilters = query || origin || destination || crowdFilter !== "All";

  function clearFilters() {
    setQuery("");
    setOrigin("");
    setDestination("");
    setCrowdFilter("All");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium focus:outline-none focus:ring-1 rounded"
          style={{ color: "var(--cf-accent)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to dashboard
        </Link>
        <h1
          className="mt-3 text-2xl font-bold"
          style={{ color: "var(--cf-text-primary)", letterSpacing: "-0.01em" }}
        >
          Demo Bus Routes
        </h1>
      </div>

      {/* Filter bar */}
      <div
        className="mb-6 flex flex-col gap-3 rounded-2xl p-4"
        style={{ background: "var(--cf-surface)", border: "1px solid var(--cf-border)" }}
      >
        {/* Row 1: origin / destination */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cf-text-muted)" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 10c0 5.25 7 12 7 12s7-6.75 7-12c0-3.87-3.13-7-7-7z" />
            </svg>
            <input
              type="search"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="From (origin stop)"
              className="cf-input"
              style={{ paddingLeft: 36 }}
              list="service-area-locations"
              aria-label="Origin stop"
            />
          </div>
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cf-accent)" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 10c0 5.25 7 12 7 12s7-6.75 7-12c0-3.87-3.13-7-7-7z" />
            </svg>
            <input
              type="search"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="To (destination stop)"
              className="cf-input"
              style={{ paddingLeft: 36 }}
              list="service-area-locations"
              aria-label="Destination stop"
            />
          </div>
        </div>

        <datalist id="service-area-locations">
          {SERVICE_LOCATIONS.map((location) => (
            <option
              key={location.name}
              value={location.name}
              label={`${location.area} - ${location.kind}`}
            />
          ))}
        </datalist>

        <p className="text-xs" style={{ color: "var(--cf-text-muted)" }}>
          The stop directory is partial. Entries outside Bengaluru are area references, not verified bus stops.
        </p>

        {/* Row 2: name/number search + crowd filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="var(--cf-text-muted)" strokeWidth="2" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by route name or number…"
              className="cf-input"
              style={{ paddingLeft: 36 }}
              aria-label="Search routes"
            />
          </div>

          {/* Crowd filter pills */}
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by crowd level">
            <span className="text-xs font-semibold" style={{ color: "var(--cf-text-muted)" }}>Crowd:</span>
            {(["All", ...ALL_LEVELS] as const).map((level) => {
              const active = crowdFilter === level;
              return (
                <button
                  key={level}
                  onClick={() => setCrowdFilter(level)}
                  aria-pressed={active}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2"
                  style={{
                    background: active ? "var(--cf-accent)" : "var(--cf-surface-3)",
                    color: active ? "#fff" : "var(--cf-text-secondary)",
                    border: active ? "1.5px solid var(--cf-accent)" : "1.5px solid var(--cf-border)",
                  }}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="mb-5 text-sm" style={{ color: "var(--cf-text-muted)" }}>
        <span className="font-semibold" style={{ color: "var(--cf-text-primary)" }}>{filtered.length}</span>{" "}
        route{filtered.length !== 1 ? "s" : ""}
        {hasFilters ? " matching your filters" : " in the Bengaluru demo dataset"}
      </p>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "var(--cf-surface)", border: "1px dashed var(--cf-border)" }}
        >
          <p className="font-semibold" style={{ color: "var(--cf-text-primary)" }}>No demo routes match your search.</p>
          <button
            onClick={clearFilters}
            className="cf-btn-outline-dark mt-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((route) => (
            <li key={route.id} className="cf-card" style={{ padding: 0 }}>

              {/* Card header — dark strip */}
              <div
                className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap"
                style={{
                  background: "var(--cf-dark-2)",
                  borderRadius: "var(--cf-radius-lg) var(--cf-radius-lg) 0 0",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: "var(--cf-accent)" }}
                  >
                    {route.number}
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-white">{route.name}</h2>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {route.origin} → {route.destination}
                    </p>
                    <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Demo only - not a verified timetable
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CrowdLevelBadge level={route.crowdLevel} />
                  <Link
                    href={`/track?route=${route.id}`}
                    className="cf-btn-primary"
                    style={{ padding: "7px 16px", fontSize: "0.75rem" }}
                  >
                    Track
                  </Link>
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4">
                {/* Stats */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { icon: "⏱", text: `${route.durationMinutes} min journey` },
                    { icon: "🔄", text: route.frequency },
                    { icon: "🕐", text: route.operatingHours },
                    { icon: "🚏", text: `${route.stops.length} stops` },
                  ].map(({ icon, text }) => (
                    <span key={text} className="cf-stat-chip">
                      {icon} {text}
                    </span>
                  ))}
                </div>

                {/* Stops */}
                <div>
                  <p
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--cf-text-muted)" }}
                  >
                    Stops
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {route.stops.map((stop, i) => (
                      <span key={stop.id} className="flex items-center gap-1.5">
                        <span className="cf-stop-pill">{stop.name}</span>
                        {i < route.stops.length - 1 && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--cf-text-muted)" strokeWidth="2.5" aria-hidden="true">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
