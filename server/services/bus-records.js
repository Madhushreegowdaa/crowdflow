const CROWD_LEVELS = {
  low: "Low",
  moderate: "Moderate",
  medium: "Moderate",
  high: "High",
  "very high": "Very High",
};

function requireText(value, field) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new TypeError(`Bus record is missing ${field}.`);
  }

  return String(value).trim();
}

function requireFiniteNumber(value, field, { minimum } = {}) {
  if (value === null || value === undefined || value === "") {
    throw new TypeError(`Bus record is missing ${field}.`);
  }

  const number = Number(value);
  if (!Number.isFinite(number) || (minimum !== undefined && number < minimum)) {
    throw new TypeError(`Bus record has an invalid ${field}.`);
  }

  return number;
}

function normalizeCrowdLevel(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  const crowdLevel = CROWD_LEVELS[normalized];

  if (!crowdLevel) {
    throw new TypeError("Bus record has an unsupported crowd_level.");
  }

  return crowdLevel;
}

function extractStopNames(value) {
  let stops = value;
  if (typeof stops === "string") {
    try {
      stops = JSON.parse(stops);
    } catch {
      throw new TypeError("Bus record stops must contain valid JSON.");
    }
  }

  if (!Array.isArray(stops)) {
    throw new TypeError("Bus record stops must be an array.");
  }

  return stops.map((stop, index) => {
    const name = typeof stop === "string" ? stop : stop?.name;
    if (typeof name !== "string" || !name.trim()) {
      throw new TypeError(`Bus record stop at index ${index} is missing a name.`);
    }

    return name.trim();
  });
}

function mapBusRecord(row) {
  if (!row || typeof row !== "object") {
    throw new TypeError("Bus record must be an object.");
  }

  const stops = extractStopNames(row.stops);
  if (stops.length === 0) {
    throw new TypeError(
      "Bus record is missing a route terminal; no destination can be derived from empty stops."
    );
  }

  return {
    bus_id: requireText(row.id, "id"),
    bus_number: requireText(row.bus_number, "bus_number"),
    route_name: requireText(row.route_name, "route_name"),
    category: typeof row.category === "string" ? row.category.trim() : null,
    destination: stops[stops.length - 1],
    crowd_level: normalizeCrowdLevel(row.crowd_level),
    occupancy_percent: requireFiniteNumber(row.occupancy_percent, "occupancy_percent"),
    fare: requireFiniteNumber(row.fare, "fare", { minimum: 0 }),
    eta_minutes: requireFiniteNumber(row.next_arrival_mins, "next_arrival_mins", {
      minimum: 0,
    }),
    stops,
  };
}

async function getBusRecords(busClient = require("../config/supabase")) {
  const { data, error } = await busClient.from("buses").select("*");
  if (error) {
    throw error;
  }
  if (!Array.isArray(data)) {
    throw new TypeError("Bus query did not return a data array.");
  }

  return data.map(mapBusRecord);
}

async function requestAlternativeBuses(
  targetDestination,
  {
    aiEngineUrl,
    boardingStop,
    excludeBusId,
    busClient,
    fetchImpl = globalThis.fetch,
  } = {}
) {
  const destination = requireText(targetDestination, "target destination");
  const boarding_stop = requireText(boardingStop, "boarding stop");
  if (!aiEngineUrl) {
    throw new TypeError("aiEngineUrl is required to call the AI engine.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required to call the AI engine.");
  }

  const buses = await getBusRecords(busClient);
  const endpoint = new URL("/api/buses/alternatives", aiEngineUrl);
  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_destination: destination,
        boarding_stop,
        exclude_bus_id: excludeBusId,
        buses,
      }),
    });
  } catch (cause) {
    const error = new Error("AI engine is unavailable.");
    error.code = "AI_ENGINE_UNAVAILABLE";
    error.cause = cause;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      `AI engine request failed with status ${response.status}.`
    );
    error.code = "AI_ENGINE_BAD_RESPONSE";
    throw error;
  }

  return response.json();
}

module.exports = {
  getBusRecords,
  mapBusRecord,
  requestAlternativeBuses,
};
