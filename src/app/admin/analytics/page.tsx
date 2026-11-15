
"use client";

import {
  AreaChart,
  Area,
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
  Legend,
} from "recharts";

import {
  Users,
  TrendingUp,
  BusFront,
  Activity,
  ArrowUpRight,
  Clock,
} from "lucide-react";

const crowdData = [
  { time: "6 AM", passengers: 120 },
  { time: "8 AM", passengers: 380 },
  { time: "10 AM", passengers: 260 },
  { time: "12 PM", passengers: 310 },
  { time: "2 PM", passengers: 240 },
  { time: "4 PM", passengers: 420 },
  { time: "6 PM", passengers: 510 },
  { time: "8 PM", passengers: 290 },
];

const routeData = [
  { route: "Surathkal", passengers: 420 },
  { route: "Udupi", passengers: 350 },
  { route: "Pumpwell", passengers: 280 },
  { route: "Mulki", passengers: 190 },
  { route: "Hampankatta", passengers: 310 },
];

const crowdDistribution = [
  { name: "Low", value: 35, color: "#269D83" },
  { name: "Moderate", value: 40, color: "#E59A3B" },
  { name: "High", value: 25, color: "#E94F70" },
];

const stats = [
  {
    title: "Estimated Passengers",
    value: "2,450",
    detail: "Across monitored routes",
    icon: Users,
    color: "#243F52",
  },
  {
    title: "High Crowd Routes",
    value: "04",
    detail: "Require attention",
    icon: TrendingUp,
    color: "#E94F70",
  },
  {
    title: "Buses Monitored",
    value: "96",
    detail: "Demonstration fleet",
    icon: BusFront,
    color: "#269D83",
  },
  {
    title: "Average Occupancy",
    value: "68%",
    detail: "Sample occupancy level",
    icon: Activity,
    color: "#E59A3B",
  },
];

export default function AnalyticsPage() {
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
            Demonstration analytics
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
          Explore passenger demand and crowd levels across the transport network.
        </p>
      </section>

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

      {/* PASSENGER TREND */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#172A30]">
              Passenger Demand Throughout the Day
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Sample passenger movement by time
            </p>
          </div>

          <span className="rounded-full bg-[#EAF0F2] px-3 py-1.5 text-xs font-semibold text-[#243F52]">
            Daily overview
          </span>
        </div>

        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={crowdData}>
              <defs>
                <linearGradient id="passengerFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#243F52" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#243F52" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />

              <XAxis
                dataKey="time"
                tick={{ fill: "#7B8790", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: "#7B8790", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="passengers"
                stroke="#243F52"
                strokeWidth={3}
                fill="url(#passengerFill)"
                activeDot={{ r: 6, fill: "#E94F70" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* TWO CHARTS */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* ROUTE DEMAND */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6">
            <h3 className="font-bold text-[#172A30]">
              Passenger Demand by Route
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Compare passenger counts across routes
            </p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#EAEAEA"
                />

                <XAxis type="number" hide />

                <YAxis
                  type="category"
                  dataKey="route"
                  width={95}
                  tick={{ fill: "#596A72", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Bar
                  dataKey="passengers"
                  fill="#243F52"
                  radius={[0, 7, 7, 0]}
                  barSize={23}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CROWD DISTRIBUTION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-2">
            <h3 className="font-bold text-[#172A30]">
              Crowd Level Distribution
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Distribution of sample occupancy levels
            </p>
          </div>

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

          <div className="flex flex-wrap justify-center gap-5">
            {crowdDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />

                <span className="text-xs text-gray-600">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
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
              Observations from demonstration data
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <Clock size={19} className="text-[#E94F70]" />
            <p className="mt-3 text-sm font-semibold">Evening Peak</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              The sample demand reaches its highest level around 6 PM.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <BusFront size={19} className="text-[#269D83]" />
            <p className="mt-3 text-sm font-semibold">Route Demand</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Surathkal has the highest sample passenger demand among the displayed routes.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <TrendingUp size={19} className="text-[#E59A3B]" />
            <p className="mt-3 text-sm font-semibold">Crowd Distribution</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Moderate crowd represents the largest share in the sample distribution.
            </p>
          </div>
        </div>
      </section>

      {/* DEMO NOTE */}
      <div className="rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-sm leading-6 text-[#243F52]">
        <strong>Demo mode:</strong> All passenger counts, percentages,
        route demand and insights on this page use sample data. Actual
        analytics will be connected to the backend and crowd prediction
        module during integration.
      </div>
    </div>
  );
}
