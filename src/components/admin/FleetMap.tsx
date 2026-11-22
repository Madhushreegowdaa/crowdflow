
"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { resolveCrowdLevel } from "@/services/crowdClassification";

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
  occupancy: number | null;
  passengers: number | null;
  capacity: number | null;
  address: string;
  color: string;
}

function createPopup(bus: FleetBus): HTMLElement {
  const popup = document.createElement("div");
  popup.className = "min-w-[220px] overflow-hidden rounded-xl bg-[#172A30] text-white";

  const header = document.createElement("div");
  header.className = "flex items-center justify-between border-b border-white/10 px-4 py-3";

  const busId = document.createElement("span");
  busId.className = "text-base font-bold";
  busId.textContent = bus.id;

  const status = document.createElement("span");
  status.className = "rounded-full px-2 py-1 text-[10px] font-bold";
  status.style.color = bus.color;
  status.style.backgroundColor = "#FFFFFF";
  status.textContent = bus.status;
  header.append(busId, status);
  popup.append(header);

  const details = document.createElement("div");
  details.className = "space-y-3 p-4";
  const addDetail = (label: string, value: string, valueClassName = "mt-1 text-sm font-medium") => {
    const section = document.createElement("div");
    const title = document.createElement("p");
    title.className = "text-[10px] uppercase tracking-wider text-gray-400";
    title.textContent = label;

    const text = document.createElement("p");
    text.className = valueClassName;
    text.textContent = value;
    section.append(title, text);
    details.append(section);
  };

  addDetail("Assigned Route", bus.route);
  addDetail("Driver", bus.driver);
  addDetail("Current Location", bus.address, "mt-1 text-xs text-white");

  const occupancySection = document.createElement("div");
  const occupancyRow = document.createElement("div");
  occupancyRow.className = "flex justify-between text-xs";
  const occupancyLabel = document.createElement("span");
  occupancyLabel.className = "text-gray-300";
  occupancyLabel.textContent = "Passenger Occupancy";
  const occupancyValue = document.createElement("span");
  occupancyValue.className = "font-bold text-[#E94F70]";
  occupancyValue.textContent =
    bus.occupancy === null ? "Unavailable" : `${bus.occupancy}%`;
  occupancyRow.append(occupancyLabel, occupancyValue);

  const meter = document.createElement("div");
  meter.className = "mt-2 h-2 overflow-hidden rounded-full bg-white/15";
  const fill = document.createElement("div");
  fill.className = "h-full rounded-full bg-[#E94F70]";
  fill.style.width = bus.occupancy === null ? "0%" : `${bus.occupancy}%`;
  meter.append(fill);

  const passengerCount = document.createElement("p");
  passengerCount.className = "mt-2 text-[11px] text-gray-400";
  passengerCount.textContent =
    bus.passengers === null
      ? "Passenger count unavailable"
      : `${bus.passengers} / ${
          bus.capacity === null ? "capacity unavailable" : bus.capacity
        } passengers`;
  occupancySection.append(occupancyRow, meter, passengerCount);
  details.append(occupancySection);

  const coordinates = document.createElement("div");
  coordinates.className = "border-t border-white/10 pt-3";
  const coordinatesLabel = document.createElement("p");
  coordinatesLabel.className = "text-[10px] text-gray-400";
  coordinatesLabel.textContent = "GPS Coordinates";
  const coordinatesValue = document.createElement("p");
  coordinatesValue.className = "mt-1 text-xs text-white";
  coordinatesValue.textContent = `${bus.lat.toFixed(4)}, ${bus.lng.toFixed(4)}`;
  coordinates.append(coordinatesLabel, coordinatesValue);
  details.append(coordinates);

  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "w-full rounded-lg bg-[#E94F70] py-2.5 text-xs font-bold text-white transition hover:bg-[#D83E60]";
  button.textContent = "View Bus Details";
  button.addEventListener("click", () => {
    window.alert(
      `Selected ${bus.id}\nRoute: ${bus.route}\nOccupancy: ${
        bus.occupancy === null ? "Unavailable" : `${bus.occupancy}%`
      }`,
    );
  });
  details.append(button);

  popup.append(details);
  return popup;
}

function updateMarkers(layer: L.LayerGroup, buses: FleetBus[]) {
  layer.clearLayers();
  buses.forEach((bus) => {
    L.circleMarker([bus.lat, bus.lng], {
      radius: 10,
      color: "#FFFFFF",
      weight: 3,
      fillColor: bus.color,
      fillOpacity: 1,
    })
      .bindPopup(createPopup(bus), { className: "crowdflow-popup" })
      .addTo(layer);
  });
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

  const toNullableNumber = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const passengers = toNullableNumber(bus.current_passengers);
  const capacity = toNullableNumber(bus.total_capacity);
  const recordedOccupancy = toNullableNumber(bus.occupancy_percent);
  const calculatedOccupancy =
    passengers !== null && capacity !== null && capacity > 0
      ? (passengers / capacity) * 100
      : null;
  const rawOccupancy = recordedOccupancy ?? calculatedOccupancy;
  const crowdLevel = resolveCrowdLevel(bus.crowd_level, rawOccupancy);
  const occupancy =
    rawOccupancy === null
      ? null
      : Math.min(100, Math.max(0, Math.round(rawOccupancy)));

  const rawStatus = String(bus.status ?? "").toLowerCase();

  let status = "Active";
  let color = "#269D83";

  if (crowdLevel === "very high") {
    status = "Very High Crowd";
    color = "#8B1E3F";
  } else if (crowdLevel === "high") {
    status = "High Crowd";
    color = "#E94F70";
  } else if (crowdLevel === "unavailable" || occupancy === null) {
    status = "Unavailable";
    color = "#94A3B8";
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
    passengers,
    capacity,
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

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: [12.9716, 77.6412],
      zoom: 11,
      scrollWheelZoom: true,
      zoomControl: false,
    });
    const markerLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markerLayerRef.current = markerLayer;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    return () => {
      markerLayer.clearLayers();
      markerLayer.remove();
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
      if (markerLayerRef.current === markerLayer) markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const markerLayer = markerLayerRef.current;
    if (markerLayer) updateMarkers(markerLayer, buses);
  }, [buses]);

  useEffect(() => {
    let active = true;

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

        if (active) setBuses(mappedBuses);
      } catch (err) {
        console.error("Fleet map loading error:", err);
        if (active) setError("Unable to load bus locations from the backend.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchBuses(true);
    const interval = window.setInterval(() => void fetchBuses(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
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

      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
