const CROWD_LEVELS = new Set(["low", "moderate", "high", "very high", "unavailable"]);

export const classifyCrowdLevel = (occupancy) => {
  if (occupancy <= 30) return "low";
  if (occupancy <= 60) return "moderate";
  if (occupancy <= 85) return "high";
  return "very high";
};

export const resolveCrowdLevel = (level, occupancy) => {
  if (occupancy !== null && occupancy !== undefined) {
    if (!Number.isFinite(occupancy) || occupancy < 0 || occupancy > 100) {
      return "unavailable";
    }
    return classifyCrowdLevel(occupancy);
  }

  const normalized = typeof level === "string" ? level.trim().toLowerCase() : "";
  if (normalized === "medium") return "moderate";
  return CROWD_LEVELS.has(normalized) ? normalized : "unavailable";
};
