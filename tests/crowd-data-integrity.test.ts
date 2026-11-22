import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AlternativeBusCard from "../src/components/AlternativeBusCard";

describe("crowd data integrity UI", () => {
  it("renders unavailable alternative crowd data neutrally instead of red", () => {
    const html = renderToStaticMarkup(
      createElement(AlternativeBusCard, {
        alternativeBus: {
          busNumber: "A-1",
          routeName: "Test Route",
          crowdLevel: "unavailable",
          occupancyPercent: null,
          nextArrivalMins: 5,
        },
        currentBus: {
          busNumber: "C-1",
          nextArrivalMins: 10,
          occupancyPercent: 40,
        },
        onSelectAlternative: vi.fn(),
      }),
    );

    expect(html).toContain("Unavailable");
    expect(html).toContain("#94a3b8");
  });

  it("uses null passenger chart values and unavailable summaries", () => {
    const analytics = readFileSync(
      "src/app/admin/analytics/page.tsx",
      "utf8",
    );
    expect(analytics).toContain("passengers: bus.passengerCount");
    expect(analytics).not.toContain("Number(bus.passengerCount) || 0");
    expect(analytics).toContain("unavailable crowd readings");

    const fleet = readFileSync("src/app/admin/fleet/page.tsx", "utf8");
    expect(fleet).toContain("bus.occupancy === null");
    expect(fleet).not.toContain("Number(bus.occupancy_percent) || 0");
    expect(fleet).not.toContain("passengerCount = Number(bus.current_passengers)");

    const fleetMap = readFileSync("src/components/admin/FleetMap.tsx", "utf8");
    expect(fleetMap).toContain("occupancy: number | null");
    expect(fleetMap).toContain("passengers === null");
  });

  it("includes Very High and Unavailable in home summaries", () => {
    const home = readFileSync("src/screens/Home.jsx", "utf8");
    expect(home).toContain("veryHighCrowdBuses");
    expect(home).toContain("unavailableCrowdBuses");
    expect(home).toContain("Very High Crowd");
    expect(home).toContain("Unavailable");

    const tracking = readFileSync("src/screens/BusTracking.jsx", "utf8");
    expect(tracking).toContain("bus.crowdLevel === 'very high'");
    expect(tracking).toContain("Very High");
  });

  it("handles alternative zero and missing occupancy separately", () => {
    const service = readFileSync("src/services/busService.js", "utf8");
    expect(service).not.toContain("(currentBus.occupancyPercent || 50)");
    expect(service).not.toContain("(candidate.occupancyPercent || 50)");
    expect(service).toContain("currentOccupancy !== null && candidateOccupancy !== null");
    expect(service).toContain("occupancy unavailable");
  });

  it("initializes and tears down the fleet Leaflet map in an effect", () => {
    const fleetMap = readFileSync("src/components/admin/FleetMap.tsx", "utf8");
    const fleetPage = readFileSync("src/app/admin/fleet/page.tsx", "utf8");

    expect(fleetMap).toContain("useEffect(() => {");
    expect(fleetMap).toContain("L.map(container");
    expect(fleetMap).toContain("map.remove()");
    expect(fleetMap).toContain("markerLayer.clearLayers()");
    expect(fleetMap).toContain("L.control.zoom({ position: \"bottomright\" }).addTo(map)");
    expect(fleetMap).not.toContain("<MapContainer");
    expect(fleetPage).toContain("ssr: false");
  });
});
