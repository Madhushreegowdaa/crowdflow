import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../src/app/api/passenger/bus-alternatives/route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("passenger alternative bus route", () => {
  it("forwards the selected journey through the configured Express API", async () => {
    vi.stubEnv("CROWDFLOW_API_BASE_URL", "http://127.0.0.1:5000");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
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
                crowd_level: "Moderate",
                eta_minutes: 6,
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/passenger/bus-alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boarding_stop: " Corporation / Hudson Circle ",
          target_destination: " ITPL / Whitefield TTMC ",
          current_bus_id: "bus-335e-1",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://127.0.0.1:5000/api/analytics/buses/alternatives"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boarding_stop: "Corporation / Hudson Circle",
          target_destination: "ITPL / Whitefield TTMC",
          exclude_bus_id: "bus-335e-1",
        }),
        cache: "no-store",
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        boarding_stop: "Corporation / Hudson Circle",
        destination: "ITPL / Whitefield TTMC",
        alternatives: [{ bus_id: "bus-k3-alt", bus_number: "K-3 Rapid" }],
      },
    });
  });
});
