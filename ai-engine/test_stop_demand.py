
import pytest

from app.services.stop_demand_analyzer import analyze_stop_demand

# Simulated stop data
stops = [
    {
        "stop_id": "S101",
        "stop_name": "Central",
        "passenger_demand": 90,
        "available_capacity": 60
    },
    {
        "stop_id": "S102",
        "stop_name": "Market",
        "passenger_demand": 35,
        "available_capacity": 60
    },
    {
        "stop_id": "S103",
        "stop_name": "University",
        "passenger_demand": 20,
        "available_capacity": 60
    }
]

@pytest.mark.parametrize(
    ("stop", "expected_response"),
    [
        (
            stops[0],
            {
                "stopId": "S101",
                "stopName": "Central",
                "passengerDemand": 90,
                "availableCapacity": 60,
                "demandPercentage": 150.0,
                "demandLevel": "Very High",
                "additionalBusesRecommended": 1,
                "recommendation": "Deploy additional buses",
            },
        ),
        (
            stops[1],
            {
                "stopId": "S102",
                "stopName": "Market",
                "passengerDemand": 35,
                "availableCapacity": 60,
                "demandPercentage": 58.33,
                "demandLevel": "Moderate",
                "additionalBusesRecommended": 0,
                "recommendation": "Current capacity is sufficient",
            },
        ),
        (
            stops[2],
            {
                "stopId": "S103",
                "stopName": "University",
                "passengerDemand": 20,
                "availableCapacity": 60,
                "demandPercentage": 33.33,
                "demandLevel": "Low",
                "additionalBusesRecommended": 0,
                "recommendation": "Current capacity is sufficient",
            },
        ),
    ],
)
def test_existing_stop_scenarios_return_expected_responses(stop, expected_response):
    assert analyze_stop_demand(
        stop_id=stop["stop_id"],
        stop_name=stop["stop_name"],
        passenger_demand=stop["passenger_demand"],
        available_capacity=stop["available_capacity"],
    ) == expected_response


@pytest.mark.parametrize(
    ("passenger_demand", "expected_level"),
    [
        (0, "Low"),
        (50, "Low"),
        (51, "Moderate"),
        (80, "Moderate"),
        (81, "High"),
        (100, "High"),
        (101, "Very High"),
    ],
)
def test_stop_demand_classifies_boundary_values(passenger_demand, expected_level):
    result = analyze_stop_demand("S100", "Test Stop", passenger_demand, 100)

    assert result["demandLevel"] == expected_level


@pytest.mark.parametrize(
    ("passenger_demand", "expected_additional_buses"),
    [
        (100, 0),
        (101, 1),
        (200, 1),
        (201, 2),
    ],
)
def test_stop_demand_calculates_additional_buses(
    passenger_demand, expected_additional_buses
):
    result = analyze_stop_demand("S100", "Test Stop", passenger_demand, 100)

    assert result["additionalBusesRecommended"] == expected_additional_buses


@pytest.mark.parametrize(
    ("passenger_demand", "available_capacity", "message"),
    [
        (-1, 100, "Passenger demand cannot be negative"),
        (1, 0, "Available capacity must be greater than zero"),
        (1, -1, "Available capacity must be greater than zero"),
    ],
)
def test_stop_demand_rejects_invalid_inputs(
    passenger_demand, available_capacity, message
):
    with pytest.raises(ValueError, match=message):
        analyze_stop_demand(
            "S100", "Test Stop", passenger_demand, available_capacity
        )
