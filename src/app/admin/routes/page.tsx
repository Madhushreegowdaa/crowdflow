
"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  Route,
  ArrowRight,
  Navigation,
  CircleDot,
  BusFront,
} from "lucide-react";

const ROUTES_API = "http://localhost:5000/api/routes";
const STOPS_API = "http://localhost:5000/api/stops";

interface ApiRoute {
  id: string;
  route_name?: string;
  start_point?: string;
  end_point?: string;
  distance_km?: string | number;
  estimated_duration_min?: string | number;
}

interface ApiStop {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

interface RouteItem {
  id: string;
  name: string;
  start: string;
  end: string;
  distance: string;
  duration: string;
  color: string;
}

const routeColors = [
  "#269D83",
  "#E94F70",
  "#E59A3B",
  "#243F52",
];

function formatDistance(value?: string | number) {
  if (value === undefined || value === null || value === "") {
    return "Not available";
  }

  return `${value} km`;
}

function formatDuration(value?: string | number) {
  if (value === undefined || value === null || value === "") {
    return "Not available";
  }

  const minutes = Number(value);

  if (!Number.isFinite(minutes)) {
    return String(value);
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes
      ? `${hours} hr ${remainingMinutes} min`
      : `${hours} hr`;
  }

  return `${minutes} min`;
}

function getRouteEndpoints(route: ApiRoute) {
  const name = route.route_name ?? "Unnamed route";

  return {
    start: route.start_point ?? name.split(/\s+(?:-|–|to)\s+/i)[0] ?? "Not available",
    end: route.end_point ?? name.split(/\s+(?:-|–|to)\s+/i).slice(1).join(" ") ?? "Not available",
  };
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [stops, setStops] = useState<ApiStop[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNetworkData() {
      try {
        setLoading(true);
        setError("");

        const [routesResponse, stopsResponse] = await Promise.all([
          fetch(ROUTES_API),
          fetch(STOPS_API),
        ]);

        if (!routesResponse.ok || !stopsResponse.ok) {
          throw new Error("Unable to retrieve routes or stops from the backend.");
        }

        const routesResult = await routesResponse.json();
        const stopsResult = await stopsResponse.json();

        const routeRecords: ApiRoute[] = Array.isArray(routesResult)
          ? routesResult
          : routesResult.routes ?? routesResult.data ?? [];

        const stopRecords: ApiStop[] = Array.isArray(stopsResult)
          ? stopsResult
          : stopsResult.stops ?? stopsResult.data ?? [];

        const mappedRoutes = routeRecords.map((route, index) => {
          const endpoints = getRouteEndpoints(route);

          return {
            id: String(route.id),
            name: route.route_name ?? "Unnamed route",
            start: endpoints.start,
            end: endpoints.end,
            distance: formatDistance(route.distance_km),
            duration: formatDuration(route.estimated_duration_min),
            color: routeColors[index % routeColors.length],
          };
        });

        setRoutes(mappedRoutes);
        setStops(stopRecords);

        setSelectedRoute((current) => {
          if (current) {
            return mappedRoutes.find((route) => route.id === current.id) ??
              mappedRoutes[0] ??
              null;
          }

          return mappedRoutes[0] ?? null;
        });
      } catch (err) {
        console.error("Routes page loading error:", err);
        setError(
          "Unable to load transport network data. Check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchNetworkData();
  }, []);

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
            Explore transport routes, understand network stops and
            view journey information.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
            <MapPin size={14} className="text-[#E94F70]" />
            CrowdFlow Transport Network
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
          Select a route to explore its journey information and view
          registered network stops.
        </p>
      </section>

      {/* LOADING */}
      {loading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#269D83]" />
          <p className="mt-4 text-sm text-gray-500">
            Loading routes and stops from database...
          </p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="rounded-xl border border-[#E94F70]/20 bg-[#FCEBF0] p-5 text-sm text-[#B83250]">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ROUTE CARDS */}
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {routes.map((route) => (
              <button
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
                  selectedRoute?.id === route.id
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
                        Route ID: {route.id}
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
                </div>
              </button>
            ))}

            {routes.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center md:col-span-2">
                <Route className="mx-auto text-gray-300" size={32} />
                <p className="mt-3 text-sm font-semibold text-[#172A30]">
                  No routes found
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  No route records are currently available in the database.
                </p>
              </div>
            )}
          </section>

          {/* SELECTED ROUTE DETAILS */}
          {selectedRoute && (
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
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="font-bold text-[#172A30]">
                      Registered Network Stops
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Stops currently stored in the shared database
                    </p>
                  </div>

                  <span className="rounded-full bg-[#EAF0F2] px-3 py-1.5 text-xs font-semibold text-[#243F52]">
                    {stops.length} registered stops
                  </span>
                </div>

                {stops.length > 0 ? (
                  <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {stops.map((stop, index) => (
                      <div
                        key={stop.id}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 p-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF0F2] text-[#243F52]">
                          <CircleDot size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#172A30]">
                            {stop.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Stop ID: {stop.id}
                          </p>

                          {stop.lat !== undefined &&
                            stop.lng !== undefined && (
                              <p className="mt-1 text-[10px] text-gray-400">
                                {stop.lat}, {stop.lng}
                              </p>
                            )}
                        </div>

                        <span className="ml-auto text-xs text-gray-300">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-gray-500">
                    No stop records are currently available.
                  </p>
                )}

                <div className="mt-6 rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-xs leading-6 text-[#243F52]">
                  <strong>Route-stop association:</strong> The current
                  database stores routes and stops separately. These stops
                  are displayed as the network stop directory, not as a
                  verified stop sequence for the selected route.
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* INFORMATION NOTE */}
      <div className="rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-sm leading-6 text-[#243F52]">
        <strong>Database integration:</strong> Route details and stop
        records are retrieved from the Express backend connected to
        Supabase.
      </div>
    </div>
  );
}
