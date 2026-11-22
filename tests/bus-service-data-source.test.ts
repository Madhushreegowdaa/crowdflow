import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CrowdIndicator from "../src/components/CrowdIndicator";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("../src/services/supabaseClient");
  vi.restoreAllMocks();
  vi.resetModules();
});

function installSupabaseResponses(
  responses: Array<{ data: unknown; error: unknown }>,
  configured = true,
) {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    then: (resolve: (value: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve(responses.shift()).then(resolve),
  };
  vi.doMock("../src/services/supabaseClient", () => ({
    isSupabaseConfigured: configured,
    supabase: configured ? { from: vi.fn(() => query) } : null,
  }));
}

const databaseBus = {
  id: "database-bus",
  bus_number: "DB-1",
  route_name: "Database Route",
  crowd_level: "moderate",
  occupancy_percent: 40,
  current_passengers: 20,
  total_capacity: 50,
  current_lat: 12.97,
  current_lng: 77.59,
  stops: [{ id: "stop-1", name: "Majestic" }],
};

describe("bus data source labeling", () => {
  it("reports missing Supabase configuration instead of returning demo buses", async () => {
    vi.stubEnv("NEXT_PUBLIC_CROWDFLOW_DEMO_MODE", "false");
    installSupabaseResponses([], false);
    const service = await import("../src/services/busService");

    await expect(service.fetchLiveBusesFromSupabase()).rejects.toThrow(/not configured/i);
    expect(service.getAllBuses()).toEqual([]);
  });

  it("reports an empty Supabase result as unavailable in production mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_CROWDFLOW_DEMO_MODE", "false");
    installSupabaseResponses([{ data: [], error: null }]);
    const service = await import("../src/services/busService");

    await expect(service.fetchLiveBusesFromSupabase()).rejects.toThrow(/returned no bus records/i);

    expect(service.getIsLiveFromSupabase()).toBe(false);
    expect(service.getAllBuses()).toEqual([]);
  });

  it("uses the demo fleet only when demo mode is explicitly enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_CROWDFLOW_DEMO_MODE", "true");
    installSupabaseResponses([{ data: [], error: null }]);
    const service = await import("../src/services/busService");

    const buses = await service.fetchLiveBusesFromSupabase();

    expect(service.getIsLiveFromSupabase()).toBe(false);
    expect(buses.some((bus) => bus.id === "bus-335e-1")).toBe(true);
  });

  it("does not mix local demo buses into a non-empty Supabase fleet", async () => {
    installSupabaseResponses([{ data: [databaseBus], error: null }]);
    const service = await import("../src/services/busService");

    await service.fetchLiveBusesFromSupabase();

    expect(service.getIsLiveFromSupabase()).toBe(true);
    expect(service.getAllBuses().map((bus) => bus.id)).toEqual(["database-bus"]);
  });

  it("clears the bus cache when Supabase returns no records", async () => {
    vi.stubEnv("NEXT_PUBLIC_CROWDFLOW_DEMO_MODE", "false");
    installSupabaseResponses([{ data: [], error: null }]);
    const service = await import("../src/services/busService");

    await expect(service.fetchLiveBusesFromSupabase()).rejects.toThrow(/returned no bus records/i);

    expect(service.getIsLiveFromSupabase()).toBe(false);
    expect(service.getAllBuses()).toEqual([]);
    expect(service.getAllBuses().some((bus) => bus.id === "database-bus")).toBe(false);
  });

  it("clears stale database records and rejects after a query error", async () => {
    vi.stubEnv("NEXT_PUBLIC_CROWDFLOW_DEMO_MODE", "false");
    installSupabaseResponses([
      { data: [databaseBus], error: null },
      { data: null, error: { message: "offline" } },
    ]);
    const service = await import("../src/services/busService");

    await service.fetchLiveBusesFromSupabase();
    await expect(service.fetchLiveBusesFromSupabase()).rejects.toThrow(/could not be reached/i);

    expect(service.getIsLiveFromSupabase()).toBe(false);
    expect(service.getAllBuses()).toEqual([]);
  });

  it("maps missing crowd measurements to unavailable without inventing zeroes", async () => {
    installSupabaseResponses([{ data: [], error: null }]);
    const service = await import("../src/services/busService");

    const bus = service.mapSupabaseBusToModel({
      ...databaseBus,
      crowd_level: null,
      occupancy_percent: null,
      current_passengers: null,
      total_capacity: null,
    });

    expect(bus.crowdLevel).toBe("unavailable");
    expect(bus.occupancyPercent).toBeNull();
    expect(bus.currentPassengers).toBeNull();
    expect(bus.totalCapacity).toBeNull();
  });

  it("preserves measured zeroes and derives the crowd level from occupancy", async () => {
    installSupabaseResponses([{ data: [], error: null }]);
    const service = await import("../src/services/busService");

    const bus = service.mapSupabaseBusToModel({
      ...databaseBus,
      crowd_level: "Very High",
      occupancy_percent: 0,
      current_passengers: 0,
    });

    expect(bus.crowdLevel).toBe("low");
    expect(bus.occupancyPercent).toBe(0);
    expect(bus.currentPassengers).toBe(0);
  });

  it.each([
    [0, "low"], [20, "low"], [30, "low"],
    [31, "moderate"], [45, "moderate"], [60, "moderate"],
    [61, "high"], [75, "high"], [85, "high"],
    [86, "very high"], [95, "very high"], [100, "very high"],
  ])("classifies %i%% occupancy as %s", async (occupancy, expected) => {
    installSupabaseResponses([{ data: [], error: null }]);
    const service = await import("../src/services/busService");
    const bus = service.mapSupabaseBusToModel({
      ...databaseBus,
      crowd_level: "high",
      occupancy_percent: occupancy,
    });

    expect(bus.crowdLevel).toBe(expected);
  });
});

describe("crowd indicator data integrity", () => {
  it("renders missing occupancy as unavailable instead of zero or a derived count", () => {
    const html = renderToStaticMarkup(createElement(CrowdIndicator, {
      level: "low",
      occupancyPercent: null,
      currentPassengers: null,
      totalCapacity: null,
      variant: "detailed",
    }));

    expect(html).toContain("Low Crowd");
    expect(html).toContain("Occupancy is unavailable.");
    expect(html).toContain("Passenger count unavailable");
    expect(html).not.toContain("0%");
    expect(html).not.toContain("passengers aboard");
  });

  it("renders Very High as a distinct crowd level", () => {
    const html = renderToStaticMarkup(createElement(CrowdIndicator, {
      level: "High",
      occupancyPercent: 88,
      currentPassengers: 46,
      totalCapacity: 50,
      variant: "badge",
    }));

    expect(html).toContain("Very High Crowd");
    expect(html).toContain("88% full");
  });
});
