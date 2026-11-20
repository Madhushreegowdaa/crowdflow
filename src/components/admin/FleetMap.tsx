
"use client";

import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const API_URL = "http://localhost:5000/api/buses";

interface ApiBus {
  id: string;
  bus_number?: string;
  route_name?: string;
  driver_name?: string;
  current_lat?: number | string;
  current_lng?: number | string;
  occupancy_percent?: number | string;
  current_passengers?: number | string;
  total_capacity?: number | string;
  crowd_level?: string;
  status?: string;
  current_address?: string;
}

interface FleetBus {
  id: string;
  route: string;
  driver: string;
  lat: number;
  lng: number;
  status: string;
  occupancy: number;
  passengers: number;
  capacity: number;
  address: string;
  color: string;
}

function normalizeBus(bus: ApiBus): FleetBus | null {
  const lat = Number(bus.current_lat);
  const lng = Number(bus.current_lng);

  // Do not display buses without valid GPS coordinates.
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  const occupancy = Math.min(
    100,
    Math.max(0, Math.round(Number(bus.occupancy_percent) || 0))
  );

  const crowdLevel = String(bus.crowd_level ?? "").toLowerCase();
  const rawStatus = String(bus.status ?? "").toLowerCase();

  let status = "Active";
  let color = "#269D83";

  if (crowdLevel === "high" || occupancy >= 85) {
    status = "High Crowd";
    color = "#E94F70";
  } else if (rawStatus.includes("delay")) {
    status = "Delayed";
    color = "#E59A3B";
  }

  return {
    id: bus.bus_number ?? bus.id,
    route: bus.route_name ?? "Route not available",
    driver: bus.driver_name ?? "Driver not assigned",
    lat,
    lng,
    status,
    occupancy,
    passengers: Number(bus.current_passengers) || 0,
    capacity: Number(bus.total_capacity) || 0,
    address: bus.current_address ?? "Location unavailable",
    color,
  };
}

export default function FleetMap() {
  const [buses, setBuses] = useState<FleetBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBuses(showLoading = false) {
      try {
        if (showLoading) setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        const result = await response.json();

        if (!Array.isArray(result.buses)) {
          throw new Error("Invalid bus data received from backend.");
        }

        const mappedBuses = result.buses
          .map((bus: ApiBus) => normalizeBus(bus))
          .filter((bus: FleetBus | null): bus is FleetBus => bus !== null);

        setBuses(mappedBuses);
      } catch (err) {
        console.error("Fleet map loading error:", err);
        setError("Unable to load bus locations from the backend.");
      } finally {
        setLoading(false);
      }
    }

    void fetchBuses(true);
    const interval = window.setInterval(() => void fetchBuses(), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">

      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#F0F2F1] text-sm font-medium text-[#172A30]">
          Loading bus locations...
        </div>
      )}

      {!loading && error && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#F0F2F1] px-5 text-center text-sm text-[#B83250]">
          {error}
        </div>
      )}

      {!loading && !error && buses.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#F0F2F1] px-5 text-center text-sm text-[#172A30]">
          No buses with valid GPS coordinates were found.
        </div>
      )}

      <MapContainer
        center={[12.9716, 77.6412]}
        zoom={11}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full"
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {buses.map((bus) => (
          <CircleMarker
            key={bus.id}
            center={[bus.lat, bus.lng]}
            radius={10}
            pathOptions={{
              color: "#FFFFFF",
              weight: 3,
              fillColor: bus.color,
              fillOpacity: 1,
            }}
          >
            <Popup className="crowdflow-popup">
              <div className="min-w-[220px] overflow-hidden rounded-xl bg-[#172A30] text-white">

                {/* BUS HEADER */}
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <span className="text-base font-bold">
                    {bus.id}
                  </span>

                  <span
                    className="rounded-full px-2 py-1 text-[10px] font-bold"
                    style={{
                      color: bus.color,
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    {bus.status}
                  </span>
                </div>

                <div className="space-y-3 p-4">

                  {/* ROUTE */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Assigned Route
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {bus.route}
                    </p>
                  </div>

                  {/* DRIVER */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Driver
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {bus.driver}
                    </p>
                  </div>

                  {/* LOCATION */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Current Location
                    </p>

                    <p className="mt-1 text-xs text-white">
                      {bus.address}
                    </p>
                  </div>

                  {/* OCCUPANCY */}
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">
                        Passenger Occupancy
                      </span>

                      <span className="font-bold text-[#E94F70]">
                        {bus.occupancy}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-[#E94F70]"
                        style={{ width: `${bus.occupancy}%` }}
                      />
                    </div>

                    <p className="mt-2 text-[11px] text-gray-400">
                      {bus.passengers} / {bus.capacity} passengers
                    </p>
                  </div>

                  {/* GPS COORDINATES */}
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[10px] text-gray-400">
                      GPS Coordinates
                    </p>

                    <p className="mt-1 text-xs text-white">
                      {bus.lat.toFixed(4)}, {bus.lng.toFixed(4)}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      window.alert(
                        `Selected ${bus.id}\nRoute: ${bus.route}\nOccupancy: ${bus.occupancy}%`
                      )
                    }
                    className="w-full rounded-lg bg-[#E94F70] py-2.5 text-xs font-bold text-white transition hover:bg-[#D83E60]"
                  >
                    View Bus Details
                  </button>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
