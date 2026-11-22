
from datetime import datetime

from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.services.crowd_estimator import estimate_crowd
from app.services.crowd_predictor import predict_bus_crowd
from app.services.demand_analyzer import analyze_route_demand
from app.services.alternative_recommender import recommend_alternative_buses
from app.services.stop_demand_analyzer import analyze_stop_demand

app = FastAPI(
    title="CrowdFlow AI Analytics API",
    description="Crowd estimation and route demand analysis",
    version="1.0.0"
)


class CrowdRequest(BaseModel):
    occupancy_percent: float = Field(ge=0, le=100)


class DemandRequest(BaseModel):
    route_id: str
    passenger_demand: int = Field(ge=0)
    available_capacity: int = Field(gt=0)


class AlternativeBusRequest(BaseModel):
    target_destination: str
    boarding_stop: str
    exclude_bus_id: str | None = None
    buses: list


class CrowdSample(BaseModel):
    recorded_at: datetime
    occupancy_percent: float = Field(ge=0, le=100)


class BusCrowdHistory(BaseModel):
    bus_id: str = Field(min_length=1)
    samples: list[CrowdSample]


class CrowdPredictionRequest(BaseModel):
    as_of: datetime
    horizon_minutes: int = Field(default=15, ge=1, le=120)
    max_sample_age_minutes: int = Field(default=30, ge=1, le=1440)
    buses: list[BusCrowdHistory]


class StopDemandRequest(BaseModel):
    stop_id: str
    stop_name: str
    passenger_demand: int = Field(ge=0)
    available_capacity: int = Field(gt=0)


@app.get("/")
def home():
    return {
        "message": "CrowdFlow AI Analytics API is running"
    }


@app.post("/api/crowd/estimate")
def calculate_crowd(request: CrowdRequest):
    return estimate_crowd(request.occupancy_percent)


@app.post("/api/crowd/predict")
def calculate_crowd_predictions(request: CrowdPredictionRequest):
    return {
        "success": True,
        "method": "linear-trend",
        "horizonMinutes": request.horizon_minutes,
        "predictions": [
            predict_bus_crowd(
                bus_id=bus.bus_id,
                samples=bus.samples,
                horizon_minutes=request.horizon_minutes,
                as_of=request.as_of,
                max_sample_age_minutes=request.max_sample_age_minutes,
            )
            for bus in request.buses
        ],
    }


@app.post("/api/demand/analyze")
def calculate_demand(request: DemandRequest):
    return analyze_route_demand(
        route_id=request.route_id,
        passenger_demand=request.passenger_demand,
        available_capacity=request.available_capacity
    )


@app.post("/api/buses/alternatives")
def get_alternative_buses(request: AlternativeBusRequest):
    return recommend_alternative_buses(
        request.target_destination,
        request.buses,
        boarding_stop=request.boarding_stop,
        exclude_bus_id=request.exclude_bus_id,
    )


@app.post("/api/stops/demand")
def calculate_stop_demand(request: StopDemandRequest):
    return analyze_stop_demand(
        stop_id=request.stop_id,
        stop_name=request.stop_name,
        passenger_demand=request.passenger_demand,
        available_capacity=request.available_capacity
    )
