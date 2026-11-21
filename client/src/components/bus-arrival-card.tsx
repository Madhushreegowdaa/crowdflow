import Link from "next/link";
import type { BusArrival } from "@/lib/mock-data";
import { getAlternatives } from "@/lib/mock-data";
import CrowdLevelBadge from "./crowd-level-badge";

export default function BusArrivalCard({ arrival }: { arrival: BusArrival }) {
  const isUrgent     = arrival.arrivalMinutes <= 5;
  const isSoon       = arrival.arrivalMinutes <= 10;
  const etaColor     = isUrgent ? "var(--cf-accent)" : isSoon ? "#f59e0b" : "var(--cf-text-primary)";
  const alternatives = getAlternatives(arrival);

  return (
    <article
      className="cf-card flex flex-col"
      style={{ padding: 0 }}
    >
      {/* Card header — coral accent strip */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--cf-dark-2)",
          borderRadius: "var(--cf-radius-lg) var(--cf-radius-lg) 0 0",
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Bus number badge */}
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: "var(--cf-accent)" }}
          >
            {arrival.busNumber}
          </span>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{arrival.routeName}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              {arrival.origin} → {arrival.destination}
            </p>
          </div>
        </div>
        <CrowdLevelBadge level={arrival.crowdLevel} />
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-3 px-4 py-4">
        {/* ETA row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--cf-text-muted)" }}>Arrives in</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: etaColor }}>
                {arrival.arrivalMinutes === 0 ? "Now" : `${arrival.arrivalMinutes} min`}
              </p>
            </div>
            <div
              style={{
                width: 1,
                height: 32,
                background: "var(--cf-border)",
              }}
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--cf-text-muted)" }}>Scheduled</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--cf-text-primary)" }}>
                {arrival.scheduledTime}
              </p>
            </div>
            {arrival.availableSeats !== null && (
              <>
                <div style={{ width: 1, height: 32, background: "var(--cf-border)" }} aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--cf-text-muted)" }}>Seats</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--cf-text-primary)" }}>
                    {arrival.availableSeats}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Track button */}
        <Link
          href={`/track?route=${arrival.routeId}`}
          className="cf-btn-primary w-full justify-center text-center"
          style={{ padding: "9px 0", fontSize: "0.8125rem" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          Track this bus
        </Link>

        {/* Alternative suggestions — shown for all High crowd arrivals */}
        {arrival.crowdLevel === "High" && (
          <div
            className="rounded-xl p-3 mt-1"
            style={{
              background: "rgba(245,158,11,0.07)",
              border: "1px solid rgba(245,158,11,0.22)",
            }}
          >
            <p
              className="text-xs font-semibold mb-2 flex items-center gap-1.5"
              style={{ color: "#f59e0b" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              High crowd — consider alternatives
              <span
                className="ml-auto rounded-full px-1.5 py-0.5 text-xs"
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
        )}
      </div>
    </article>
  );
}
