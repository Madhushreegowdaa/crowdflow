
"use client";

import {
  BusFront,
  Activity,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  MapPin,
  TrendingUp,
  ArrowRight,
  Bell,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const stats = [
  {
    title: "Total Buses",
    value: "128",
    change: "Fleet registered",
    icon: BusFront,
    color: "#E94F70",
    bg: "#FCE8ED",
  },
  {
    title: "Active Buses",
    value: "96",
    change: "75% of total fleet",
    icon: Activity,
    color: "#269D83",
    bg: "#E3F4EF",
  },
  {
    title: "Delayed Buses",
    value: "12",
    change: "Needs attention",
    icon: Clock,
    color: "#E59A3B",
    bg: "#FFF1DD",
  },
  {
    title: "High Crowd",
    value: "8",
    change: "High occupancy",
    icon: Users,
    color: "#8B72CC",
    bg: "#F0EBFA",
  },
];

const fleetData = [
  { time: "6 AM", active: 32, delayed: 4 },
  { time: "8 AM", active: 68, delayed: 8 },
  { time: "10 AM", active: 82, delayed: 5 },
  { time: "12 PM", active: 76, delayed: 7 },
  { time: "2 PM", active: 88, delayed: 4 },
  { time: "4 PM", active: 92, delayed: 9 },
  { time: "6 PM", active: 96, delayed: 12 },
];

const crowdData = [
  { name: "Low", value: 35, color: "#269D83" },
  { name: "Moderate", value: 40, color: "#E9B44C" },
  { name: "High", value: 25, color: "#E94F70" },
];

const routeData = [
  { name: "Mangaluru - Surathkal", demand: 88 },
  { name: "Mangaluru - Udupi", demand: 72 },
  { name: "State Bank - Pumpwell", demand: 64 },
  { name: "Mangaluru - Mulki", demand: 48 },
];

const alerts = [
  {
    bus: "BUS102",
    message: "High passenger occupancy detected",
    time: "10 minutes ago",
    type: "Crowd",
    color: "#E94F70",
  },
  {
    bus: "BUS115",
    message: "Bus running behind schedule",
    time: "25 minutes ago",
    type: "Delay",
    color: "#E59A3B",
  },
  {
    bus: "BUS108",
    message: "Route demand is increasing",
    time: "40 minutes ago",
    type: "Demand",
    color: "#269D83",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">

      {/* Welcome Banner */}
      <section
        className="relative overflow-hidden rounded-2xl bg-[#172A30] bg-cover bg-center px-6 py-12 md:px-10 md:py-16"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(15,35,40,0.94), rgba(15,35,40,0.45)), url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1600')",
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold tracking-wider text-white">
            <span className="h-2 w-2 rounded-full bg-[#E94F70]" />
            TRANSPORT OPERATIONS
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-tight text-white md:text-5xl">
            Welcome to CrowdFlow
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-gray-200 md:text-base">
            Monitor your transport network, track fleet activity
            and understand passenger movement across routes.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-full bg-[#E94F70] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#d83e60]">
              Explore Fleet <ArrowRight size={17} />
            </button>

            <button className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              View Reports
            </button>
          </div>
        </div>
      </section>

      {/* Page heading */}
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E94F70]">
            OVERVIEW
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#172A30]">
            Transport Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your fleet performance and passenger activity.
          </p>
        </div>

        <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-500">
          Demonstration data
        </span>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: stat.bg }}
                >
                  <Icon size={23} style={{ color: stat.color }} />
                </div>

                <ArrowUpRight size={19} className="text-gray-300" />
              </div>

              <p className="mt-5 text-sm text-gray-500">
                {stat.title}
              </p>

              <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
                {stat.value}
              </h3>

              <p className="mt-2 text-xs text-gray-400">
                {stat.change}
              </p>
            </div>
          );
        })}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Fleet activity */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#172A30]">
                Fleet Activity
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Bus activity throughout the day
              </p>
            </div>

            <span className="rounded-full bg-[#FCE8ED] px-3 py-2 text-xs font-semibold text-[#E94F70]">
              Today
            </span>
          </div>

          <div className="mt-6 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fleetData}>
                <defs>
                  <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E94F70" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#E94F70" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#999", fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#999", fontSize: 12 }}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="active"
                  stroke="#E94F70"
                  strokeWidth={3}
                  fill="url(#activeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crowd distribution */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#172A30]">
            Crowd Distribution
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            Bus occupancy categories
          </p>

          <div className="relative mt-5 h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={crowdData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={4}
                  stroke="none"
                >
                  {crowdData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[#172A30]">100%</span>
              <span className="text-xs text-gray-400">Distribution</span>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {crowdData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>

                <span className="font-semibold text-[#172A30]">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Routes and alerts */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Route demand */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#172A30]">
                Route Demand
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Sample demand across major routes
              </p>
            </div>

            <MapPin size={21} className="text-[#E94F70]" />
          </div>

          <div className="mt-7 space-y-6">
            {routeData.map((route) => (
              <div key={route.name}>
                <div className="mb-2 flex justify-between gap-3">
                  <span className="text-sm text-gray-600">
                    {route.name}
                  </span>
                  <span className="text-sm font-semibold text-[#172A30]">
                    {route.demand}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#E94F70]"
                    style={{ width: `${route.demand}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent alerts */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#172A30]">
                Recent Alerts
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Latest transport notifications
              </p>
            </div>

            <Bell size={21} className="text-[#E94F70]" />
          </div>

          <div className="mt-6 space-y-5">
            {alerts.map((alert) => (
              <div
                key={alert.bus}
                className="flex items-start gap-3 border-b border-gray-100 pb-5 last:border-0 last:pb-0"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${alert.color}18` }}
                >
                  {alert.type === "Crowd" ? (
                    <Users size={19} style={{ color: alert.color }} />
                  ) : alert.type === "Delay" ? (
                    <Clock size={19} style={{ color: alert.color }} />
                  ) : (
                    <TrendingUp size={19} style={{ color: alert.color }} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#172A30]">
                      {alert.bus}
                    </p>

                    <span
                      className="rounded-full px-2 py-1 text-[10px] font-semibold"
                      style={{
                        color: alert.color,
                        backgroundColor: `${alert.color}18`,
                      }}
                    >
                      {alert.type}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {alert.message}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#E94F70] hover:gap-3">
            View all alerts <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 py-5 text-xs text-gray-400">
        <p>© 2026 CrowdFlow. Transit Intelligence Platform.</p>
        <p className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#269D83]" />
          Frontend demonstration mode
        </p>
      </footer>
    </div>
  );
}
