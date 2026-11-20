
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.services.crowd_estimator import estimate_crowd
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
    buses: list


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


@app.post("/api/demand/analyze")
def calculate_demand(request: DemandRequest):
    return analyze_route_demand(
        route_id=request.route_id,
        passenger_demand=request.passenger_demand,
        available_capacity=request.available_capacity
    )


@app.post("/api/buses/alternatives")
def get_alternative_buses(request: AlternativeBusRequest):
    return recommend_alternative_buses(request.target_destination, request.buses)


@app.post("/api/stops/demand")
def calculate_stop_demand(request: StopDemandRequest):
    return analyze_stop_demand(
        stop_id=request.stop_id,
        stop_name=request.stop_name,
        passenger_demand=request.passenger_demand,
        available_capacity=request.available_capacity
    )
