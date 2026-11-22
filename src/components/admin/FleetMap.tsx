
"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";

import "leaflet/dist/leaflet.css";

const API_URL = "/admin-api/buses";

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const hasFittedBoundsRef = useRef(false);

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

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: [12.9716, 77.6412],
      zoom: 11,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    window.requestAnimationFrame(() => map.invalidateSize());

    return () => {
      markerLayerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    buses.forEach((bus) => {
      const marker = L.circleMarker([bus.lat, bus.lng], {
        radius: 10,
        color: "#FFFFFF",
        weight: 3,
        fillColor: bus.color,
        fillOpacity: 1,
      });

      const popup = document.createElement("div");
      popup.className =
        "min-w-[220px] overflow-hidden rounded-xl bg-[#172A30] text-white";

      const addSection = (label: string, value: string, muted = false) => {
        const section = document.createElement("div");
        const heading = document.createElement("p");
        heading.className = "text-[10px] uppercase tracking-wider text-gray-400";
        heading.textContent = label;
        const text = document.createElement("p");
        text.className = muted
          ? "mt-1 text-xs text-white"
          : "mt-1 text-sm font-medium";
        text.textContent = value;
        section.append(heading, text);
        return section;
      };

      const header = document.createElement("div");
      header.className =
        "flex items-center justify-between border-b border-white/10 px-4 py-3";
      const busId = document.createElement("span");
      busId.className = "text-base font-bold";
      busId.textContent = bus.id;
      const status = document.createElement("span");
      status.className = "rounded-full px-2 py-1 text-[10px] font-bold";
      status.style.color = bus.color;
      status.style.backgroundColor = "#FFFFFF";
      status.textContent = bus.status;
      header.append(busId, status);

      const body = document.createElement("div");
      body.className = "space-y-3 p-4";
      body.append(
        addSection("Assigned Route", bus.route),
        addSection("Driver", bus.driver),
        addSection("Current Location", bus.address, true)
      );

      const occupancy = document.createElement("div");
      const occupancyRow = document.createElement("div");
      occupancyRow.className = "flex justify-between text-xs";
      const occupancyLabel = document.createElement("span");
      occupancyLabel.className = "text-gray-300";
      occupancyLabel.textContent = "Passenger Occupancy";
      const occupancyValue = document.createElement("span");
      occupancyValue.className = "font-bold text-[#E94F70]";
      occupancyValue.textContent = `${bus.occupancy}%`;
      occupancyRow.append(occupancyLabel, occupancyValue);

      const occupancyTrack = document.createElement("div");
      occupancyTrack.className =
        "mt-2 h-2 overflow-hidden rounded-full bg-white/15";
      const occupancyBar = document.createElement("div");
      occupancyBar.className = "h-full rounded-full bg-[#E94F70]";
      occupancyBar.style.width = `${bus.occupancy}%`;
      occupancyTrack.append(occupancyBar);

      const passengerCount = document.createElement("p");
      passengerCount.className = "mt-2 text-[11px] text-gray-400";
      passengerCount.textContent = `${bus.passengers} / ${bus.capacity} passengers`;
      occupancy.append(occupancyRow, occupancyTrack, passengerCount);
      body.append(occupancy);

      const coordinates = document.createElement("div");
      coordinates.className = "border-t border-white/10 pt-3";
      const coordinatesLabel = document.createElement("p");
      coordinatesLabel.className = "text-[10px] text-gray-400";
      coordinatesLabel.textContent = "GPS Coordinates";
      const coordinatesValue = document.createElement("p");
      coordinatesValue.className = "mt-1 text-xs text-white";
      coordinatesValue.textContent = `${bus.lat.toFixed(4)}, ${bus.lng.toFixed(4)}`;
      coordinates.append(coordinatesLabel, coordinatesValue);
      body.append(coordinates);

      const detailsButton = document.createElement("button");
      detailsButton.type = "button";
      detailsButton.className =
        "mt-3 w-full rounded-lg bg-[#E94F70] py-2.5 text-xs font-bold text-white";
      detailsButton.textContent = "View Bus Details";
      detailsButton.addEventListener("click", () => {
        window.alert(
          `Selected ${bus.id}\nRoute: ${bus.route}\nOccupancy: ${bus.occupancy}%`
        );
      });
      body.append(detailsButton);

      popup.append(header, body);
      marker.bindPopup(popup, { className: "crowdflow-popup", minWidth: 220 });
      marker.addTo(markerLayer);
    });

    if (buses.length > 0 && !hasFittedBoundsRef.current) {
      const bounds = L.latLngBounds(
        buses.map((bus) => [bus.lat, bus.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      hasFittedBoundsRef.current = true;
    }

    window.requestAnimationFrame(() => map.invalidateSize());
  }, [buses]);

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

      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
