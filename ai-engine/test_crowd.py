
import pytest

from app.services.crowd_estimator import estimate_crowd


@pytest.mark.parametrize(
    ("occupancy_percent", "expected_level"),
    [
        (0, "Low"),
        (20, "Low"),
        (30, "Low"),
        (30.01, "Moderate"),
        (45, "Moderate"),
        (60, "Moderate"),
        (60.01, "High"),
        (75, "High"),
        (85, "High"),
        (85.01, "Very High"),
        (95, "Very High"),
        (100, "Very High"),
    ],
)
def test_estimate_crowd_returns_expected_level(occupancy_percent, expected_level):
    assert estimate_crowd(occupancy_percent) == {
        "occupancyPercent": occupancy_percent,
        "crowdLevel": expected_level,
    }


@pytest.mark.parametrize("occupancy_percent", [-0.01, 100.01])
def test_estimate_crowd_rejects_out_of_range_occupancy(occupancy_percent):
    with pytest.raises(ValueError, match="Occupancy must be between 0 and 100"):
        estimate_crowd(occupancy_percent)
