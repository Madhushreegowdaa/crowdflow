import pytest
from pydantic import ValidationError

from main import AlternativeBusRequest, get_alternative_buses


def test_alternative_endpoint_requires_a_boarding_stop():
    with pytest.raises(ValidationError):
        AlternativeBusRequest(target_destination="University", buses=[])


def test_alternative_endpoint_forwards_a_provided_boarding_stop():
    request = AlternativeBusRequest(
        target_destination="University",
        boarding_stop="Market",
        exclude_bus_id="another-bus",
        buses=[
            {
                "bus_id": "bus-1",
                "bus_number": "101",
                "route_name": "North Route",
                "destination": "University",
                "crowd_level": "Moderate",
                "eta_minutes": 6,
                "stops": ["Central", "Market", "University"],
            }
        ],
    )

    result = get_alternative_buses(request)

    assert result["boarding_stop"] == "Market"
    assert [bus["bus_id"] for bus in result["alternatives"]] == ["bus-1"]
