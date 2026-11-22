const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/authMiddleware");
const {
  getOccupancyPercent,
  resolveCrowdLevel,
} = require("../services/crowd-classification");

const HISTORY_WINDOW_HOURS = 24;
const HISTORY_PAGE_SIZE = 1000;
const PREDICTION_HORIZON_MINUTES = 15;
const HISTORY_BUCKET_MS = 15 * 60 * 1000;

router.use(requireAdmin);

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundToOneDecimal(value) {
  return Number(value.toFixed(1));
}

function createAggregate() {
  return {
    sampleCount: 0,
    occupancyTotal: 0,
    maximumOccupancy: null,
  };
}

function addObservation(aggregate, occupancy) {
  aggregate.sampleCount += 1;
  aggregate.occupancyTotal += occupancy;
  aggregate.maximumOccupancy =
    aggregate.maximumOccupancy === null
      ? occupancy
      : Math.max(aggregate.maximumOccupancy, occupancy);
}

function averageOccupancy(aggregate) {
  return aggregate?.sampleCount
    ? roundToOneDecimal(aggregate.occupancyTotal / aggregate.sampleCount)
    : null;
}

async function fetchCrowdHistory(client, windowStart) {
  const history = [];
  for (let offset = 0; ; offset += HISTORY_PAGE_SIZE) {
    const { data, error } = await client
      .from("crowd_logs")
      .select("bus_id,crowd_level,occupancy_percent,passenger_count,recorded_at")
      .gte("recorded_at", windowStart.toISOString())
      .order("recorded_at", { ascending: false })
      .range(offset, offset + HISTORY_PAGE_SIZE - 1);

    if (error) throw error;
    const page = Array.isArray(data) ? data : [];
    history.push(...page);
    if (page.length < HISTORY_PAGE_SIZE) return history;
  }
}

