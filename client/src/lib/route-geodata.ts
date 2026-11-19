/**
 * CrowdFlow — Frontend demonstration geodata
 * Member 2: Passenger Dashboard, Bus Tracking, Frontend–Backend Integration
 *
 * ─── PURPOSE ────────────────────────────────────────────────────────────────
 * Provides temporary map paths and starting bus positions for frontend
 * demonstration while Member 1's backend is not yet available.
 *
 * ─── IMPORTANT ──────────────────────────────────────────────────────────────
 * ALL coordinates in this file are SIMULATED DEMONSTRATION DATA.
 * They are generic city-grid waypoints used only to make the map functional
 * during development. They do NOT represent real bus routes, real streets,
 * or any real-world location.
 *
 * ─── REPLACEMENT ────────────────────────────────────────────────────────────
 * When Member 1's backend is ready:
 *   1. Call fetchRoute(routeId) from src/lib/api/passenger-api.ts to get real
 *      stop coordinates (RouteStop.latitude / RouteStop.longitude).
 *   2. Call fetchBusLocations(routeId) to get real BusLocation positions.
 *   3. Replace getSimulatedGeodata() with those API calls in track-page-client.tsx.
 *   4. Delete this file — it has no role once real data is available.
 */

export interface MapBus {
  id: string;
  busNumber: string;
  position: [number, number];
}

export interface RouteGeodata {
  /** Ordered [lat, lng] waypoints forming the demonstration route polyline. */
  path: [number, number][];
  /** Demonstration starting positions for simulated buses. */
  initialBuses: MapBus[];
}

/**
 * Simulated geodata keyed by mock route ID (r1–r5).
 * Paths are generic grid-like waypoints — not real streets.
 * Bus numbers match the route numbers in mock-data.ts for consistency.
 */
const SIMULATED_GEODATA: Record<string, RouteGeodata> = {
  // r1 — City Centre Express (101)
  r1: {
    path: [
      [51.5050, -0.0900],
      [51.5080, -0.0840],
      [51.5110, -0.0780],
      [51.5140, -0.0720],
      [51.5170, -0.0660],
    ],
    initialBuses: [
      { id: "sim-r1-a", busNumber: "101", position: [51.5065, -0.0870] },
      { id: "sim-r1-b", busNumber: "101", position: [51.5125, -0.0750] },
    ],
  },

  // r2 — Harbour Link (202)
  r2: {
    path: [
      [51.5200, -0.1100],
      [51.5170, -0.1030],
      [51.5140, -0.0960],
      [51.5110, -0.0890],
    ],
    initialBuses: [
      { id: "sim-r2-a", busNumber: "202", position: [51.5185, -0.1065] },
      { id: "sim-r2-b", busNumber: "202", position: [51.5125, -0.0925] },
    ],
  },

  // r3 — Airport Shuttle (305)
  r3: {
    path: [
      [51.5000, -0.1200],
      [51.4950, -0.1100],
      [51.4880, -0.0980],
      [51.4800, -0.0850],
      [51.4720, -0.0720],
    ],
    initialBuses: [
      { id: "sim-r3-a", busNumber: "305", position: [51.4975, -0.1150] },
      { id: "sim-r3-b", busNumber: "305", position: [51.4840, -0.0915] },
    ],
  },

  // r4 — Suburban Loop (410)
  r4: {
    path: [
      [51.5300, -0.0600],
      [51.5330, -0.0530],
      [51.5360, -0.0460],
      [51.5390, -0.0390],
      [51.5420, -0.0320],
    ],
    initialBuses: [
      { id: "sim-r4-a", busNumber: "410", position: [51.5315, -0.0565] },
      { id: "sim-r4-b", busNumber: "410", position: [51.5375, -0.0425] },
    ],
  },

  // r5 — Night Owl (520)
  r5: {
    path: [
      [51.5050, -0.0900],
      [51.5010, -0.0860],
      [51.4970, -0.0820],
      [51.4930, -0.0780],
    ],
    initialBuses: [
      { id: "sim-r5-a", busNumber: "520", position: [51.5030, -0.0880] },
      { id: "sim-r5-b", busNumber: "520", position: [51.4950, -0.0800] },
    ],
  },
};

/**
 * Returns simulated demonstration geodata for a given mock route ID.
 * Falls back to the r1 dataset for any unrecognised ID so the map
 * always has something to render.
 */
export function getSimulatedGeodata(routeId: string): RouteGeodata {
  return SIMULATED_GEODATA[routeId] ?? SIMULATED_GEODATA["r1"];
}
