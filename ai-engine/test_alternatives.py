
from app.services.alternative_recommender import recommend_alternative_buses

buses = [
    {
        "bus_id": "BUS101",
        "route_id": "R101",
        "stops": ["Central", "Market", "University"],
        "destination": "University",
        "crowd_level": "High",
        "eta_minutes": 10
    },
    {
        "bus_id": "BUS102",
        "route_id": "R102",
        "stops": ["Central", "Park", "University"],
        "destination": "University",
        "crowd_level": "Low",
        "eta_minutes": 15
    },
    {
        "bus_id": "BUS103",
        "route_id": "R103",
        "stops": ["Central", "Market", "University"],
        "destination": "University",
        "crowd_level": "Moderate",
        "eta_minutes": 8
    },
    {
        "bus_id": "BUS104",
        "route_id": "R104",
        "stops": ["Central", "Airport"],
        "destination": "Airport",
        "crowd_level": "Low",
        "eta_minutes": 5
    }
]

very_high_crowd_bus = {
    "bus_id": "BUS105",
    "route_id": "R105",
    "stops": ["Central", "Market", "University"],
    "destination": "University",
    "crowd_level": "Very High",
    "eta_minutes": 3,
}
candidate_buses = buses + [very_high_crowd_bus]


def test_central_to_university_alternatives_are_filtered_and_sorted_by_eta():
    assert recommend_alternative_buses(
        target_destination="University",
        buses=candidate_buses,
        boarding_stop="Central",
    ) == {
        "boarding_stop": "Central",
        "destination": "University",
        "alternatives": [
            {
                "bus_id": "BUS103",
                "bus_number": None,
                "route_id": "R103",
                "route_name": None,
                "destination": "University",
                "crowd_level": "Moderate",
                "occupancy_percent": None,
                "category": None,
                "fare": None,
                "eta_minutes": 8,
                "stops": ["Central", "Market", "University"],
            },
            {
                "bus_id": "BUS102",
                "bus_number": None,
                "route_id": "R102",
                "route_name": None,
                "destination": "University",
                "crowd_level": "Low",
                "occupancy_percent": None,
                "category": None,
                "fare": None,
                "eta_minutes": 15,
                "stops": ["Central", "Park", "University"],
            },
        ],
        "message": "Less-crowded alternative buses found.",
    }


def test_market_to_university_only_returns_buses_serving_market_first():
    assert recommend_alternative_buses(
        target_destination="University",
        buses=candidate_buses,
        boarding_stop="Market",
    ) == {
        "boarding_stop": "Market",
        "destination": "University",
        "alternatives": [
            {
                "bus_id": "BUS103",
                "bus_number": None,
                "route_id": "R103",
                "route_name": None,
                "destination": "University",
                "crowd_level": "Moderate",
                "occupancy_percent": None,
                "category": None,
                "fare": None,
                "eta_minutes": 8,
                "stops": ["Central", "Market", "University"],
            }
        ],
        "message": "Less-crowded alternative buses found.",
    }


def test_no_suitable_alternatives_returns_expected_message():
    assert recommend_alternative_buses("University", [], "Market") == {
        "boarding_stop": "Market",
        "destination": "University",
        "alternatives": [],
        "message": "No less-crowded alternative bus is currently available.",
    }


def test_excludes_the_current_bus_from_alternative_results():
    result = recommend_alternative_buses(
        "University",
        candidate_buses,
        boarding_stop="Central",
        exclude_bus_id="BUS103",
    )

    assert all(bus["bus_id"] != "BUS103" for bus in result["alternatives"])
