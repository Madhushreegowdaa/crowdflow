
"use client";

import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Users,
  TrendingUp,
  BusFront,
  Activity,
  ArrowUpRight,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/analytics/crowd";

interface BusCrowdDetail {
  busId: string;
  busNumber: string;
  routeName: string;
  crowdLevel: string;
  passengerCount: number | null;
  capacity: number | null;
  occupancy: number | null;
}

interface AnalyticsResponse {
  success: boolean;
  analytics: {
    totalBuses: number;
    crowdSummary: {
      low: number;
      medium: number;
      high: number;
      unknown: number;
    };
    busCrowdDetails: BusCrowdDetail[];
  };
}

interface CrowdCount {
  low: number;
  moderate: number;
  high: number;
  unknown: number;
}

const COLORS = {
  low: "#269D83",
  moderate: "#E59A3B",
  high: "#E94F70",
  unknown: "#94A3B8",
};

function getCrowdCounts(buses: BusCrowdDetail[]): CrowdCount {
  const counts: CrowdCount = {
    low: 0,
    moderate: 0,
    high: 0,
    unknown: 0,
  };

  buses.forEach((bus) => {
    const level = String(bus.crowdLevel ?? "").toLowerCase();

    if (level === "low") {
      counts.low++;
    } else if (level === "medium" || level === "moderate") {
      counts.moderate++;
    } else if (level === "high") {
      counts.high++;
    } else {
      counts.unknown++;
    }
  });

  return counts;
}

