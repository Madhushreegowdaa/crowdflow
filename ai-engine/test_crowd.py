
from app.services.crowd_estimator import estimate_crowd

test_values = [20, 45, 75, 95]

for value in test_values:
    result = estimate_crowd(value)
    print(result)
