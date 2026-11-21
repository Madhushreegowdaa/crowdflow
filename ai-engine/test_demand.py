
import pytest

from app.services.demand_analyzer import analyze_route_demand


def test_route_demand_within_capacity_returns_expected_response():
    assert analyze_route_demand(
        route_id="R101",
        passenger_demand=40,
        available_capacity=60,
    ) == {
        "routeId": "R101",
        "passengerDemand": 40,
        "availableCapacity": 60,
        "demandPercentage": 66.67,
        "additionalBusesRecommended": 0,
        "recommendation": "Current bus capacity is sufficient",
    }


def test_route_demand_exceeding_capacity_returns_expected_response():
    assert analyze_route_demand(
        route_id="R102",
        passenger_demand=150,
        available_capacity=60,
    ) == {
        "routeId": "R102",
        "passengerDemand": 150,
        "availableCapacity": 60,
        "demandPercentage": 250.0,
        "additionalBusesRecommended": 2,
        "recommendation": "Deploy an additional bus",
    }


@pytest.mark.parametrize(
    ("passenger_demand", "expected_additional_buses"),
    [
        (0, 0),
        (60, 0),
        (61, 1),
        (120, 1),
        (121, 2),
    ],
)
def test_route_demand_calculates_additional_buses(
    passenger_demand, expected_additional_buses
):
    result = analyze_route_demand("R101", passenger_demand, 60)

    assert result["additionalBusesRecommended"] == expected_additional_buses
    assert result["recommendation"] == (
        "Deploy an additional bus"
        if expected_additional_buses
        else "Current bus capacity is sufficient"
    )


@pytest.mark.parametrize(
    ("passenger_demand", "available_capacity", "message"),
    [
        (-1, 60, "Passenger demand cannot be negative"),
        (1, 0, "Available capacity must be greater than zero"),
        (1, -1, "Available capacity must be greater than zero"),
    ],
)
def test_route_demand_rejects_invalid_inputs(
    passenger_demand, available_capacity, message
):
    with pytest.raises(ValueError, match=message):
        analyze_route_demand("R101", passenger_demand, available_capacity)
