
def analyze_stop_demand(
    stop_id: str,
    stop_name: str,
    passenger_demand: int,
    available_capacity: int
) -> dict:
    """
    Analyze passenger demand at a bus stop and recommend additional buses
    when demand exceeds available capacity.
    """

    if passenger_demand < 0:
        raise ValueError("Passenger demand cannot be negative.")

    if available_capacity <= 0:
        raise ValueError("Available capacity must be greater than zero.")

    demand_percentage = (passenger_demand / available_capacity) * 100

    # Classify demand level based on percentage thresholds
    if demand_percentage <= 50:
        demand_level = "Low"
    elif demand_percentage <= 80:
        demand_level = "Moderate"
    elif demand_percentage <= 100:
        demand_level = "High"
    else:
        demand_level = "Very High"

    # Recommend additional buses only when demand exceeds capacity.
    # Each additional bus provides the same capacity as the existing one.
    # math: ceil(excess_passengers / capacity_per_bus)
    # which equals: ceil((passenger_demand - available_capacity) / available_capacity)
    # using integer arithmetic: (excess + capacity - 1) // capacity
    if passenger_demand > available_capacity:
        recommendation = "Deploy additional buses"
        excess = passenger_demand - available_capacity
        additional_buses = (excess + available_capacity - 1) // available_capacity
    else:
        recommendation = "Current capacity is sufficient"
        additional_buses = 0

    return {
        "stopId":                    stop_id,
        "stopName":                  stop_name,
        "passengerDemand":           passenger_demand,
        "availableCapacity":         available_capacity,
        "demandPercentage":          round(demand_percentage, 2),
        "demandLevel":               demand_level,
        "additionalBusesRecommended": additional_buses,
        "recommendation":            recommendation,
    }
