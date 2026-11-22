
def recommend_alternative_buses(
    target_destination: str,
    buses: list,
    boarding_stop: str,
    exclude_bus_id: str | None = None,
) -> dict:
    """
    Find less-crowded buses travelling from boarding_stop to target_destination.

    A bus is considered suitable when ALL of the following are true:
      - Its crowd_level is not High or Very High.
      - If a stops list is present:
          - The boarding stop appears in the stops list.
          - The target destination appears in the stops list.
          - The boarding stop comes before the target destination.
      - If no stops list is present (older records):
          - The destination field matches target_destination (case-insensitive).

    Parameters
    ----------
    target_destination : str
        The stop the passenger wants to reach.
    buses : list
        List of bus records to evaluate.
    boarding_stop : str
        The stop the passenger selected for boarding.

    Optional bus fields route_id and stops are handled safely — buses that
    omit them are still evaluated using the destination field alone.
    """

    suitable_buses = []
    target   = target_destination.lower()
    boarding = boarding_stop.lower()

    for bus in buses:
        if exclude_bus_id and bus.get("bus_id") == exclude_bus_id:
            continue

        # --- Crowd level check -------------------------------------------
        crowd = bus.get("crowd_level", "").lower()
        if crowd in ["high", "very high"]:
            continue

        # --- Destination / stops check -----------------------------------
        stops = bus.get("stops", [])

        if stops:
            # Normalise stop names for comparison
            stops_lower = [s.lower() for s in stops]

            # Both the boarding stop and target destination must be in the list
            if boarding not in stops_lower:
                continue

            if target not in stops_lower:
                continue

            # Boarding stop must come strictly before the target destination
            if stops_lower.index(boarding) >= stops_lower.index(target):
                continue

        else:
            # Fallback for older records without a stops list:
            # use the destination field directly
            if bus.get("destination", "").lower() != target:
                continue

        # --- Build recommendation record ---------------------------------
        suitable_buses.append({
            "bus_id":      bus["bus_id"],
            "bus_number":  bus.get("bus_number"),
            "route_id":    bus.get("route_id"),
            "route_name":  bus.get("route_name"),
            "destination": bus["destination"],
            "crowd_level": bus["crowd_level"],
            "occupancy_percent": bus.get("occupancy_percent"),
            "category": bus.get("category"),
            "fare": bus.get("fare"),
            "eta_minutes": bus["eta_minutes"],
            "stops":       stops if stops else None,
        })

    # Sort by soonest arrival first
    suitable_buses.sort(key=lambda bus: bus["eta_minutes"])

    if suitable_buses:
        message = "Less-crowded alternative buses found."
    else:
        message = "No less-crowded alternative bus is currently available."

    return {
        "boarding_stop": boarding_stop,
        "destination":   target_destination,
        "alternatives":  suitable_buses,
        "message":       message,
    }
