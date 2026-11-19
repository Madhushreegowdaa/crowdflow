
def recommend_alternative_buses(
    target_destination: str,
    buses: list
) -> dict:
    """
    Find less-crowded buses travelling to the requested destination.
    """

    suitable_buses = []

    for bus in buses:
        if bus["destination"].lower() != target_destination.lower():
            continue

        if bus["crowd_level"].lower() in ["high", "very high"]:
            continue

        suitable_buses.append({
            "bus_id": bus["bus_id"],
            "destination": bus["destination"],
            "crowd_level": bus["crowd_level"],
            "eta_minutes": bus["eta_minutes"]
        })

    suitable_buses.sort(key=lambda bus: bus["eta_minutes"])

    if suitable_buses:
        message = "Less-crowded alternative buses found."
    else:
        message = "No less-crowded alternative bus is currently available."

    return {
        "destination": target_destination,
        "alternatives": suitable_buses,
        "message": message
    }
