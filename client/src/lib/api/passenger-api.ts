/**
 * CrowdFlow — Passenger API integration layer
 * Member 2: Passenger Dashboard, Bus Tracking, Frontend–Backend Integration
 *
 * Defines TypeScript contracts and API service functions for all
 * passenger-facing data. No real requests are made until Member 1 provides
 * the backend API contract and NEXT_PUBLIC_API_URL is set in .env.local.
 */

// ─── Base URL ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Shared types ────────────────────────────────────────────────────────────

/** Crowd density level reported by the backend. */
export type CrowdLevel = "Low" | "Moderate" | "High";

/** A single stop along a bus route. */
export interface RouteStop {
  id: string;
  name: string;
  /** Scheduled minutes from the route origin. */
  scheduledMinutesFromOrigin: number;
  latitude: number;
  longitude: number;
}

/** Full route information returned by the backend. */
export interface ApiRoute {
  id: string;
  number: string;
  name: string;
  origin: string;
  destination: string;
  stops: RouteStop[];
  durationMinutes: number;
  /** Human-readable frequency string, e.g. "Every 10 min". */
  frequency: string;
  crowdLevel: CrowdLevel;
  operatingHours: string;
}

/** Real-time GPS position of a single bus vehicle. */
export interface BusLocation {
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  /** ISO 8601 timestamp of the last GPS fix. */
  timestamp: string;
  /** Index of the last stop the bus passed through. */
  lastStopIndex: number;
}

/** Arrival prediction for a bus at a given stop or terminus. */
export interface BusArrival {
  id: string;
  routeId: string;
  busNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  /** Predicted minutes until arrival at the queried stop. */
  etaMinutes: number;
  scheduledTime: string;
  crowdLevel: CrowdLevel;
  /** null when seat data is unavailable. */
  availableSeats: number | null;
}

/** Crowd status for a specific route or stop. */
export interface CrowdStatus {
  routeId: string;
  stopId?: string;
  level: CrowdLevel;
  occupancyPercent: number;
  /** ISO 8601 timestamp of the reading. */
  recordedAt: string;
}

// ─── API response envelope ───────────────────────────────────────────────────

/** Generic wrapper matching a standard REST envelope: { data, error }. */
interface ApiResponse<T> {
  data: T;
  error?: string;
}

// ─── Request helper ──────────────────────────────────────────────────────────

/**
 * Thin fetch wrapper used by every service function below.
 * - Throws an Error when the HTTP status is not 2xx.
 * - Unwraps the `data` field from the standard API envelope.
 * - All callers are async so errors can be caught with try/catch or .catch().
 */
async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local before making API calls."
    );
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
}

// ─── Route service ───────────────────────────────────────────────────────────

/**
 * Fetch all available bus routes.
 * Endpoint to be confirmed with Member 1.
 */
export async function fetchRoutes(): Promise<ApiRoute[]> {
  return apiRequest<ApiRoute[]>("/routes");
}

/**
 * Fetch a single route by ID.
 * Endpoint to be confirmed with Member 1.
 */
export async function fetchRoute(routeId: string): Promise<ApiRoute> {
  return apiRequest<ApiRoute>(`/routes/${routeId}`);
}

/**
 * Search routes by origin and/or destination stop name.
 * Endpoint to be confirmed with Member 1.
 */
export async function searchRoutes(
  origin: string,
  destination: string
): Promise<ApiRoute[]> {
  const params = new URLSearchParams();
  if (origin) params.set("origin", origin);
  if (destination) params.set("destination", destination);
  return apiRequest<ApiRoute[]>(`/routes/search?${params.toString()}`);
}

// ─── Bus location service ────────────────────────────────────────────────────

/**
 * Fetch the current GPS locations of all active buses on a route.
 * Endpoint to be confirmed with Member 1.
 */
export async function fetchBusLocations(
  routeId: string
): Promise<BusLocation[]> {
  return apiRequest<BusLocation[]>(`/routes/${routeId}/buses`);
}

// ─── Arrivals service ────────────────────────────────────────────────────────

/**
 * Fetch upcoming arrivals at a stop, or across all stops when stopId is omitted.
 * Endpoint to be confirmed with Member 1.
 */
export async function fetchArrivals(stopId?: string): Promise<BusArrival[]> {
  const path = stopId ? `/stops/${stopId}/arrivals` : "/arrivals";
  return apiRequest<BusArrival[]>(path);
}

// ─── Crowd status service ────────────────────────────────────────────────────

/**
 * Fetch the current crowd level for a route, optionally scoped to a stop.
 * Endpoint to be confirmed with Member 1.
 */
export async function fetchCrowdStatus(
  routeId: string,
  stopId?: string
): Promise<CrowdStatus> {
  const path = stopId
    ? `/routes/${routeId}/stops/${stopId}/crowd`
    : `/routes/${routeId}/crowd`;
  return apiRequest<CrowdStatus>(path);
}
