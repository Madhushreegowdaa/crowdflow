"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapBus } from "@/lib/route-geodata";

export interface BusTrackingMapProps {
  routeId: string;
  /**
   * Ordered [lat, lng] waypoints for the route polyline.
   * During frontend development: supplied by getSimulatedGeodata().
   * After backend integration: supplied by fetchRoute() from passenger-api.ts.
   */
  routePath: [number, number][];
  /**
   * Current bus positions to render as markers.
   * During frontend development: managed by the simulation loop in track-page-client.tsx.
   * After backend integration: supplied by fetchBusLocations() from passenger-api.ts.
   */
  buses: MapBus[];
}

const busIcon = L.divIcon({
  className: "bus-map-marker",
  html: `<div style="
    background:#e8435a;
    color:white;
    border:3px solid white;
    border-radius:50%;
    width:36px;
    height:36px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:17px;
    box-shadow:0 2px 8px rgba(0,0,0,.35);
  ">🚌</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/** Fits the map viewport to the full route path whenever the route changes. */
function MapViewController({ path }: { path: [number, number][] }) {
  const map = useMap();
  const prevKeyRef = useRef("");

  useEffect(() => {
    if (path.length === 0) return;
    const key = `${path[0][0]},${path[0][1]}`;
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;

    const bounds = L.latLngBounds(path);
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [32, 32] });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [map, path]);

  return null;
}

export default function BusTrackingMap({
  routeId,
  routePath,
  buses,
}: BusTrackingMapProps) {
  const midIndex = Math.floor(routePath.length / 2);
  const initialCenter: [number, number] = routePath[midIndex] ?? [51.505, -0.09];

  return (
    <div style={{ width: "100%", borderRadius: "12px", overflow: "hidden" }}>
      {/* Simulation notice — remove once real GPS data is connected */}
      <div
        style={{
          background: "rgba(232,67,90,0.10)",
          border: "1px solid rgba(232,67,90,0.25)",
          borderBottom: "none",
          borderRadius: "12px 12px 0 0",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--cf-accent)" strokeWidth="2.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
        </svg>
        <span style={{ fontSize: "0.7rem", color: "var(--cf-accent)", fontWeight: 600, letterSpacing: "0.02em" }}>
          SIMULATED POSITIONS — not real GPS data
        </span>
      </div>

      <div style={{ height: "430px", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
        <MapContainer
          key={routeId}
          center={initialCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <MapViewController path={routePath} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Polyline
            positions={routePath}
            pathOptions={{ color: "#e8435a", weight: 5, opacity: 0.85 }}
          />

          {buses.map((bus) => (
            <Marker key={bus.id} position={bus.position} icon={busIcon}>
              <Popup>
                <strong>Bus {bus.busNumber}</strong>
                <br />
                Route: {routeId}
                <br />
                <em style={{ fontSize: "0.75em", color: "#888" }}>Simulated position</em>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
