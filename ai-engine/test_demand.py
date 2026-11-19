
from app.services.demand_analyzer import analyze_route_demand

# Test 1: Demand is within available capacity
result1 = analyze_route_demand(
    route_id="R101",
    passenger_demand=40,
    available_capacity=60
)

# Test 2: Demand exceeds available capacity
result2 = analyze_route_demand(
    route_id="R102",
    passenger_demand=150,
    available_capacity=60
)

print("TEST 1 - Normal Demand")
print(result1)

print("\nTEST 2 - High Demand")
print(result2)
