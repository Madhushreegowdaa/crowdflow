
def analyze_route_demand(
    route_id: str,
    passenger_demand: int,
    available_capacity: int
) -> dict:
    """
    Analyze route demand and recommend an additional bus
    when passenger demand exceeds available capacity.
    """

    if passenger_demand < 0:
        raise ValueError("Passenger demand cannot be negative.")

    if available_capacity <= 0:
        raise ValueError("Available capacity must be greater than zero.")

    demand_percentage = (
        passenger_demand / available_capacity
    ) * 100

    if demand_percentage > 100:
        recommendation = "Deploy an additional bus"
        additional_buses = (
            passenger_demand + available_capacity - 1
        ) // available_capacity - 1
    else:
        recommendation = "Current bus capacity is sufficient"
        additional_buses = 0

    return {
        "routeId": route_id,
        "passengerDemand": passenger_demand,
        "availableCapacity": available_capacity,
        "demandPercentage": round(demand_percentage, 2),
        "additionalBusesRecommended": additional_buses,
        "recommendation": recommendation
    }
