
"use client";

import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

const API_URL = "/admin-api/analytics/crowd";

interface BusCrowdDetail {
  busId: string;
  busNumber: string;
  routeName: string;
  crowdLevel: string | null;
  passengerCount: number | null;
  capacity: number | null;
  occupancy: number | null;
  historySampleCount: number;
  historicalAverageOccupancy: number | null;
  lastRecordedAt: string | null;
  prediction: {
    predictionAvailable: boolean;
    reason?: string;
    predictedOccupancyPercent?: number;
    predictedCrowdLevel?: string;
    sampleCount?: number;
    horizonMinutes?: number;
  };
}

interface RouteCrowdStat {
  routeName: string;
  busCount: number;
  currentPassengers: number;
  totalCapacity: number;
  currentOccupancyPercent: number | null;
  historySampleCount: number;
  historicalAverageOccupancy: number | null;
  historicalPeakOccupancy: number | null;
}

interface HistoricalCrowdPoint {
  routeName: string;
  bucketStart: string;
  sampleCount: number;
  averageOccupancy: number;
}

interface AnalyticsResponse {
  success: boolean;
  predictionMeta: {
    status: "available" | "insufficient_history" | "unavailable";
    method: string;
    horizonMinutes: number;
    message: string;
  };
  analytics: {
    totalBuses: number;
    crowdSummary: {
      low: number;
      moderate: number;
      high: number;
      veryHigh: number;
      unknown: number;
    };
    busCrowdDetails: BusCrowdDetail[];
    routeCrowdStats: RouteCrowdStat[];
    historicalCrowd: HistoricalCrowdPoint[];
  };
}

interface CrowdCount {
  low: number;
  moderate: number;
  high: number;
  veryHigh: number;
  unknown: number;
}

const COLORS = {
  low: "#269D83",
  moderate: "#E59A3B",
  high: "#E94F70",
  veryHigh: "#8B1E3F",
  unknown: "#94A3B8",
};

