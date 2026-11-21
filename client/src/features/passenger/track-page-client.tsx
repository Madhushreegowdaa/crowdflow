  "use client";

  import { useState, useEffect } from "react";
  import { useSearchParams } from "next/navigation";
  import Link from "next/link";
  import { MOCK_ROUTES, MOCK_ARRIVALS, getAlternatives } from "@/lib/mock-data";
  import type { BusRoute, BusArrival } from "@/lib/mock-data";
  import dynamic from "next/dynamic";
  import CrowdLevelBadge from "@/components/crowd-level-badge";
  import { getSimulatedGeodata } from "@/lib/route-geodata";
  import type { MapBus } from "@/lib/route-geodata";

  import type { BusTrackingMapProps } from "./bus-tracking-map";

  const BusTrackingMap = dynamic<BusTrackingMapProps>(() => import("./bus-tracking-map"), {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "450px",
          borderRadius: "12px",
          background: "var(--cf-dark-2)",
          border: "1px solid var(--cf-border-dark)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem" }}>
          Loading map…
        </p>
      </div>
    ),
  });

  /* ─── Stop timeline ───────────────────────────────────────────────────────── */
  function RouteSchematic({ route, activeStopIndex }: { route: BusRoute; activeStopIndex: number }) {
    return (
      <div aria-label="Route stop progress">
        {route.stops.map((stop, i) => {
          const isPast    = i < activeStopIndex;
          const isCurrent = i === activeStopIndex;
          const isFuture  = i > activeStopIndex;
          return (
            <div key={stop.id} className="flex items-start gap-3">
              {/* Timeline spine */}
              <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
                  style={{
                    background: isCurrent ? "var(--cf-accent)" : isPast ? "var(--cf-surface-3)" : "var(--cf-surface)",
                    border: isCurrent ? "2px solid var(--cf-accent)" : isPast ? "2px solid var(--cf-border)" : "2px solid var(--cf-border)",
                    color: isCurrent ? "#fff" : isPast ? "var(--cf-text-muted)" : "var(--cf-text-muted)",
                  }}
                >
                  {isPast ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < route.stops.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      height: 32,
                      background: isPast ? "var(--cf-border)" : "var(--cf-border)",
                      marginTop: 2,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Stop label */}
              <div className="pb-6 pt-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: isCurrent ? "var(--cf-accent)" : isFuture ? "var(--cf-text-secondary)" : "var(--cf-text-muted)",
                  }}
                >
                  {stop.name}
                  {isCurrent && (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: "var(--cf-accent-light)", color: "var(--cf-accent)" }}
                    >
                      Bus is here
                    </span>
                  )}
                </p>
                {isFuture && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--cf-text-muted)" }}>
                    ~{stop.arrivalMinutes} min from start
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ─── Stop progress card (isolated state) ────────────────────────────────── */
  function StopProgress({ route }: { route: BusRoute }) {
    const [activeStopIndex, setActiveStopIndex] = useState(1);
    const remainingMinutes =
      route.stops[route.stops.length - 1].arrivalMinutes -
      (route.stops[activeStopIndex]?.arrivalMinutes ?? 0);

    return (
      <div className="cf-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--cf-text-primary)" }}>
              Stop Progress
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--cf-text-muted)" }}>
              Est. remaining:{" "}
              <span className="font-semibold" style={{ color: "var(--cf-accent)" }}>
                {remainingMinutes} min
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveStopIndex((i) => Math.max(0, i - 1))}
              disabled={activeStopIndex === 0}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-40"
              style={{
                background: "var(--cf-surface-3)",
                border: "1px solid var(--cf-border)",
                color: "var(--cf-text-secondary)",
              }}
              aria-label="Previous stop"
            >
              ← Prev
            </button>
            <button
              onClick={() => setActiveStopIndex((i) => Math.min(route.stops.length - 1, i + 1))}
              disabled={activeStopIndex === route.stops.length - 1}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-40"
              style={{
                background: "var(--cf-accent)",
                border: "1px solid var(--cf-accent)",
                color: "#fff",
              }}
              aria-label="Next stop"
            >
              Next →
            </button>
          </div>
        </div>
        <RouteSchematic route={route} activeStopIndex={activeStopIndex} />
      </div>
    );
  }

  /* ─── Main page ───────────────────────────────────────────────────────────── */
  export default function TrackPageClient() {
    const searchParams = useSearchParams();
    const routeParam   = searchParams.get("route");

    const selectedRoute: BusRoute =
      (routeParam ? MOCK_ROUTES.find((r) => r.id === routeParam) : undefined) ??
      MOCK_ROUTES[0];

    const geo = getSimulatedGeodata(selectedRoute.id);

    const routeArrivals = MOCK_ARRIVALS.filter((a) => a.routeId === selectedRoute.id);
    const highCrowdArrivals = routeArrivals.filter((a) => a.crowdLevel === "High");

    // Simulation loop — owned here, not inside the map component.
    // Resets bus positions when the route changes; cleans up on unmount.
    const [simulatedBuses, setSimulatedBuses] = useState<MapBus[]>(geo.initialBuses);

    useEffect(() => {
      // Reset to the new route's starting positions immediately.
      setSimulatedBuses(getSimulatedGeodata(selectedRoute.id).initialBuses);

      const interval = window.setInterval(() => {
        setSimulatedBuses((current) =>
          current.map((bus, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            return {
              ...bus,
              position: [
                bus.position[0] + 0.00015 * direction,
                bus.position[1] + 0.00020 * direction,
              ] as [number, number],
            };
          })
        );
      }, 3000);

      return () => window.clearInterval(interval);
    }, [selectedRoute.id]);

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
            Track a Bus
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Route selector sidebar ─────────────────────────────────────── */}
          <aside className="lg:col-span-1">
            <div
              className="overflow-hidden rounded-2xl"
              style={{ background: "var(--cf-dark-2)", border: "1px solid var(--cf-border-dark)" }}
            >
              <div
                className="px-4 py-3.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-sm font-semibold text-white">Select a Route</p>
              </div>
              <ul role="listbox" aria-label="Available routes">
                {MOCK_ROUTES.map((route) => {
                  const active = selectedRoute.id === route.id;
                  return (
                    <li key={route.id} role="option" aria-selected={active}>
                      <Link
                        href={`/track?route=${route.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors focus:outline-none"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          background: active ? "rgba(232,67,90,0.12)" : "transparent",
                          borderLeft: active ? "3px solid var(--cf-accent)" : "3px solid transparent",
                        }}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{ background: active ? "var(--cf-accent)" : "rgba(255,255,255,0.1)" }}
                        >
                          {route.number}
                        </span>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: active ? "var(--cf-accent)" : "rgba(255,255,255,0.85)" }}
                          >
                            {route.name}
                          </p>
                          <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {route.origin} → {route.destination}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* ── Main tracking panel ────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Route info card */}
            <div className="cf-card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
                    style={{ background: "var(--cf-dark-2)" }}
                  >
                    <span style={{ color: "var(--cf-accent)", fontSize: "0.875rem" }}>
                      {selectedRoute.number}
                    </span>
                  </span>
                  <div>
                    <h2
                      className="text-lg font-bold"
                      style={{ color: "var(--cf-text-primary)", letterSpacing: "-0.01em" }}
                    >
                      {selectedRoute.name}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: "var(--cf-text-muted)" }}>
                      {selectedRoute.origin} → {selectedRoute.destination}
                    </p>
                  </div>
                </div>
                <CrowdLevelBadge level={selectedRoute.crowdLevel} />
              </div>

              <div
                className="mt-5 grid grid-cols-3 gap-4 pt-5"
                style={{ borderTop: "1px solid var(--cf-border)" }}
              >
                {[
                  { label: "Duration",  value: `${selectedRoute.durationMinutes} min` },
                  { label: "Frequency", value: selectedRoute.frequency },
                  { label: "Stops",     value: String(selectedRoute.stops.length) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium" style={{ color: "var(--cf-text-muted)" }}>{label}</p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--cf-text-primary)" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Map — path from simulated geodata; buses driven by simulation loop above. */}
            <BusTrackingMap
              routeId={selectedRoute.id}
              routePath={geo.path}
              buses={simulatedBuses}
            />

            {/* Alternatives panel — rendered for each High-crowd arrival on this route */}
            {highCrowdArrivals.map((arrival: BusArrival) => {
              const alternatives = getAlternatives(arrival);
              return (
                <div
                  key={arrival.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(245,158,11,0.07)",
                    border: "1px solid rgba(245,158,11,0.22)",
                  }}
                >
                  <p
                    className="text-xs font-semibold mb-3 flex items-center gap-1.5"
                    style={{ color: "#f59e0b" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    Bus {arrival.busNumber} is High crowd — consider alternatives
                    <span
                      className="ml-auto rounded-full px-1.5 py-0.5"
                      style={{ background: "rgba(245,158,11,0.15)", color: "rgba(245,158,11,0.7)", fontSize: "0.65rem" }}
                    >
                      mock data
                    </span>
                  </p>
                  {alternatives.length > 0 ? (
                    <ul className="space-y-1.5">
                      {alternatives.map((alt) => (
                        <li
                          key={alt.id}
                          className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                              style={{ background: "var(--cf-accent)" }}
                            >
                              {alt.busNumber}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                                {alt.routeName}
                              </p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                                {alt.arrivalMinutes === 0 ? "Now" : `${alt.arrivalMinutes} min`}
                                {alt.availableSeats !== null && ` · ${alt.availableSeats} seats`}
                              </p>
                            </div>
                          </div>
                          <CrowdLevelBadge level={alt.crowdLevel} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-medium" style={{ color: "#92400e" }}>
                      No less-crowded alternative is currently available.
                    </p>
                  )}
                </div>
              );
            })}

            {/* Stop progress */}
            <StopProgress key={selectedRoute.id} route={selectedRoute} />
          </div>
        </div>
      </div>
    );
  }
