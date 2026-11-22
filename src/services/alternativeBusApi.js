export function resolveAlternativeJourney({
  stops: routeStops,
  source,
  destination,
  fallbackBoardingStop,
} = {}) {
  const stops = Array.isArray(routeStops)
    ? routeStops
        .map((stop) => (typeof stop === "string" ? stop : stop?.name))
        .filter((name) => typeof name === "string" && name.trim())
    : [];

  return {
    boardingStop:
      source?.trim() || fallbackBoardingStop?.trim() || stops[0] || "",
    targetDestination:
      destination?.trim() || stops[stops.length - 1] || "",
  };
}

function mapAlternativeBus(bus) {
  return {
    id: bus.bus_id,
    busNumber: bus.bus_number || bus.bus_id,
    routeName: bus.route_name || bus.destination,
    category: bus.category,
    crowdLevel: String(bus.crowd_level || "unavailable").toLowerCase(),
    occupancyPercent: bus.occupancy_percent,
    nextArrivalMins: bus.eta_minutes,
    fare: bus.fare,
    stops: bus.stops || [],
    badgeType: "neutral",
  };
}

export async function fetchAlternativeBuses({
  boardingStop,
  targetDestination,
  currentBusId,
}) {
  const response = await fetch("/api/passenger/bus-alternatives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      boarding_stop: boardingStop,
      target_destination: targetDestination,
      current_bus_id: currentBusId,
    }),
    cache: "no-store",
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("The alternative bus service returned an invalid response.");
  }

  if (!response.ok || !body?.success || !body?.data) {
    throw new Error(
      body?.message || "Alternative bus recommendations are unavailable.",
    );
  }

  if (!Array.isArray(body.data.alternatives)) {
    throw new Error("The alternative bus service returned invalid recommendations.");
  }

  return {
    message: body.data.message,
    alternatives: body.data.alternatives.map(mapAlternativeBus),
  };
}
