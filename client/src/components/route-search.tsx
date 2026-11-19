"use client";

import { useState } from "react";
import Link from "next/link";
import { searchRoutes } from "@/lib/mock-data";
import type { BusRoute } from "@/lib/mock-data";
import CrowdLevelBadge from "./crowd-level-badge";

interface RouteSearchProps {
  /** When true, renders dark glass inputs for use on the hero section */
  dark?: boolean;
}

export default function RouteSearch({ dark = false }: RouteSearchProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [results, setResults] = useState<BusRoute[] | null>(null);
  const [error, setError] = useState("");

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
    setResults(null);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!origin.trim() && !destination.trim()) {
      setError("Please enter an origin, destination, or both.");
      return;
    }
    setError("");
    setResults(searchRoutes(origin, destination));
  }

  function handleReset() {
    setOrigin("");
    setDestination("");
    setResults(null);
    setError("");
  }

  const inputClass = dark ? "cf-input-dark" : "cf-input";
  const labelStyle: React.CSSProperties = dark
    ? { color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, display: "block" }
    : { color: "var(--cf-text-secondary)", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, display: "block" };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} noValidate>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

          {/* From */}
          <div className="flex-1">
            <label htmlFor="origin" style={labelStyle}>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                </svg>
                From
              </span>
            </label>
            <input
              id="origin"
              type="text"
              value={origin}
              onChange={(e) => { setOrigin(e.target.value); setError(""); }}
              placeholder="e.g. Central Station"
              className={inputClass}
              aria-describedby={error ? "search-error" : undefined}
            />
          </div>

          {/* Swap */}
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap origin and destination"
            className="self-end sm:self-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2"
            style={{
              background: dark ? "rgba(255,255,255,0.12)" : "var(--cf-surface-3)",
              border: dark ? "1.5px solid rgba(255,255,255,0.2)" : "1.5px solid var(--cf-border)",
              color: dark ? "rgba(255,255,255,0.7)" : "var(--cf-text-secondary)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>

          {/* To */}
          <div className="flex-1">
            <label htmlFor="destination" style={labelStyle}>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2" />
                </svg>
                To
              </span>
            </label>
            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setError(""); }}
              placeholder="e.g. University Campus"
              className={inputClass}
            />
          </div>

          {/* Search button */}
          <button type="submit" className="cf-btn-primary shrink-0" style={{ height: 44, paddingLeft: 28, paddingRight: 28 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            Search
          </button>
        </div>

        {error && (
          <p id="search-error" role="alert" className="mt-2 text-sm" style={{ color: "var(--cf-accent)" }}>
            {error}
          </p>
        )}
      </form>

      {/* Results */}
      {results !== null && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: dark ? "rgba(255,255,255,0.8)" : "var(--cf-text-primary)" }}>
              {results.length === 0 ? "No routes found" : `${results.length} route${results.length !== 1 ? "s" : ""} found`}
            </p>
            <button
              onClick={handleReset}
              className="text-xs font-medium focus:outline-none focus:ring-1 rounded"
              style={{ color: "var(--cf-accent)" }}
            >
              Clear ×
            </button>
          </div>

          {results.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: dark ? "rgba(255,255,255,0.06)" : "var(--cf-surface-3)",
                border: dark ? "1px dashed rgba(255,255,255,0.15)" : "1px dashed var(--cf-border)",
              }}
            >
              <p className="text-sm" style={{ color: dark ? "rgba(255,255,255,0.5)" : "var(--cf-text-muted)" }}>
                No matching routes found. Try different stop names.
              </p>
              <Link href="/routes" className="cf-btn-outline-dark mt-4 inline-flex">
                Browse all routes →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {results.map((route) => (
                <li
                  key={route.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: dark ? "rgba(255,255,255,0.08)" : "var(--cf-surface)",
                    border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid var(--cf-border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ background: "var(--cf-accent)" }}
                      >
                        {route.number}
                      </span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: dark ? "#fff" : "var(--cf-text-primary)" }}>
                          {route.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: dark ? "rgba(255,255,255,0.45)" : "var(--cf-text-muted)" }}>
                          {route.origin} → {route.destination}
                        </p>
                      </div>
                    </div>
                    <CrowdLevelBadge level={route.crowdLevel} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-3" style={{ borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--cf-border)" }}>
                    <span className="cf-stat-chip">⏱ {route.durationMinutes} min</span>
                    <span className="cf-stat-chip">🔄 {route.frequency}</span>
                    <span className="cf-stat-chip">🕐 {route.operatingHours}</span>
                    <Link
                      href={`/track?route=${route.id}`}
                      className="cf-btn-outline-dark ml-auto"
                      style={{ padding: "5px 14px", fontSize: "0.75rem" }}
                    >
                      Track →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
