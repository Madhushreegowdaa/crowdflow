const LEVELS = new Set(["low", "moderate", "high", "very high", "unavailable"]);

function getOccupancyPercent(bus) {
  const stored = Number(bus?.occupancy_percent);
  if (
    bus?.occupancy_percent !== null &&
    bus?.occupancy_percent !== undefined &&
    bus?.occupancy_percent !== "" &&
    Number.isFinite(stored) &&
    stored >= 0 &&
    stored <= 100
  ) {
    return stored;
  }

  const passengers = Number(bus?.current_passengers);
  const capacity = Number(bus?.total_capacity);
  if (
    bus?.current_passengers !== null &&
    bus?.current_passengers !== undefined &&
    bus?.current_passengers !== "" &&
    bus?.total_capacity !== null &&
    bus?.total_capacity !== undefined &&
    bus?.total_capacity !== "" &&
    Number.isFinite(passengers) &&
    passengers >= 0 &&
    Number.isFinite(capacity) &&
    capacity > 0 &&
    passengers <= capacity
  ) {
    return (passengers / capacity) * 100;
  }

  return null;
}

function classifyCrowdLevel(occupancy) {
  if (occupancy <= 30) return "low";
  if (occupancy <= 60) return "moderate";
  if (occupancy <= 85) return "high";
  return "very high";
}

function resolveCrowdLevel(bus) {
  const occupancy = getOccupancyPercent(bus);
  if (occupancy !== null) return classifyCrowdLevel(occupancy);

  const stored = String(bus?.crowd_level ?? "").trim().toLowerCase();
  if (stored === "medium") return "moderate";
  return LEVELS.has(stored) ? stored : "unavailable";
}

module.exports = { classifyCrowdLevel, getOccupancyPercent, resolveCrowdLevel };
