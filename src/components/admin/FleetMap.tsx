
"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const buses = [
  {
    id: "BUS101",
    route: "Mangaluru - Surathkal",
    lat: 12.9141,
    lng: 74.8560,
    status: "Active",
    occupancy: 65,
    color: "#269D83",
  },
  {
    id: "BUS102",
    route: "Mangaluru - Udupi",
    lat: 12.9300,
    lng: 74.8420,
    status: "High Crowd",
    occupancy: 92,
    color: "#E94F70",
  },
  {
    id: "BUS103",
    route: "State Bank - Pumpwell",
    lat: 12.9010,
    lng: 74.8650,
    status: "Delayed",
    occupancy: 48,
    color: "#E59A3B",
  },
  {
    id: "BUS104",
    route: "Mangaluru - Mulki",
    lat: 12.9500,
    lng: 74.8350,
    status: "Active",
    occupancy: 55,
    color: "#269D83",
  },
  {
    id: "BUS105",
    route: "Mangaluru - Surathkal",
    lat: 12.9250,
    lng: 74.8750,
    status: "Active",
    occupancy: 72,
    color: "#269D83",
  },
];

export default function FleetMap() {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl">
      <MapContainer
        center={[12.9141, 74.8560]}
        zoom={13}
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
              <div className="min-w-[210px] overflow-hidden rounded-xl bg-[#172A30] text-white">

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
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Assigned Route
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {bus.route}
                    </p>
                  </div>

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
                  </div>

                  <button
                    onClick={() =>
                      window.alert(`Selected ${bus.id}`)
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
