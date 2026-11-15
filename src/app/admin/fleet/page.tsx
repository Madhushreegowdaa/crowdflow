
"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  Search,
  MapPin,
  BusFront,
  Users,
  Clock3,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";

const FleetMap = dynamic(
  () => import("@/components/admin/FleetMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-[#F0F2F1] text-[#172A30]">
        Loading fleet map...
      </div>
    ),
  }
);

const buses = [
  {
    id: "BUS101",
    route: "Mangaluru - Surathkal",
    driver: "Driver 01",
    occupancy: 65,
    status: "Active",
    time: "On schedule",
  },
  {
    id: "BUS102",
    route: "Mangaluru - Udupi",
    driver: "Driver 02",
    occupancy: 92,
    status: "High Crowd",
    time: "High passenger load",
  },
  {
    id: "BUS103",
    route: "State Bank - Pumpwell",
    driver: "Driver 03",
    occupancy: 48,
    status: "Delayed",
    time: "Running late",
  },
  {
    id: "BUS104",
    route: "Mangaluru - Mulki",
    driver: "Driver 04",
    occupancy: 55,
    status: "Active",
    time: "On schedule",
  },
  {
    id: "BUS105",
    route: "Mangaluru - Surathkal",
    driver: "Driver 05",
    occupancy: 72,
    status: "Active",
    time: "On schedule",
  },
];

export default function FleetTrackingPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredBuses = useMemo(() => {
    return buses.filter((bus) => {
      const matchesSearch =
        bus.id.toLowerCase().includes(search.toLowerCase()) ||
        bus.route.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" || bus.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  return (
    <div className="space-y-8">

      {/* HERO SECTION */}
      <section
        className="relative flex min-h-[280px] items-end overflow-hidden rounded-2xl bg-cover bg-center px-7 py-9 md:px-12 md:py-12"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(23,42,48,0.92), rgba(23,42,48,0.48)), url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <div className="relative z-10 max-w-2xl text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#E94F70]">
            CrowdFlow / Fleet Management
          </p>

          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Explore Your Fleet
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            Monitor buses, track their locations and view passenger
            occupancy across your transport network.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white">
            <span className="h-2 w-2 rounded-full bg-[#269D83]" />
            Demonstration fleet data
          </div>
        </div>
      </section>

      {/* PAGE INTRODUCTION */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">
            Live fleet overview
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#172A30] md:text-3xl">
            Bus Locations & Availability
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Explore vehicle locations and check their current status.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#243F52]">
          <MapPin size={17} />
          Mangaluru, Karnataka
        </div>
      </section>

      {/* MAP AND BUS LIST */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">

        {/* MAP */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="font-bold text-[#172A30]">
                Fleet Map
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Explore the displayed bus locations
              </p>
            </div>

            <span className="rounded-full bg-[#EAF5F1] px-3 py-1.5 text-xs font-semibold text-[#269D83]">
              5 buses displayed
            </span>
          </div>

          <div className="h-[430px] w-full">
            <FleetMap />
          </div>

          <div className="flex flex-wrap gap-5 border-t border-gray-100 px-5 py-4 text-xs text-gray-600">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#269D83]" />
              Active
            </span>

            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#E94F70]" />
              High crowd
            </span>

            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#E59A3B]" />
              Delayed
            </span>
          </div>
        </div>

        {/* BUS LISTING */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#172A30]">
                  Available Buses
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Browse the fleet list
                </p>
              </div>

              <BusFront className="text-[#E94F70]" size={24} />
            </div>

            {/* SEARCH */}
            <div className="relative mt-5">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search bus ID or route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-[#F8F8F7] py-3 pl-10 pr-4 text-sm text-[#172A30] outline-none transition focus:border-[#243F52]"
              />
            </div>

            {/* FILTER */}
            <div className="mt-4 flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-gray-400" />

              {["All", "Active", "Delayed", "High Crowd"].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filter === item
                      ? "bg-[#172A30] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* BUS CARDS */}
          <div className="max-h-[530px] space-y-3 overflow-y-auto p-4">
            {filteredBuses.length > 0 ? (
              filteredBuses.map((bus) => (
                <div
                  key={bus.id}
                  className="rounded-xl border border-gray-100 p-4 transition hover:border-[#243F52]/30 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF0F2] text-[#243F52]">
                        <BusFront size={21} />
                      </div>

                      <div>
                        <h4 className="font-bold text-[#172A30]">
                          {bus.id}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          {bus.route}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        bus.status === "Active"
                          ? "bg-[#EAF5F1] text-[#269D83]"
                          : bus.status === "Delayed"
                          ? "bg-[#FFF3E2] text-[#B97719]"
                          : "bg-[#FCEBF0] text-[#E94F70]"
                      }`}
                    >
                      {bus.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Users size={14} />
                      Passenger occupancy
                    </span>

                    <span className="font-bold text-[#172A30]">
                      {bus.occupancy}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        bus.occupancy >= 85
                          ? "bg-[#E94F70]"
                          : "bg-[#269D83]"
                      }`}
                      style={{ width: `${bus.occupancy}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock3 size={13} />
                      {bus.time}
                    </span>

                    <span className="flex items-center gap-1 text-xs font-semibold text-[#243F52]">
                      Fleet details
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <BusFront className="mx-auto text-gray-300" size={32} />
                <p className="mt-3 text-sm font-semibold text-[#172A30]">
                  No buses found
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Try another search or filter.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-[#F8F8F7] px-5 py-3 text-xs text-gray-500">
            Showing {filteredBuses.length} of {buses.length} demonstration buses
          </div>
        </div>
      </section>

      {/* INFORMATION NOTE */}
      <div className="rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-sm leading-6 text-[#243F52]">
        <strong>Demo mode:</strong> Bus locations, occupancy levels and
        statuses currently use sample data. They will be connected to the
        backend and actual tracking data during team integration.
      </div>
    </div>
  );
}
