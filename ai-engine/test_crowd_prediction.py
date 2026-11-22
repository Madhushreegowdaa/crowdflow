from datetime import datetime, timedelta, timezone

from app.services.crowd_predictor import predict_bus_crowd
from main import (
    BusCrowdHistory,
    CrowdPredictionRequest,
    CrowdSample as ApiCrowdSample,
    calculate_crowd_predictions,
)


def sample(minutes_ago: int, occupancy: float):
    return {
        "recorded_at": datetime.now(timezone.utc) - timedelta(minutes=minutes_ago),
        "occupancy_percent": occupancy,
    }


class CrowdSample:
    def __init__(self, value):
        self.recorded_at = value["recorded_at"]
        self.occupancy_percent = value["occupancy_percent"]


def test_prediction_extrapolates_from_real_ordered_history():
    result = predict_bus_crowd(
        "bus-1",
        [CrowdSample(sample(0, 20)), CrowdSample(sample(20, 10)), CrowdSample(sample(10, 15))],
        horizon_minutes=10,
    )

    assert result["predictionAvailable"] is True
    assert result["predictedOccupancyPercent"] == 25.0
    assert result["predictedCrowdLevel"] == "Low"
    assert result["dataSource"] == "public.crowd_logs"


def test_prediction_is_unavailable_without_enough_historical_samples():
    result = predict_bus_crowd("bus-1", [CrowdSample(sample(0, 40))])

    assert result["predictionAvailable"] is False
    assert result["reason"] == "insufficient_history"
    assert "predictedOccupancyPercent" not in result


def test_prediction_is_unavailable_when_samples_have_no_time_span():
    repeated = sample(10, 30)
    result = predict_bus_crowd(
        "bus-1",
        [CrowdSample(repeated), CrowdSample(repeated), CrowdSample(repeated)],
    )

    assert result["predictionAvailable"] is False
    assert result["reason"] == "insufficient_time_span"


def test_prediction_is_unavailable_when_latest_history_is_stale():
    result = predict_bus_crowd(
        "bus-1",
        [
            CrowdSample(sample(90, 10)),
            CrowdSample(sample(80, 15)),
            CrowdSample(sample(70, 20)),
        ],
        as_of=datetime.now(timezone.utc),
        max_sample_age_minutes=30,
    )

    assert result["predictionAvailable"] is False
    assert result["reason"] == "stale_history"


def test_fastapi_prediction_endpoint_returns_per_bus_history_results():
    as_of = datetime.now(timezone.utc)
    request = CrowdPredictionRequest(
        as_of=as_of,
        horizon_minutes=10,
        max_sample_age_minutes=30,
        buses=[
            BusCrowdHistory(
                bus_id="bus-1",
                samples=[
                    ApiCrowdSample(
                        recorded_at=as_of - timedelta(minutes=minutes_ago),
                        occupancy_percent=occupancy,
                    )
                    for minutes_ago, occupancy in [(20, 10), (10, 15), (0, 20)]
                ],
            )
        ],
    )

    response = calculate_crowd_predictions(request)

    assert response["success"] is True
    assert response["predictions"][0]["busId"] == "bus-1"
    assert response["predictions"][0]["predictedOccupancyPercent"] == 25.0


def test_prediction_preserves_schema_bus_ids_and_all_five_recent_samples():
    as_of = datetime.now(timezone.utc)
    bus_ids = ["bus-335e-1", "bus-500d-1", "bus-k3-alt", "bus-kia8-1"]
    request = CrowdPredictionRequest(
        as_of=as_of,
        buses=[
            BusCrowdHistory(
                bus_id=bus_id,
                samples=[
                    ApiCrowdSample(
                        recorded_at=as_of - timedelta(minutes=minutes_ago),
                        occupancy_percent=occupancy,
                    )
                    for minutes_ago, occupancy in [
                        (20, 30),
                        (15, 35),
                        (10, 40),
                        (5, 45),
                        (0, 50),
                    ]
                ],
            )
            for bus_id in bus_ids
        ],
    )

    predictions = calculate_crowd_predictions(request)["predictions"]

    assert [prediction["busId"] for prediction in predictions] == bus_ids
    assert all(prediction["sampleCount"] == 5 for prediction in predictions)
    assert all(prediction["predictionAvailable"] for prediction in predictions)
