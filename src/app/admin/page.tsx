"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BusFront,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DASHBOARD_API = "http://localhost:5000/api/dashboard/stats";
const ROUTE_DEMAND_API = "http://localhost:5000/api/dashboard/route-demand";
const ALERTS_API = "http://localhost:5000/api/alerts";

const crowdColors = {
  low: "#269D83",
  moderate: "#E59A3B",
  high: "#E94F70",
  unknown: "#94A3B8",
};

type DashboardStatistics = {
  totalBuses: number;
  delayedBuses: number;
  highCrowdBuses: number;
  totalRoutes: number;
  totalStops: number;
  statusBreakdown: Record<string, number>;
  crowdBreakdown: Record<string, number>;
};

type ApiAlert = {
  id: string;
  bus_id: string | null;
  alert_type: string;
  message: string;
  severity: string;
  status: string;
  created_at: string;
};

type RouteOccupancy = {
  route_name: string;
  current_bus_count: number;
  current_passengers: number;
  total_capacity: number;
  occupancy_percent: number;
};

function formatAlertTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function getOnTimeCount(statusBreakdown: Record<string, number>) {
  return Object.entries(statusBreakdown).reduce(
    (total, [status, count]) => total + (status.trim().toLowerCase() === "on time" ? count : 0),
    0
  );
}

