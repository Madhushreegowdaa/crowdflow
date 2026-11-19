
def estimate_crowd(occupancy_percent: float) -> dict:
    """
    Estimate the crowd level of a bus using its occupancy percentage.
    """

    if not 0 <= occupancy_percent <= 100:
        raise ValueError("Occupancy must be between 0 and 100.")

    if occupancy_percent <= 30:
        crowd_level = "Low"
    elif occupancy_percent <= 60:
        crowd_level = "Moderate"
    elif occupancy_percent <= 85:
        crowd_level = "High"
    else:
        crowd_level = "Very High"

    return {
        "occupancyPercent": occupancy_percent,
        "crowdLevel": crowd_level
    }
