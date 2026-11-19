
from app.services.alternative_recommender import recommend_alternative_buses

buses = [
    {
        "bus_id": "BUS101",
        "destination": "University",
        "crowd_level": "High",
        "eta_minutes": 10
    },
    {
        "bus_id": "BUS102",
        "destination": "University",
        "crowd_level": "Low",
        "eta_minutes": 15
    },
    {
        "bus_id": "BUS103",
        "destination": "University",
        "crowd_level": "Moderate",
        "eta_minutes": 8
    },
    {
        "bus_id": "BUS104",
        "destination": "Airport",
        "crowd_level": "Low",
        "eta_minutes": 5
    }
]

result = recommend_alternative_buses(target_destination="University", buses=buses)
print(result)