router.get("/crowd", async (req, res) => {
  try {
    const client = req.supabase || supabase;
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - HISTORY_WINDOW_HOURS * 60 * 60 * 1000
    );

    const [busResult, history] = await Promise.all([
      client
        .from("buses")
        .select(
          "id,bus_number,route_name,crowd_level,current_passengers,total_capacity,occupancy_percent"
        ),
      fetchCrowdHistory(client, windowStart),
    ]);

    if (busResult.error) throw busResult.error;

    const buses = Array.isArray(busResult.data) ? busResult.data : [];
    history.reverse();
    const busesById = new Map(
      buses.map((bus) => [String(bus.id), bus])
    );
    const busHistory = new Map();
    const busAggregates = new Map();
    const routeAggregates = new Map();
    const timeBuckets = new Map();
    const currentRouteStats = new Map();
    const crowdSummary = {
      low: 0,
      moderate: 0,
      high: 0,
      veryHigh: 0,
      unknown: 0,
    };

    const busCrowdDetails = buses.map((bus) => {
      const crowdLevel = resolveCrowdLevel(bus);
      if (crowdLevel === "low") crowdSummary.low += 1;
      else if (crowdLevel === "moderate") {
        crowdSummary.moderate += 1;
      } else if (crowdLevel === "high") crowdSummary.high += 1;
      else if (crowdLevel === "very high") crowdSummary.veryHigh += 1;
      else crowdSummary.unknown += 1;

      const passengers = finiteNumber(bus.current_passengers);
      const capacity = finiteNumber(bus.total_capacity);
      const occupancy = getOccupancyPercent(bus);
      const routeName =
        typeof bus.route_name === "string" ? bus.route_name.trim() : "";

      if (routeName) {
        const route = currentRouteStats.get(routeName) ?? {
          busCount: 0,
          passengers: 0,
          capacity: 0,
          validCapacityCount: 0,
        };
        route.busCount += 1;
        if (
          passengers !== null &&
          passengers >= 0 &&
          capacity !== null &&
          capacity > 0
        ) {
          route.passengers += passengers;
          route.capacity += capacity;
          route.validCapacityCount += 1;
        }
        currentRouteStats.set(routeName, route);
      }

      busHistory.set(String(bus.id), []);
      return {
        busId: bus.id,
        busNumber: bus.bus_number,
        routeName: bus.route_name,
        passengerCount: passengers,
        capacity,
        occupancy: occupancy === null ? null : roundToOneDecimal(occupancy),
        crowdLevel,
      };
    });

    for (const log of history) {
      const busId = String(log.bus_id ?? "");
      const bus = busesById.get(busId);
      const occupancy = finiteNumber(log.occupancy_percent);
      const recordedAt = new Date(log.recorded_at);
      if (
        !bus ||
        occupancy === null ||
        occupancy < 0 ||
        occupancy > 100 ||
        !Number.isFinite(recordedAt.getTime())
      ) {
        continue;
      }

      const sample = {
        recorded_at: recordedAt.toISOString(),
        occupancy_percent: occupancy,
      };
      busHistory.get(busId).push(sample);

      const busAggregate = busAggregates.get(busId) ?? createAggregate();
      addObservation(busAggregate, occupancy);
      busAggregates.set(busId, busAggregate);

      const routeName =
        typeof bus.route_name === "string" ? bus.route_name.trim() : "";
      if (routeName) {
        const routeAggregate =
          routeAggregates.get(routeName) ?? createAggregate();
        addObservation(routeAggregate, occupancy);
        routeAggregates.set(routeName, routeAggregate);

        const bucketStart = new Date(
          Math.floor(recordedAt.getTime() / HISTORY_BUCKET_MS) *
            HISTORY_BUCKET_MS
        ).toISOString();
        const bucketKey = `${routeName}\0${bucketStart}`;
        const bucket = timeBuckets.get(bucketKey) ?? {
          routeName,
          bucketStart,
          ...createAggregate(),
        };
        addObservation(bucket, occupancy);
        timeBuckets.set(bucketKey, bucket);
      }
    }

    const historicalSamples = [...busHistory.values()].some(
      (samples) => samples.length > 0
    );
    let predictionsByBus = new Map();
    let predictionStatus = "insufficient_history";
    let predictionMessage =
      "Historical crowd logs are required before predictions are available.";

    if (historicalSamples) {
      try {
        const aiUrl = new URL(
          "/api/crowd/predict",
          process.env.AI_ENGINE_URL || "http://127.0.0.1:8000"
        );
        const response = await fetch(aiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            as_of: now.toISOString(),
            horizon_minutes: PREDICTION_HORIZON_MINUTES,
            max_sample_age_minutes: 30,
            buses: [...busHistory].map(([busId, samples]) => ({
              bus_id: busId,
              samples,
            })),
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          throw new Error(`AI engine returned HTTP ${response.status}.`);
        }

        const result = await response.json();
        if (!Array.isArray(result?.predictions)) {
          throw new TypeError("AI engine returned an invalid prediction payload.");
        }

        predictionsByBus = new Map(
          result.predictions.map((prediction) => [
            String(prediction.busId),
            prediction,
          ])
        );
        predictionStatus = result.predictions.some(
          (prediction) => prediction.predictionAvailable
        )
          ? "available"
          : "insufficient_history";
        predictionMessage =
          predictionStatus === "available"
            ? "Trend estimates use recorded crowd_logs only."
            : "More recorded crowd samples are needed for trend estimates.";
      } catch (error) {
        console.error(
          "Crowd prediction service unavailable:",
          error instanceof Error ? error.message : error
        );
        predictionStatus = "unavailable";
        predictionMessage =
          "Historical statistics are available, but the prediction service could not be reached.";
      }
    }

    const busDetailsWithHistory = busCrowdDetails.map((bus) => {
      const samples = busHistory.get(String(bus.busId)) ?? [];
      const aggregate = busAggregates.get(String(bus.busId));
      const prediction = predictionsByBus.get(String(bus.busId));
      return {
        ...bus,
        historySampleCount: aggregate?.sampleCount ?? 0,
        historicalAverageOccupancy: averageOccupancy(aggregate),
        lastRecordedAt: samples.length
          ? samples[samples.length - 1].recorded_at
          : null,
        prediction: prediction ?? {
          busId: String(bus.busId),
          predictionAvailable: false,
          reason:
            predictionStatus === "unavailable"
              ? "prediction_service_unavailable"
              : "insufficient_history",
          method: "linear-trend",
          dataSource: "public.crowd_logs",
        },
      };
    });

    const routeNames = new Set([
      ...currentRouteStats.keys(),
      ...routeAggregates.keys(),
    ]);
    const routeCrowdStats = [...routeNames].map((routeName) => {
      const current = currentRouteStats.get(routeName);
      const historical = routeAggregates.get(routeName);
      return {
        routeName,
        busCount: current?.busCount ?? 0,
        currentPassengers: current?.passengers ?? 0,
        totalCapacity: current?.capacity ?? 0,
        currentOccupancyPercent:
          current?.validCapacityCount > 0
            ? roundToOneDecimal(
                (current.passengers / current.capacity) * 100
              )
            : null,
        historySampleCount: historical?.sampleCount ?? 0,
        historicalAverageOccupancy: averageOccupancy(historical),
        historicalPeakOccupancy: historical?.maximumOccupancy ?? null,
      };
    });

    const historicalCrowd = [...timeBuckets.values()]
      .sort((left, right) => left.bucketStart.localeCompare(right.bucketStart))
      .map((bucket) => ({
        routeName: bucket.routeName,
        bucketStart: bucket.bucketStart,
        sampleCount: bucket.sampleCount,
        averageOccupancy: averageOccupancy(bucket),
      }));

    return res.status(200).json({
      success: true,
      asOf: now.toISOString(),
      dataSource: "public.buses and public.crowd_logs",
      historyWindowHours: HISTORY_WINDOW_HOURS,
      predictionMeta: {
        status: predictionStatus,
        method: "linear-trend",
        horizonMinutes: PREDICTION_HORIZON_MINUTES,
        message: predictionMessage,
      },
      analytics: {
        totalBuses: busDetailsWithHistory.length,
        crowdSummary,
        busCrowdDetails: busDetailsWithHistory,
        routeCrowdStats,
        historicalCrowd,
      },
      historySampleCount: historicalCrowd.reduce(
        (total, bucket) => total + bucket.sampleCount,
        0
      ),
    });
  } catch (error) {
    console.error(
      "Crowd analytics error:",
      error instanceof Error ? error.message : error
    );
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve crowd analytics.",
    });
  }
});

module.exports = router;
