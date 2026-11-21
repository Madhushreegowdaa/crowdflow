/**
 * CrowdFlow — Frontend demonstration geodata
 * Member 2: Passenger Dashboard, Bus Tracking, Frontend–Backend Integration
 *
 * ─── PURPOSE ────────────────────────────────────────────────────────────────
 * Provides temporary Bengaluru map paths and starting bus positions for
 * frontend demonstration while verified route data is unavailable.
 *
 * ─── IMPORTANT ──────────────────────────────────────────────────────────────
 * ALL coordinates in this file are demonstration data. They are approximate
 * stop coordinates, not verified road geometry, route schedules, or live GPS.
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
 * Simulated geodata keyed by Bengaluru demo route ID (r1–r3).
 * Bus numbers match the route numbers in mock-data.ts for consistency.
 */
const SIMULATED_GEODATA: Record<string, RouteGeodata> = {
  // r1 — Majestic to Whitefield via HAL (335-E)
  r1: {
    path: [
      [12.9772, 77.5713],
      [12.9698, 77.5891],
      [12.9664, 77.5992],
      [12.9609, 77.6387],
      [12.9562, 77.6681],
      [12.9548, 77.7011],
      [12.9632, 77.7175],
      [12.9868, 77.7377],
    ],
    initialBuses: [
      { id: "sim-r1-a", busNumber: "335-E", position: [12.9636, 77.6260] },
      { id: "sim-r1-b", busNumber: "335-E", position: [12.9590, 77.6846] },
    ],
  },

  // r2 — Silk Board to Tin Factory via Marathahalli (500-D)
  r2: {
    path: [
      [12.9176, 77.6238],
      [12.9121, 77.6446],
      [12.9260, 77.6762],
      [12.9298, 77.6845],
      [12.9352, 77.6912],
      [12.9548, 77.7011],
      [12.9982, 77.6789],
      [13.0035, 77.6672],
    ],
    initialBuses: [
      { id: "sim-r2-a", busNumber: "500-D", position: [12.9240, 77.6700] },
      { id: "sim-r2-b", busNumber: "500-D", position: [12.9760, 77.6860] },
    ],
  },

  // r3 — Majestic to Electronic City (365)
  r3: {
    path: [
      [12.9772, 77.5713],
      [12.9698, 77.5891],
      [12.9284, 77.5835],
      [12.9176, 77.6238],
      [12.8452, 77.6602],
    ],
    initialBuses: [
      { id: "sim-r3-a", busNumber: "365", position: [12.9680, 77.5890] },
      { id: "sim-r3-b", busNumber: "365", position: [12.8810, 77.6420] },
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
