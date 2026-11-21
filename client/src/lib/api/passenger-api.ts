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

/**
 * Crowd density level reported by the backend.
 * "Very High" is supported by the Python AI analytics engine (crowd_estimator.py)
 * and must be handled wherever CrowdLevel is consumed.
 */
export type CrowdLevel = "Low" | "Moderate" | "High" | "Very High";

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

// ─── Analytics types ─────────────────────────────────────────────────────────

/** Request payload for the alternative bus recommender. */
export interface AlternativeBusRequest {
  /** The destination passengers want to reach. */
  target_destination: string;
  /** List of candidate buses to evaluate. Each entry must include bus_id,
   *  destination, crowd_level and eta_minutes — matching the Python service schema. */
  buses: Array<{
    bus_id: string;
    destination: string;
    crowd_level: string;
    eta_minutes: number;
  }>;
}

/** A single alternative bus returned by the recommender. */
export interface AlternativeBus {
  bus_id: string;
  destination: string;
  crowd_level: string;
  eta_minutes: number;
}

/** Response from the alternative bus recommender. */
export interface AlternativeBusResponse {
  destination: string;
  alternatives: AlternativeBus[];
  message: string;
}

/** Demand analytics for a single bus stop. */
export interface StopDemand {
  stopId: string;
  stopName: string;
  routeId: string;
  passengerDemand: number;
  availableCapacity: number;
  demandPercentage: number;
  /** ISO 8601 timestamp of the reading. */
  recordedAt: string;
}

/** A single deployment recommendation for a route. */
export interface DeploymentRecommendation {
  routeId: string;
  passengerDemand: number;
  availableCapacity: number;
  demandPercentage: number;
  additionalBusesRecommended: number;
  recommendation: string;
}

// ─── Analytics services ───────────────────────────────────────────────────────

/**
 * Request alternative bus suggestions from the AI engine for a given destination.
 * Endpoint path to be confirmed with Member 1 before integration.
 */
export async function fetchAlternativeBuses(
  payload: AlternativeBusRequest
): Promise<AlternativeBusResponse> {
  return apiRequest<AlternativeBusResponse>("/api/analytics/buses/alternatives", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch passenger demand analytics for a stop, or all stops when stopId is omitted.
 * Endpoint path to be confirmed with Member 1 before integration.
 */
export async function fetchStopDemand(stopId?: string): Promise<StopDemand[]> {
  const path = stopId
    ? `/api/analytics/stops/demand?stopId=${encodeURIComponent(stopId)}`
    : "/api/analytics/stops/demand";
  return apiRequest<StopDemand[]>(path);
}

/**
 * Fetch additional-bus deployment recommendations across all routes.
 * Endpoint path to be confirmed with Member 1 before integration.
 */
export async function fetchDeploymentRecommendations(): Promise<DeploymentRecommendation[]> {
  return apiRequest<DeploymentRecommendation[]>("/api/analytics/deployment-recommendations");
}
