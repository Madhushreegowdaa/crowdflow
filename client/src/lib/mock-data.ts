// CrowdFlow — Demo/mock data only. Not connected to any live system.

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
    number: "101",
    name: "City Centre Express",
    origin: "Central Station",
    destination: "University Campus",
    stops: [
      { id: "s1", name: "Central Station", arrivalMinutes: 0 },
      { id: "s2", name: "Market Square", arrivalMinutes: 5 },
      { id: "s3", name: "Library Junction", arrivalMinutes: 10 },
      { id: "s4", name: "Tech Park", arrivalMinutes: 18 },
      { id: "s5", name: "University Campus", arrivalMinutes: 25 },
    ],
    durationMinutes: 25,
    frequency: "Every 10 min",
    crowdLevel: "Medium",
    operatingHours: "06:00 – 23:00",
  },
  {
    id: "r2",
    number: "202",
    name: "Harbour Link",
    origin: "North Terminal",
    destination: "Harbour Front",
    stops: [
      { id: "s6", name: "North Terminal", arrivalMinutes: 0 },
      { id: "s7", name: "Riverside Walk", arrivalMinutes: 7 },
      { id: "s8", name: "Old Town", arrivalMinutes: 14 },
      { id: "s9", name: "Harbour Front", arrivalMinutes: 22 },
    ],
    durationMinutes: 22,
    frequency: "Every 15 min",
    crowdLevel: "Low",
    operatingHours: "07:00 – 22:00",
  },
  {
    id: "r3",
    number: "305",
    name: "Airport Shuttle",
    origin: "City Hall",
    destination: "International Airport",
    stops: [
      { id: "s10", name: "City Hall", arrivalMinutes: 0 },
      { id: "s11", name: "Business District", arrivalMinutes: 8 },
      { id: "s12", name: "Motorway Junction", arrivalMinutes: 20 },
      { id: "s13", name: "Airport Terminal 1", arrivalMinutes: 38 },
      { id: "s14", name: "International Airport", arrivalMinutes: 42 },
    ],
    durationMinutes: 42,
    frequency: "Every 30 min",
    crowdLevel: "High",
    operatingHours: "04:30 – 01:00",
  },
  {
    id: "r4",
    number: "410",
    name: "Suburban Loop",
    origin: "Westgate",
    destination: "Eastfield",
    stops: [
      { id: "s15", name: "Westgate", arrivalMinutes: 0 },
      { id: "s16", name: "Parklands", arrivalMinutes: 6 },
      { id: "s17", name: "Shopping Centre", arrivalMinutes: 12 },
      { id: "s18", name: "Sports Complex", arrivalMinutes: 19 },
      { id: "s19", name: "Eastfield", arrivalMinutes: 28 },
    ],
    durationMinutes: 28,
    frequency: "Every 20 min",
    crowdLevel: "Low",
    operatingHours: "06:30 – 22:30",
  },
  {
    id: "r5",
    number: "520",
    name: "Night Owl",
    origin: "Central Station",
    destination: "South Suburbs",
    stops: [
      { id: "s20", name: "Central Station", arrivalMinutes: 0 },
      { id: "s21", name: "Entertainment District", arrivalMinutes: 9 },
      { id: "s22", name: "Hospital Road", arrivalMinutes: 17 },
      { id: "s23", name: "South Suburbs", arrivalMinutes: 30 },
    ],
    durationMinutes: 30,
    frequency: "Every 45 min",
    crowdLevel: "Medium",
    operatingHours: "22:00 – 05:00",
  },
];

export const MOCK_ARRIVALS: BusArrival[] = [
  {
    id: "a1",
    routeId: "r1",
    busNumber: "101",
    routeName: "City Centre Express",
    origin: "Central Station",
    destination: "University Campus",
    arrivalMinutes: 3,
    scheduledTime: "08:42",
    crowdLevel: "Medium",
    availableSeats: 14,
  },
  {
    id: "a2",
    routeId: "r2",
    busNumber: "202",
    routeName: "Harbour Link",
    origin: "North Terminal",
    destination: "Harbour Front",
    arrivalMinutes: 7,
    scheduledTime: "08:46",
    crowdLevel: "Low",
    availableSeats: 32,
  },
  {
    id: "a3",
    routeId: "r3",
    busNumber: "305",
    routeName: "Airport Shuttle",
    origin: "City Hall",
    destination: "International Airport",
    arrivalMinutes: 12,
    scheduledTime: "08:51",
    crowdLevel: "High",
    availableSeats: 4,
  },
  {
    id: "a4",
    routeId: "r4",
    busNumber: "410",
    routeName: "Suburban Loop",
    origin: "Westgate",
    destination: "Eastfield",
    arrivalMinutes: 18,
    scheduledTime: "08:57",
    crowdLevel: "Low",
    availableSeats: 28,
  },
  {
    id: "a5",
    routeId: "r1",
    busNumber: "101",
    routeName: "City Centre Express",
    origin: "Central Station",
    destination: "University Campus",
    arrivalMinutes: 23,
    scheduledTime: "09:02",
    crowdLevel: "Low",
    availableSeats: 40,
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
  return MOCK_ROUTES.filter((r) => {
    const matchOrigin =
      !o ||
      r.origin.toLowerCase().includes(o) ||
      r.stops.some((s) => s.name.toLowerCase().includes(o));
    const matchDest =
      !d ||
      r.destination.toLowerCase().includes(d) ||
      r.stops.some((s) => s.name.toLowerCase().includes(d));
    return matchOrigin && matchDest;
  });
}
