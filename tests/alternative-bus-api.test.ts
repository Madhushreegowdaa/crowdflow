import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAlternativeBuses,
  resolveAlternativeJourney,
} from "../src/services/alternativeBusApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("passenger alternative bus API", () => {
  it("uses the passenger journey or actual route endpoints", () => {
    const bus = { stops: [{ name: "Market" }, { name: "University" }] };

    expect(
      resolveAlternativeJourney({
        stops: bus.stops,
        source: "Passenger-selected stop",
        destination: "Passenger-selected destination",
      }),
    ).toEqual({
      boardingStop: "Passenger-selected stop",
      targetDestination: "Passenger-selected destination",
    });

    expect(resolveAlternativeJourney({ stops: bus.stops })).toEqual({
      boardingStop: "Market",
      targetDestination: "University",
    });
  });

  it("sends the production 335-E request and maps the K-3 Rapid response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      async json() {
        return {
          success: true,
          data: {
            boarding_stop: "Corporation / Hudson Circle",
            destination: "ITPL / Whitefield TTMC",
            message: "Less-crowded alternative buses found.",
            alternatives: [
              {
                bus_id: "bus-k3-alt",
                bus_number: "K-3 Rapid",
                route_name: "Corporation to ITPL Express",
                destination: "ITPL / Whitefield TTMC",
                crowd_level: "Moderate",
                occupancy_percent: 58,
                category: "City Fast Corridor",
                fare: 30,
                eta_minutes: 6,
                stops: [
                  "Corporation / Hudson Circle",
                  "Richmond Circle",
                  "Domlur TTMC",
                  "Marathahalli Bridge",
                  "ITPL / Whitefield TTMC",
                ],
              },
            ],
          },
        };
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAlternativeBuses({
      boardingStop: "Corporation / Hudson Circle",
      targetDestination: "ITPL / Whitefield TTMC",
      currentBusId: "bus-335e-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/passenger/bus-alternatives",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          boarding_stop: "Corporation / Hudson Circle",
          target_destination: "ITPL / Whitefield TTMC",
          current_bus_id: "bus-335e-1",
        }),
      }),
    );
    expect(result.alternatives).toHaveLength(1);
    expect(result.alternatives[0]).toMatchObject({
      id: "bus-k3-alt",
      busNumber: "K-3 Rapid",
      routeName: "Corporation to ITPL Express",
      crowdLevel: "moderate",
      occupancyPercent: 58,
      fare: 30,
      nextArrivalMins: 6,
    });
  });

  it("surfaces API failures instead of returning demo alternatives", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        async json() {
          return { success: false, message: "Service unavailable." };
        },
      }),
    );

    await expect(
      fetchAlternativeBuses({
        boardingStop: "Market",
        targetDestination: "University",
        currentBusId: "bus-1",
      }),
    ).rejects.toThrow("Service unavailable.");
  });
});