export default function AdminDashboard() {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [routeOccupancy, setRouteOccupancy] = useState<RouteOccupancy[]>([]);
  const [routeUpdatedAt, setRouteUpdatedAt] = useState("");
  const [skippedRoutes, setSkippedRoutes] = useState<string[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [alertsError, setAlertsError] = useState("");
  const [routeError, setRouteError] = useState("");

  const loadRouteOccupancy = useCallback(async (silent = false) => {
    if (!silent) setRouteLoading(true);
    setRouteError("");
    try {
      const response = await fetch(ROUTE_DEMAND_API, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.routes)) {
        throw new Error(result.message || "Current route occupancy is unavailable.");
      }
      setRouteOccupancy(result.routes as RouteOccupancy[]);
      setRouteUpdatedAt(typeof result.as_of === "string" ? result.as_of : "");
      setSkippedRoutes(Array.isArray(result.skipped_routes) ? result.skipped_routes : []);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : "Unable to load current route occupancy.");
    } finally {
      setRouteLoading(false);
    }
  }, []);

  const loadOverview = useCallback(async (silent = false) => {
    if (!silent) {
      setStatsLoading(true);
      setAlertsLoading(true);
    }
    setStatsError("");
    setAlertsError("");
    void loadRouteOccupancy(silent);

    const [statsResult, alertsResult] = await Promise.allSettled([
      fetch(DASHBOARD_API, { cache: "no-store" }),
      fetch(ALERTS_API, { cache: "no-store" }),
    ]);

    if (statsResult.status === "rejected") {
      setStatsError("Could not connect to dashboard statistics.");
    } else {
      try {
        const response = statsResult.value;
        const result = await response.json();
        if (!response.ok || !result.success || !result.statistics) {
          throw new Error(result.message || "Dashboard statistics are unavailable.");
        }
        setStatistics(result.statistics as DashboardStatistics);
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : "Unable to load dashboard statistics.");
      }
    }
    setStatsLoading(false);

    if (alertsResult.status === "rejected") {
      setAlertsError("Could not connect to recent alerts.");
    } else {
      try {
        const response = alertsResult.value;
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.alerts)) {
          throw new Error(result.message || "Recent alerts are unavailable.");
        }
        setAlerts(result.alerts as ApiAlert[]);
      } catch (error) {
        setAlertsError(error instanceof Error ? error.message : "Unable to load recent alerts.");
      }
    }
    setAlertsLoading(false);
  }, [loadRouteOccupancy]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadOverview();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadOverview]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadOverview(true);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [loadOverview]);

  const crowdData = useMemo(() => {
    const breakdown = statistics?.crowdBreakdown ?? {};
    const counts = { low: 0, moderate: 0, high: 0, unknown: 0 };
    for (const [label, count] of Object.entries(breakdown)) {
      const normalized = label.trim().toLowerCase();
      if (normalized === "low") counts.low += count;
      else if (normalized === "medium" || normalized === "moderate") counts.moderate += count;
      else if (normalized === "high") counts.high += count;
      else counts.unknown += count;
    }
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return (Object.entries(counts) as [keyof typeof counts, number][]).map(([name, count]) => ({
      name: name[0].toUpperCase() + name.slice(1),
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      count,
      color: crowdColors[name],
    }));
  }, [statistics]);

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.status?.toLowerCase() !== "resolved").slice(0, 3),
    [alerts]
  );

  const fleetStatusData = Object.entries(statistics?.statusBreakdown ?? {}).map(
    ([status, buses]) => ({ status, buses })
  );

  const stats = [
    {
      title: "Total Buses",
      value: statistics?.totalBuses,
      change: "Registered in the database",
      icon: BusFront,
      color: "#E94F70",
      bg: "#FCE8ED",
    },
    {
      title: "On-Time Buses",
      value: statistics ? getOnTimeCount(statistics.statusBreakdown ?? {}) : undefined,
      change: "Current fleet status",
      icon: Activity,
      color: "#269D83",
      bg: "#E3F4EF",
    },
    {
      title: "Delayed Buses",
      value: statistics?.delayedBuses,
      change: "Current fleet status",
      icon: Clock,
      color: "#E59A3B",
      bg: "#FFF1DD",
    },
    {
      title: "High Crowd",
      value: statistics?.highCrowdBuses,
      change: "Current crowd level",
      icon: Users,
      color: "#8B72CC",
      bg: "#F0EBFA",
    },
  ];

  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-2xl bg-[#172A30] bg-cover bg-center px-6 py-12 md:px-10 md:py-16"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(15,35,40,0.94), rgba(15,35,40,0.45)), url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1600')",
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold tracking-wider text-white">
            <span className="h-2 w-2 rounded-full bg-[#269D83]" /> TRANSPORT OPERATIONS
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-white md:text-5xl">Welcome to CrowdFlow</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-gray-200 md:text-base">
            Monitor your transport network, track fleet activity and review current passenger crowd levels.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/admin/fleet" className="flex items-center gap-2 rounded-full bg-[#E94F70] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#d83e60]">
              Explore Fleet <ArrowRight size={17} />
            </Link>
            <Link href="/admin/analytics" className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              View Analytics
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E94F70]">OVERVIEW</p>
          <h2 className="mt-2 text-2xl font-bold text-[#172A30]">Transport Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">Current fleet and crowd summaries from Supabase.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[#269D83]/20 bg-[#EAF5F1] px-4 py-2 text-xs text-[#176B59]">
            Current backend data
          </span>
          <button type="button" onClick={() => void loadOverview()} disabled={statsLoading || alertsLoading} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-[#243F52] hover:bg-gray-50 disabled:opacity-50">
            {statsLoading || alertsLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {(statsError || alertsError) && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{[statsError, alertsError].filter(Boolean).join(" ")}</p>
          <button type="button" onClick={() => void loadOverview()} className="mt-2 font-semibold underline">Retry loading dashboard data</button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: stat.bg }}>
                  <Icon size={23} style={{ color: stat.color }} />
                </div>
                <ArrowUpRight size={19} className="text-gray-300" />
              </div>
              <p className="mt-5 text-sm text-gray-500">{stat.title}</p>
              <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
                {statsLoading ? "…" : statsError ? "—" : stat.value ?? 0}
              </h3>
              <p className="mt-2 text-xs text-gray-400">{stat.change}</p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#172A30]">Fleet Status</h3>
              <p className="mt-1 text-xs text-gray-400">Bus counts grouped by current status</p>
            </div>
          </div>
          <div className="mt-6 h-[280px] w-full">
            {statsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading fleet status…</div>
            ) : statsError ? (
              <div className="flex h-full items-center justify-center text-sm text-red-600">Fleet status unavailable.</div>
            ) : fleetStatusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fleetStatusData}>
                  <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: "#596A72", fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#7B8790", fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="buses" name="Buses" fill="#E94F70" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">No fleet status records are available.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#172A30]">Crowd Distribution</h3>
          <p className="mt-1 text-xs text-gray-400">Current bus crowd labels from the database</p>
          {statsLoading ? (
            <div className="flex h-[210px] items-center justify-center text-sm text-gray-400">Loading crowd summary…</div>
          ) : statsError ? (
            <div className="flex h-[210px] items-center justify-center text-center text-sm text-red-600">Crowd summary unavailable.</div>
          ) : statistics?.totalBuses ? (
            <>
              <div className="relative mt-5 h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={crowdData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4} stroke="none">
                      {crowdData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#172A30]">{statistics.totalBuses}</span>
                  <span className="text-xs text-gray-400">buses</span>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {crowdData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-[#172A30]">{item.count} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[210px] items-center justify-center text-sm text-gray-400">No bus crowd records are available.</div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#172A30]">Current Route Occupancy</h3>
              <p className="mt-1 text-xs text-gray-400">Passenger-to-capacity ratio by route</p>
            </div>
            <MapPin size={21} className="text-[#E94F70]" />
          </div>
          {routeUpdatedAt && !routeLoading && (
            <p className="mt-3 text-[11px] text-gray-400">
              Snapshot: {formatAlertTime(routeUpdatedAt)}
            </p>
          )}
          {routeLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading current route data…</div>
          ) : routeError ? (
            <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              <p>{routeError}</p>
              <button type="button" onClick={() => void loadRouteOccupancy()} className="mt-2 font-semibold underline">Retry</button>
            </div>
          ) : routeOccupancy.length ? (
            <div className="mt-7 space-y-6">
              {routeOccupancy.map((route) => {
                const fill = route.occupancy_percent >= 85
                  ? "#E94F70"
                  : route.occupancy_percent >= 60
                    ? "#E59A3B"
                    : "#269D83";
                return (
                  <div key={route.route_name}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-gray-600">{route.route_name}</span>
                      <span className="text-sm font-semibold text-[#172A30]">{route.occupancy_percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(route.occupancy_percent, 100)}%`, backgroundColor: fill }} />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                      {route.current_passengers} / {route.total_capacity} passengers · {route.current_bus_count} {route.current_bus_count === 1 ? "bus" : "buses"}
                    </p>
                  </div>
                );
              })}
              {skippedRoutes.length > 0 && (
                <p className="text-xs text-gray-400">
                  Occupancy is unavailable for {skippedRoutes.length} route{skippedRoutes.length === 1 ? "" : "s"} with incomplete passenger or capacity data.
                </p>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-500">
              No route has complete passenger and capacity records yet.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#172A30]">Recent Alerts</h3>
              <p className="mt-1 text-xs text-gray-400">Latest active notifications from the database</p>
            </div>
            <Bell size={21} className="text-[#E94F70]" />
          </div>
          {alertsLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading recent alerts…</div>
          ) : alertsError ? (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{alertsError}</div>
          ) : activeAlerts.length ? (
            <div className="mt-6 space-y-5">
              {activeAlerts.map((alert) => {
                const isCrowd = /crowd|occupancy/i.test(alert.alert_type);
                const isDelay = /delay/i.test(alert.alert_type);
                const color = alert.severity.toLowerCase() === "high" || alert.severity.toLowerCase() === "critical"
                  ? "#E94F70"
                  : alert.severity.toLowerCase() === "medium"
                    ? "#E59A3B"
                    : "#269D83";
                const Icon = isCrowd ? Users : isDelay ? Clock : isHighSeverity(alert.severity) ? AlertTriangle : TrendingUp;
                return (
                  <div key={alert.id} className="flex items-start gap-3 border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18` }}>
                      <Icon size={19} style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#172A30]">{alert.alert_type}</p>
                        <span className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{ color, backgroundColor: `${color}18` }}>{alert.severity}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{alert.message}</p>
                      <p className="mt-2 text-xs text-gray-400">{alert.bus_id || "Bus not specified"} · {formatAlertTime(alert.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto text-[#269D83]" size={30} />
              <p className="mt-3 text-sm font-semibold text-[#172A30]">No active alerts</p>
              <p className="mt-1 text-xs text-gray-500">There are no unresolved alerts in the database.</p>
            </div>
          )}
          <Link href="/admin/alerts" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#E94F70] hover:gap-3">
            View all alerts <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 py-5 text-xs text-gray-400">
        <p>© 2026 CrowdFlow. Transit Intelligence Platform.</p>
        <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#269D83]" /> Current operating summary</p>
      </footer>
    </div>
  );
}

function isHighSeverity(value: string) {
  return value.toLowerCase() === "high" || value.toLowerCase() === "critical";
}
