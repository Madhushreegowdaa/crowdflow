from datetime import datetime, timedelta, timezone

from app.services.crowd_estimator import estimate_crowd

MINIMUM_HISTORY_SAMPLES = 3


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def predict_bus_crowd(
    bus_id: str,
    samples: list,
    horizon_minutes: int = 15,
    as_of: datetime | None = None,
    max_sample_age_minutes: int = 30,
) -> dict:
    points = sorted(
        (
            (_as_utc(sample.recorded_at), float(sample.occupancy_percent))
            for sample in samples
        ),
        key=lambda point: point[0],
    )

    base = {
        "busId": bus_id,
        "predictionAvailable": False,
        "sampleCount": len(points),
        "horizonMinutes": horizon_minutes,
        "method": "linear-trend",
        "dataSource": "public.crowd_logs",
    }

    if len(points) < MINIMUM_HISTORY_SAMPLES:
        return {**base, "reason": "insufficient_history"}

    prediction_time = _as_utc(as_of or datetime.now(timezone.utc))
    sample_age_minutes = (
        prediction_time - points[-1][0]
    ).total_seconds() / 60
    if sample_age_minutes < 0:
        return {**base, "reason": "future_history"}
    if sample_age_minutes > max_sample_age_minutes:
        return {**base, "reason": "stale_history"}

    first_time = points[0][0]
    elapsed_minutes = [
        (recorded_at - first_time).total_seconds() / 60
        for recorded_at, _ in points
    ]
    mean_time = sum(elapsed_minutes) / len(elapsed_minutes)
    mean_occupancy = sum(value for _, value in points) / len(points)
    denominator = sum((value - mean_time) ** 2 for value in elapsed_minutes)

    if denominator == 0:
        return {**base, "reason": "insufficient_time_span"}

    slope = sum(
        (elapsed_minutes[index] - mean_time)
        * (points[index][1] - mean_occupancy)
        for index in range(len(points))
    ) / denominator
    forecast_minutes = sample_age_minutes + horizon_minutes
    predicted_occupancy = min(
        100.0,
        max(0.0, points[-1][1] + slope * forecast_minutes),
    )
    classification = estimate_crowd(predicted_occupancy)

    return {
        **base,
        "predictionAvailable": True,
        "predictedOccupancyPercent": round(predicted_occupancy, 1),
        "predictedCrowdLevel": classification["crowdLevel"],
        "predictedAt": (
            prediction_time + timedelta(minutes=horizon_minutes)
        ).isoformat(),
    }
