
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  BusFront,
  Users,
  Gauge,
  CheckCircle2,
  Bell,
  MapPin,
  Filter,
  RefreshCw,
} from "lucide-react";

interface ApiAlert {
  id: string;
  bus_id: string | null;
  alert_type: string;
  message: string;
  severity: string;
  status: string;
  created_at: string;
  resolved_at?: string | null;
}

type AlertFilter = "All" | "High Crowd" | "Bus Delayed" | "Speed Alert";

const API_URL = "/admin-api/alerts";

function getAlertIcon(type: string) {
  const value = type.toLowerCase();

  if (value.includes("crowd") || value.includes("occupancy")) return Users;
  if (value.includes("speed")) return Gauge;
  if (value.includes("delay")) return Clock;

  return AlertTriangle;
}

function getSeverityColor(severity: string) {
  const value = severity.toLowerCase();

  if (value === "high" || value === "critical") {
    return "bg-[#FCEBF0] text-[#E94F70]";
  }

  if (value === "medium") {
    return "bg-[#FFF3E2] text-[#B97719]";
  }

  return "bg-[#EAF0F2] text-[#243F52]";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [filter, setFilter] = useState<AlertFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  async function fetchAlerts(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load alerts.");
      }

      setAlerts(Array.isArray(result.alerts) ? result.alerts : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the alerts API."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchAlerts(true);
    }, 0);

    const interval = window.setInterval(() => void fetchAlerts(false), 30_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  async function resolveAlert(id: string) {
    try {
      setResolvingId(id);
      setActionMessage("");

      const response = await fetch(`${API_URL}/${id}/resolve`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not resolve alert.");
      }

      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          alert.id === id
            ? {
                ...alert,
                status: "resolved",
                resolved_at: result.alert?.resolved_at ?? new Date().toISOString(),
              }
            : alert
        )
      );

      setActionMessage("Alert successfully resolved and saved to the database.");
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Failed to resolve alert."
      );
    } finally {
      setResolvingId(null);
    }
  }

  const activeAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) => alert.status?.toLowerCase() !== "resolved"
      ),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    if (filter === "All") return activeAlerts;

    return activeAlerts.filter((alert) => {
      const type = alert.alert_type.toLowerCase();

      if (filter === "High Crowd") {
        return type.includes("crowd") || type.includes("occupancy");
      }

      if (filter === "Bus Delayed") {
        return type.includes("delay");
      }

      if (filter === "Speed Alert") {
        return type.includes("speed");
      }

      return true;
    });
  }, [activeAlerts, filter]);

  const highPriority = activeAlerts.filter(
    (alert) =>
      alert.severity?.toLowerCase() === "high" ||
      alert.severity?.toLowerCase() === "critical"
  ).length;

  const mediumPriority = activeAlerts.filter(
    (alert) => alert.severity?.toLowerCase() === "medium"
  ).length;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section
        className="relative flex min-h-[270px] items-end overflow-hidden rounded-2xl bg-cover bg-center px-7 py-9 md:px-12 md:py-12"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(23,42,48,0.95), rgba(23,42,48,0.45)), url('https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <div className="relative max-w-2xl text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#E94F70]">
            CrowdFlow / Monitoring
          </p>

          <h1 className="text-4xl font-bold md:text-5xl">
            Alerts & Notifications
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            Monitor overcrowding, delayed buses and vehicle
            conditions across your transport network.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
            <Bell size={14} className="text-[#E94F70]" />
            Database-connected alerts
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">
          Fleet monitoring
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#172A30] md:text-3xl">
              Alert Centre
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Review alerts retrieved from the CrowdFlow database.
            </p>
          </div>

          <button
            onClick={() => void fetchAlerts()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#172A30] hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <AlertTriangle className="text-[#E94F70]" size={24} />
          <p className="mt-4 text-sm text-gray-500">High Priority</p>
          <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
            {loading ? "—" : highPriority}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <Clock className="text-[#E59A3B]" size={24} />
          <p className="mt-4 text-sm text-gray-500">Medium Priority</p>
          <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
            {loading ? "—" : mediumPriority}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <CheckCircle2 className="text-[#269D83]" size={24} />
          <p className="mt-4 text-sm text-gray-500">Active Alerts</p>
          <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
            {loading ? "—" : activeAlerts.length}
          </h3>
        </div>
      </section>

      {/* ALERT LIST */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#172A30]">Recent Alerts</h3>
            <p className="mt-1 text-xs text-gray-500">
              {loading ? "Loading alerts..." : `${filteredAlerts.length} alerts displayed`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-gray-400" />

            {(["All", "High Crowd", "Bus Delayed", "Speed Alert"] as AlertFilter[]).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    filter === item
                      ? "bg-[#172A30] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        {actionMessage && (
          <p className="mt-4 rounded-lg bg-[#EAF0F2] p-3 text-sm text-[#243F52]">
            {actionMessage}
          </p>
        )}

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Loading alerts from the database...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
              <AlertTriangle className="mx-auto text-red-500" size={30} />
              <p className="mt-3 font-semibold text-red-700">
                Could not load alerts
              </p>
              <p className="mt-2 text-sm text-red-600">{error}</p>
              <button
                onClick={() => void fetchAlerts()}
                className="mt-4 rounded-lg bg-[#172A30] px-4 py-2 text-xs font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const Icon = getAlertIcon(alert.alert_type);

              return (
                <div
                  key={alert.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getSeverityColor(alert.severity)}`}
                    >
                      <Icon size={23} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-[#172A30]">
                          {alert.alert_type}
                        </h4>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity} Priority
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {alert.message}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <BusFront size={13} />
                          {alert.bus_id || "Bus not specified"}
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          Location not provided
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {formatDate(alert.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => resolveAlert(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="shrink-0 rounded-lg bg-[#172A30] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#243F52] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resolvingId === alert.id
                      ? "Resolving..."
                      : "Mark Resolved"}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto text-[#269D83]" size={35} />

              <p className="mt-3 font-semibold text-[#172A30]">
                No active alerts found
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {activeAlerts.length === 0
                  ? "There are currently no active alerts in the database."
                  : "No alerts match this filter."}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-sm leading-6 text-[#243F52]">
        <strong>Database integration:</strong> Alerts are retrieved from
        Supabase. Resolving an alert updates its status and resolution
        timestamp in the database.
      </div>
    </div>
  );
}
