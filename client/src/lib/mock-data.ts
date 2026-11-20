// CrowdFlow — Demo/mock data only. Not connected to any live system.

import { getServiceArea } from "@/lib/service-areas";

export type CrowdLevel = "Low" | "Medium" | "High";

export interface Stop {
  id: string;
  name: string;
  arrivalMinutes: number; // minutes from now (for tracking)
}

export interface BusRoute {
  id: string;
  number: string;
  name: string;
  origin: string;
  destination: string;
  stops: Stop[];
  durationMinutes: number;
  frequency: string; // e.g. "Every 15 min"
  crowdLevel: CrowdLevel;
  operatingHours: string;
  area: string;
}

export interface BusArrival {
  id: string;
  routeId: string;
  busNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  arrivalMinutes: number;
  scheduledTime: string;
  crowdLevel: CrowdLevel;
  availableSeats: number | null;
}

export const MOCK_ROUTES: BusRoute[] = [
  {
    id: "r1",
    number: "335-E",
    name: "Majestic to Whitefield via HAL",
    origin: "Majestic Bus Station",
    destination: "ITPL / Whitefield TTMC",
    stops: [
      { id: "s1", name: "Majestic Bus Station", arrivalMinutes: 0 },
      { id: "s2", name: "Corporation / Hudson Circle", arrivalMinutes: 12 },
      { id: "s3", name: "Richmond Circle", arrivalMinutes: 19 },
      { id: "s4", name: "Domlur TTMC", arrivalMinutes: 31 },
      { id: "s5", name: "HAL Main Gate", arrivalMinutes: 42 },
      { id: "s6", name: "Marathahalli Bridge", arrivalMinutes: 52 },
      { id: "s7", name: "Kundalahalli Gate", arrivalMinutes: 60 },
      { id: "s8", name: "ITPL / Whitefield TTMC", arrivalMinutes: 72 },
    ],
    durationMinutes: 72,
    frequency: "Demo only",
    crowdLevel: "Medium",
    operatingHours: "Not verified",
    area: "Bengaluru",
  },
  {
    id: "r2",
    number: "500-D",
    name: "Silk Board to Tin Factory via Marathahalli",
    origin: "Silk Board Junction",
    destination: "Tin Factory Junction",
    stops: [
      { id: "s9", name: "Silk Board Junction", arrivalMinutes: 0 },
      { id: "s10", name: "HSR Layout 14th Main", arrivalMinutes: 8 },
      { id: "s11", name: "Bellandur Central Mall", arrivalMinutes: 20 },
      { id: "s12", name: "Devarabeesanahalli (Ecospace)", arrivalMinutes: 26 },
      { id: "s13", name: "Kadubeesanahalli", arrivalMinutes: 32 },
      { id: "s6", name: "Marathahalli Bridge", arrivalMinutes: 43 },
      { id: "s14", name: "KR Puram Railway Station", arrivalMinutes: 57 },
      { id: "s15", name: "Tin Factory Junction", arrivalMinutes: 63 },
    ],
    durationMinutes: 63,
    frequency: "Demo only",
    crowdLevel: "Low",
    operatingHours: "Not verified",
    area: "Bengaluru",
  },
  {
    id: "r3",
    number: "365",
    name: "Majestic to Electronic City",
    origin: "Majestic Bus Station",
    destination: "Electronic City Tollgate",
    stops: [
      { id: "s1", name: "Majestic Bus Station", arrivalMinutes: 0 },
      { id: "s2", name: "Corporation / Hudson Circle", arrivalMinutes: 12 },
      { id: "s19", name: "Jayanagar 4th Block", arrivalMinutes: 25 },
      { id: "s9", name: "Silk Board Junction", arrivalMinutes: 40 },
      { id: "s16", name: "Electronic City Tollgate", arrivalMinutes: 62 },
    ],
    durationMinutes: 62,
    frequency: "Demo only",
    crowdLevel: "High",
    operatingHours: "Not verified",
    area: "Bengaluru",
  },
];

export const MOCK_ARRIVALS: BusArrival[] = [
  {
    id: "a1",
    routeId: "r1",
    busNumber: "335-E",
    routeName: "Majestic to Whitefield via HAL",
    origin: "Majestic Bus Station",
    destination: "ITPL / Whitefield TTMC",
    arrivalMinutes: 3,
    scheduledTime: "Demo only",
    crowdLevel: "Medium",
    availableSeats: null,
  },
  {
    id: "a2",
    routeId: "r2",
    busNumber: "500-D",
    routeName: "Silk Board to Tin Factory via Marathahalli",
    origin: "Silk Board Junction",
    destination: "Tin Factory Junction",
    arrivalMinutes: 7,
    scheduledTime: "Demo only",
    crowdLevel: "Low",
    availableSeats: null,
  },
  {
    id: "a3",
    routeId: "r3",
    busNumber: "365",
    routeName: "Majestic to Electronic City",
    origin: "Majestic Bus Station",
    destination: "Electronic City Tollgate",
    arrivalMinutes: 12,
    scheduledTime: "Demo only",
    crowdLevel: "High",
    availableSeats: null,
  },
];

/**
 * Returns alternative arrivals for a High-crowd arrival.
 *
 * Alternatives must:
 *   - serve the same destination OR share at least one stop name with the
 *     crowded route (connecting journey)
 *   - NOT be the same arrival record
 *   - NOT themselves be High crowd level
 *
 * Returns an empty array for Low/Medium arrivals or when no suitable
 * alternative exists. All data is from MOCK_ARRIVALS — no backend call.
 */
export function getAlternatives(arrival: BusArrival): BusArrival[] {
  if (arrival.crowdLevel !== "High") return [];

  const crowdedRoute = MOCK_ROUTES.find((r) => r.id === arrival.routeId);
  const crowdedStopNames = new Set(
    crowdedRoute?.stops.map((s) => s.name.toLowerCase()) ?? []
  );

  return MOCK_ARRIVALS.filter((a) => {
    if (a.id === arrival.id) return false;
    if (a.crowdLevel === "High") return false;

    // Same destination
    if (a.destination.toLowerCase() === arrival.destination.toLowerCase()) return true;

    // Shares at least one stop with the crowded route (connecting journey)
    const altRoute = MOCK_ROUTES.find((r) => r.id === a.routeId);
    return altRoute?.stops.some((s) => crowdedStopNames.has(s.name.toLowerCase())) ?? false;
  });
}

export function searchRoutes(origin: string, destination: string): BusRoute[] {
  const o = origin.toLowerCase().trim();
  const d = destination.toLowerCase().trim();
  if (!o && !d) return MOCK_ROUTES;
  if ((o && !getServiceArea(origin)) || (d && !getServiceArea(destination))) return [];
  return MOCK_ROUTES.filter((r) => {
    const originArea = o ? getServiceArea(origin) : null;
    const destinationArea = d ? getServiceArea(destination) : null;
    const matchOrigin =
      !o ||
      originArea === r.area ||
      r.origin.toLowerCase().includes(o) ||
      r.stops.some((s) => s.name.toLowerCase().includes(o));
    const matchDest =
      !d ||
      destinationArea === r.area ||
      r.destination.toLowerCase().includes(d) ||
      r.stops.some((s) => s.name.toLowerCase().includes(d));
    return matchOrigin && matchDest;
  });
}
