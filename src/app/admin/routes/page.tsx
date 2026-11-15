
"use client";

import { useState } from "react";
import {
  MapPin,
  BusFront,
  Clock,
  Route,
  ArrowRight,
  Navigation,
  MapPinned,
  CircleDot,
} from "lucide-react";

const routes = [
  {
    id: "RT101",
    name: "Mangaluru - Surathkal",
    start: "State Bank",
    end: "Surathkal",
    distance: "18 km",
    duration: "45 min",
    buses: 8,
    stops: [
      "State Bank",
      "Hampankatta",
      "Lalbagh",
      "Kottara Chowki",
      "Kuloor",
      "Surathkal",
    ],
    color: "#269D83",
  },
  {
    id: "RT102",
    name: "Mangaluru - Udupi",
    start: "State Bank",
    end: "Udupi",
    distance: "60 km",
    duration: "1 hr 40 min",
    buses: 12,
    stops: [
      "State Bank",
      "Kankanady",
      "Kuloor",
      "Surathkal",
      "Mulki",
      "Padubidri",
      "Udupi",
    ],
    color: "#E94F70",
  },
  {
    id: "RT103",
    name: "State Bank - Pumpwell",
    start: "State Bank",
    end: "Pumpwell",
    distance: "5 km",
    duration: "20 min",
    buses: 5,
    stops: [
      "State Bank",
      "Hampankatta",
      "Mannagudda",
      "Kankanady",
      "Pumpwell",
    ],
    color: "#E59A3B",
  },
  {
    id: "RT104",
    name: "Mangaluru - Mulki",
    start: "State Bank",
    end: "Mulki",
    distance: "30 km",
    duration: "1 hr",
    buses: 6,
    stops: [
      "State Bank",
      "Lalbagh",
      "Kottara Chowki",
      "Kuloor",
      "Surathkal",
      "Mulki",
    ],
    color: "#243F52",
  },
];

export default function RoutesPage() {
  const [selectedRoute, setSelectedRoute] = useState(routes[0]);

  return (
    <div className="space-y-8">

      {/* HERO */}
      <section
        className="relative flex min-h-[270px] items-end overflow-hidden rounded-2xl bg-cover bg-center px-7 py-9 md:px-12 md:py-12"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(23,42,48,0.94), rgba(23,42,48,0.42)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <div className="relative max-w-2xl text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#E94F70]">
            CrowdFlow / Route Management
          </p>

          <h1 className="text-4xl font-bold md:text-5xl">
            Discover Routes
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            Explore transport routes, understand stop sequences and
            manage the connections across your city.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
            <MapPin size={14} className="text-[#E94F70]" />
            Mangaluru Transport Network
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">
          Transport network
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#172A30] md:text-3xl">
          Routes & Stops
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Select a route to explore its stops and journey information.
        </p>
      </section>

      {/* ROUTE CARDS */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => setSelectedRoute(route)}
            className={`rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
              selectedRoute.id === route.id
                ? "border-[#E94F70] shadow-md"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: route.color }}
                >
                  <Route size={23} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400">
                    {route.id}
                  </p>
                  <h3 className="mt-1 font-bold text-[#172A30]">
                    {route.name}
                  </h3>
                </div>
              </div>

              <ArrowRight
                size={19}
                className="mt-2 text-[#E94F70]"
              />
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  Starting point
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[#172A30]">
                  {route.start}
                </p>
              </div>

              <div className="flex items-center text-gray-300">
                <div className="h-px w-8 bg-gray-300" />
                <ArrowRight size={15} />
              </div>

              <div className="min-w-0 flex-1 text-right">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  Destination
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[#172A30]">
                  {route.end}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Navigation size={14} />
                {route.distance}
              </span>

              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {route.duration}
              </span>

              <span className="flex items-center gap-1.5">
                <BusFront size={14} />
                {route.buses} buses
              </span>
            </div>
          </button>
        ))}
      </section>

      {/* SELECTED ROUTE DETAILS */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 bg-[#172A30] p-6 text-white md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">
              Selected route / {selectedRoute.id}
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {selectedRoute.name}
            </h3>

            <p className="mt-2 text-sm text-white/65">
              {selectedRoute.start} to {selectedRoute.end}
            </p>
          </div>

          <div className="flex gap-5">
            <div>
              <p className="text-xs text-white/60">Distance</p>
              <p className="mt-1 text-lg font-bold">
                {selectedRoute.distance}
              </p>
            </div>

            <div>
              <p className="text-xs text-white/60">Travel time</p>
              <p className="mt-1 text-lg font-bold">
                {selectedRoute.duration}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-[#172A30]">
                Route Stop Sequence
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                Stops along the selected route
              </p>
            </div>

            <span className="rounded-full bg-[#EAF0F2] px-3 py-1.5 text-xs font-semibold text-[#243F52]">
              {selectedRoute.stops.length} stops
            </span>
          </div>

          <div className="mt-7 space-y-0">
            {selectedRoute.stops.map((stop, index) => {
              const first = index === 0;
              const last = index === selectedRoute.stops.length - 1;

              return (
                <div key={`${selectedRoute.id}-${stop}`} className="flex gap-4">
                  <div className="flex w-7 flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        first || last
                          ? "bg-[#E94F70] text-white"
                          : "border-2 border-[#243F52] bg-white text-[#243F52]"
                      }`}
                    >
                      {first || last ? (
                        <MapPin size={14} />
                      ) : (
                        <CircleDot size={12} />
                      )}
                    </div>

                    {!last && (
                      <div className="min-h-[43px] w-0.5 flex-1 bg-gray-200" />
                    )}
                  </div>

                  <div className="pb-7">
                    <p className="text-sm font-semibold text-[#172A30]">
                      {stop}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {first
                        ? "Starting point"
                        : last
                        ? "Final destination"
                        : `Stop ${index + 1}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NOTE */}
      <div className="rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-sm leading-6 text-[#243F52]">
        <strong>Demo mode:</strong> Route names, stop sequences, distances,
        journey durations and bus counts are sample project data. They
        will be connected to the shared backend during integration.
      </div>
    </div>
  );
}