export default function AnalyticsPage() {
  const [totalBuses, setTotalBuses] = useState(0);
  const [crowdCounts, setCrowdCounts] = useState<CrowdCount>({
    low: 0,
    moderate: 0,
    high: 0,
    veryHigh: 0,
    unknown: 0,
  });

  const [busDetails, setBusDetails] = useState<BusCrowdDetail[]>([]);
  const [routeStats, setRouteStats] = useState<RouteCrowdStat[]>([]);
  const [historicalCrowd, setHistoricalCrowd] = useState<HistoricalCrowdPoint[]>([]);
  const [predictionMeta, setPredictionMeta] =
    useState<AnalyticsResponse["predictionMeta"] | null>(null);
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
        setRouteStats(result.analytics.routeCrowdStats ?? []);
        setHistoricalCrowd(result.analytics.historicalCrowd ?? []);
        setPredictionMeta(result.predictionMeta);
        setCrowdCounts({
          low: result.analytics.crowdSummary.low ?? 0,
          moderate: result.analytics.crowdSummary.moderate ?? 0,
          high: result.analytics.crowdSummary.high ?? 0,
          veryHigh: result.analytics.crowdSummary.veryHigh ?? 0,
          unknown: result.analytics.crowdSummary.unknown ?? 0,
        });
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
    { name: "Very high", value: crowdCounts.veryHigh, color: COLORS.veryHigh },
    { name: "Unknown", value: crowdCounts.unknown, color: COLORS.unknown },
  ];

  const passengerData = busDetails.map((bus) => ({
    bus: bus.busNumber || bus.busId,
    passengers: bus.passengerCount,
  }));

  const routeOccupancyData = routeStats
    .filter((route) => route.currentOccupancyPercent !== null)
    .map((route) => ({
      route: route.routeName,
      occupancy: route.currentOccupancyPercent,
      historical: route.historicalAverageOccupancy,
    }));

  const historicalChartData = Object.values(
    historicalCrowd.reduce<
      Record<
        string,
        {
          time: string;
          bucketStart: string;
          weightedOccupancy: number;
          sampleCount: number;
        }
      >
    >((buckets, point) => {
      const bucket =
        buckets[point.bucketStart] ??
        {
          time: new Date(point.bucketStart).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          bucketStart: point.bucketStart,
          weightedOccupancy: 0,
          sampleCount: 0,
        };
      bucket.weightedOccupancy += point.averageOccupancy * point.sampleCount;
      bucket.sampleCount += point.sampleCount;
      buckets[point.bucketStart] = bucket;
      return buckets;
    }, {}),
  ).map((bucket) => ({
    ...bucket,
    averageOccupancy:
      bucket.sampleCount > 0
        ? Number((bucket.weightedOccupancy / bucket.sampleCount).toFixed(1))
        : 0,
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
      title: "High / Very High Crowd Buses",
      value: loading ? "..." : String(crowdCounts.high + crowdCounts.veryHigh),
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
            Demo/simulated readings are present; database provenance is untracked
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
          Review current bus records alongside historical crowd logs and trend estimates.
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
                <Tooltip
                  formatter={(value) =>
                    value === null || value === undefined
                      ? ["Unavailable", "Current passengers"]
                      : [`${value}`, "Current passengers"]
                  }
                />
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
                  <Bar dataKey="occupancy" name="Current occupancy" fill="#E94F70" radius={[0, 7, 7, 0]} barSize={16} />
                  <Bar dataKey="historical" name="Historical average" fill="#269D83" radius={[0, 7, 7, 0]} barSize={16} />
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
              Categories derive from occupancy; demo readings may be simulated
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h3 className="font-bold text-[#172A30]">Historical crowd trend</h3>
            <p className="mt-1 text-xs text-gray-500">
              The current 20 seeded readings are simulated demo data. crowd_logs has no source field to distinguish these from future verified measurements.
            </p>
          </div>
          {loading ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
              Loading historical crowd logs…
            </div>
          ) : historicalChartData.length ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, "Average occupancy"]} />
                  <Line
                    type="monotone"
                    dataKey="averageOccupancy"
                    name="Recorded average occupancy"
                    stroke="#269D83"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
              No historical crowd logs are available. No history-based prediction is shown.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h3 className="font-bold text-[#172A30]">Route crowd history</h3>
            <p className="mt-1 text-xs text-gray-500">
              Averages and peaks use stored observations only; seeded or simulated rows may be present.
            </p>
          </div>
          {routeStats.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-2 pr-3">Route</th>
                    <th className="py-2 pr-3">Samples</th>
                    <th className="py-2 pr-3">Average</th>
                    <th className="py-2">Peak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routeStats.map((route) => (
                    <tr key={route.routeName}>
                      <td className="py-3 pr-3 font-medium text-[#172A30]">
                        {route.routeName}
                      </td>
                      <td className="py-3 pr-3">{route.historySampleCount}</td>
                      <td className="py-3 pr-3">
                        {route.historicalAverageOccupancy === null
                          ? "—"
                          : `${route.historicalAverageOccupancy}%`}
                      </td>
                      <td className="py-3">
                        {route.historicalPeakOccupancy === null
                          ? "—"
                          : `${route.historicalPeakOccupancy}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No route statistics are available.</p>
          )}
        </div>
      </section>

      {/* BUS CROWD DETAILS */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h3 className="font-bold text-[#172A30]">
            Bus crowd history and trend estimates
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {predictionMeta
              ? `${predictionMeta.message} Forecast method: ${predictionMeta.method}, ${predictionMeta.horizonMinutes}-minute horizon.`
              : "Loading prediction status…"}
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-gray-400">
            Loading bus details...
          </p>
        ) : busDetails.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {busDetails.map((bus) => {
              const level = (bus.crowdLevel ?? "").toLowerCase();

              const color =
                level === "very high"
                  ? COLORS.veryHigh
                  : level === "high"
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
                    <p className="mt-1 text-xs text-gray-500">
                      {bus.historySampleCount} historical sample(s)
                      {bus.historicalAverageOccupancy === null
                        ? ""
                        : ` · ${bus.historicalAverageOccupancy}% historical average`}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span
                      className="w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize"
                      style={{
                        color,
                        backgroundColor: `${color}18`,
                      }}
                    >
                      Stored:{" "}
                      {!bus.crowdLevel ||
                      ["unknown", "unrecognized", "unavailable"].includes(
                        bus.crowdLevel.toLowerCase()
                      )
                        ? "Unavailable"
                        : bus.crowdLevel}
                    </span>
                    {bus.prediction.predictionAvailable ? (
                      <span className="text-xs font-semibold text-[#006d6d]">
                        Trend estimate: {bus.prediction.predictedCrowdLevel} ·{" "}
                        {bus.prediction.predictedOccupancyPercent}% in{" "}
                        {bus.prediction.horizonMinutes} min
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Estimate unavailable: {bus.prediction.reason?.replaceAll("_", " ") || "insufficient history"}
                      </span>
                    )}
                  </div>
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
                : `${crowdCounts.unknown} bus(es) have unavailable crowd readings.`}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