export default function AnalyticsPage() {
  const [totalBuses, setTotalBuses] = useState(0);
  const [crowdCounts, setCrowdCounts] = useState<CrowdCount>({
    low: 0,
    moderate: 0,
    high: 0,
    unknown: 0,
  });

  const [busDetails, setBusDetails] = useState<BusCrowdDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const result: AnalyticsResponse = await response.json();

        if (!result.success || !result.analytics) {
          throw new Error("Invalid analytics response.");
        }

        const details = result.analytics.busCrowdDetails ?? [];

        setTotalBuses(result.analytics.totalBuses ?? details.length);
        setBusDetails(details);

        // Calculate from individual bus records so "moderate"
        // is correctly counted along with "medium".
        setCrowdCounts(getCrowdCounts(details));
      } catch (err) {
        console.error("Analytics loading error:", err);
        setError(
          "Unable to load crowd analytics. Check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchAnalytics();
    const interval = window.setInterval(() => void fetchAnalytics(), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const crowdDistribution = [
    { name: "Low", value: crowdCounts.low, color: COLORS.low },
    { name: "Moderate", value: crowdCounts.moderate, color: COLORS.moderate },
    { name: "High", value: crowdCounts.high, color: COLORS.high },
    { name: "Unknown", value: crowdCounts.unknown, color: COLORS.unknown },
  ];

  const passengerData = busDetails.map((bus) => ({
    bus: bus.busNumber || bus.busId,
    passengers: Number(bus.passengerCount) || 0,
  }));

  const routeOccupancyData = Object.values(
    busDetails.reduce<Record<string, { route: string; passengers: number; capacity: number }>>(
      (routes, bus) => {
        const routeName = bus.routeName?.trim();
        const passengers = Number(bus.passengerCount);
        const capacity = Number(bus.capacity);
        if (!routeName || !Number.isFinite(passengers) || passengers < 0 || !Number.isFinite(capacity) || capacity <= 0) {
          return routes;
        }
        const route = routes[routeName] ?? { route: routeName, passengers: 0, capacity: 0 };
        route.passengers += passengers;
        route.capacity += capacity;
        routes[routeName] = route;
        return routes;
      },
      {}
    )
  ).map((route) => ({
    ...route,
    occupancy: Number(((route.passengers / route.capacity) * 100).toFixed(1)),
  }));

  const stats = [
    {
      title: "Buses Monitored",
      value: loading ? "..." : String(totalBuses),
      detail: "Retrieved from database",
      icon: BusFront,
      color: "#269D83",
    },
    {
      title: "High Crowd Buses",
      value: loading ? "..." : String(crowdCounts.high),
      detail: "Require attention",
      icon: TrendingUp,
      color: "#E94F70",
    },
    {
      title: "Moderate Crowd Buses",
      value: loading ? "..." : String(crowdCounts.moderate),
      detail: "Moderate passenger load",
      icon: Users,
      color: "#E59A3B",
    },
    {
      title: "Low Crowd Buses",
      value: loading ? "..." : String(crowdCounts.low),
      detail: "Lower passenger load",
      icon: Activity,
      color: "#243F52",
    },
  ];

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
            CrowdFlow / Intelligence
          </p>

          <h1 className="text-4xl font-bold md:text-5xl">
            Crowd Analytics
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            Understand passenger movement, analyse crowd distribution
            and identify transport demand across different routes.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-[#269D83]" />
            Database-connected crowd analytics
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">
          Performance overview
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#172A30] md:text-3xl">
          Passenger Insights
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Review current passenger counts, crowd levels and route occupancy.
        </p>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-[#E94F70]/20 bg-[#FCEBF0] p-4 text-sm text-[#B83250]">
          {error}
        </div>
      )}

      {/* STAT CARDS */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${stat.color}15`,
                    color: stat.color,
                  }}
                >
                  <Icon size={22} />
                </div>

                <ArrowUpRight size={18} className="text-gray-300" />
              </div>

              <p className="mt-5 text-sm text-gray-500">
                {stat.title}
              </p>

              <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
                {stat.value}
              </h3>

              <p className="mt-2 text-xs text-gray-400">
                {stat.detail}
              </p>
            </div>
          );
        })}
      </section>

      {/* CURRENT PASSENGER COUNTS */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#172A30]">
              Current Passengers by Bus
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Passenger counts from the latest bus records
            </p>
          </div>
        </div>

        <div className="h-[310px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading passenger counts…</div>
          ) : passengerData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passengerData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                <XAxis dataKey="bus" tick={{ fill: "#7B8790", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#7B8790", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="passengers" name="Current passengers" fill="#243F52" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">No passenger records are available.</div>
          )}
        </div>
      </section>

      {/* TWO CHARTS */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* CURRENT ROUTE OCCUPANCY */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6">
            <h3 className="font-bold text-[#172A30]">
              Current Occupancy by Route
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Calculated from passenger and capacity records
            </p>
          </div>

          <div className="h-[300px] w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading route occupancy…</div>
            ) : routeOccupancyData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routeOccupancyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAEAEA" />
                  <XAxis type="number" domain={[0, "dataMax"]} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="route" width={130} tick={{ fill: "#596A72", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value}%`, "Occupancy"]} />
                  <Bar dataKey="occupancy" name="Occupancy" fill="#E94F70" radius={[0, 7, 7, 0]} barSize={23} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">No route capacity data is available.</div>
            )}
          </div>
        </div>

        {/* ACTUAL CROWD DISTRIBUTION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-2">
            <h3 className="font-bold text-[#172A30]">
              Crowd Level Distribution
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Actual crowd levels from monitored buses
            </p>
          </div>

          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
              Loading crowd distribution...
            </div>
          ) : (
            <>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={crowdDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                    >
                      {crowdDistribution.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {crowdDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />

                    <span className="text-xs text-gray-600">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* BUS CROWD DETAILS */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h3 className="font-bold text-[#172A30]">
            Bus Crowd Details
          </h3>


        </div>

        {loading ? (
          <p className="p-6 text-sm text-gray-400">
            Loading bus details...
          </p>
        ) : busDetails.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {busDetails.map((bus) => {
              const level = bus.crowdLevel.toLowerCase();

              const color =
                level === "high"
                  ? COLORS.high
                  : level === "low"
                  ? COLORS.low
                  : level === "medium" || level === "moderate"
                  ? COLORS.moderate
                  : COLORS.unknown;

              return (
                <div
                  key={bus.busId}
                  className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-bold text-[#172A30]">
                      {bus.busNumber}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {bus.routeName}
                    </p>
                  </div>

                  <span
                    className="w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize"
                    style={{
                      color,
                      backgroundColor: `${color}18`,
                    }}
                  >
                    {bus.crowdLevel}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-6 text-sm text-gray-500">
            No bus crowd records available.
          </p>
        )}
      </section>

      {/* INSIGHTS */}
      <section className="rounded-2xl bg-[#172A30] p-6 text-white md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#E94F70]">
            <Activity size={23} />
          </div>

          <div>
            <h3 className="font-bold">Crowd Insights</h3>
            <p className="mt-1 text-xs text-white/60">
              Current observations from database records
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <BusFront size={19} className="text-[#E94F70]" />
            <p className="mt-3 text-sm font-semibold">High Crowd Buses</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              {loading
                ? "Loading..."
                : `${crowdCounts.high} bus(es) currently classified as high crowd.`}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <Users size={19} className="text-[#269D83]" />
            <p className="mt-3 text-sm font-semibold">Low Crowd Buses</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              {loading
                ? "Loading..."
                : `${crowdCounts.low} bus(es) currently classified as low crowd.`}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <TrendingUp size={19} className="text-[#E59A3B]" />
            <p className="mt-3 text-sm font-semibold">Unclassified Buses</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              {loading
                ? "Loading..."
                : `${crowdCounts.unknown} bus(es) have an unrecognized crowd classification.`}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
