const express = require("express");
const router = express.Router();
const defaultSupabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/authMiddleware");

// All deployment recommendation operations are administrator fleet functions
router.use(requireAdmin);

const DEFAULT_OCCUPANCY_THRESHOLD = 85;
const configuredThreshold = Number(process.env.DEPLOYMENT_OCCUPANCY_THRESHOLD);
const serverThreshold =
  Number.isFinite(configuredThreshold) && configuredThreshold >= 1 && configuredThreshold <= 100
    ? configuredThreshold
    : DEFAULT_OCCUPANCY_THRESHOLD;

function errorResponse(res, error, fallbackMessage) {
  console.error(fallbackMessage, error.message);
  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
}

async function findPendingRecommendation(routeName, client = defaultSupabase) {
  const { data, error } = await client
    .from("deployment_recommendations")
    .select("id")
    .eq("route_name", routeName)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data[0] ?? null;
}

async function savePendingRecommendation(recommendation, client = defaultSupabase) {
  const existing = await findPendingRecommendation(recommendation.route_name, client);

  if (existing) {
    const { data, error } = await client
      .from("deployment_recommendations")
      .update({
        current_bus_count: recommendation.current_bus_count,
        recommended_bus_count: recommendation.recommended_bus_count,
        reason: recommendation.reason,
        priority: recommendation.priority,
        source: recommendation.source,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return { recommendation: data, action: "updated" };
  }

  const { data, error } = await client
    .from("deployment_recommendations")
    .insert([recommendation])
    .select()
    .single();

  if (!error) return { recommendation: data, action: "created" };

  // A database unique index can close the race between concurrent generators.
  if (error.code !== "23505") throw error;

  const racedExisting = await findPendingRecommendation(recommendation.route_name, client);
  if (!racedExisting) throw error;

  const { data: updated, error: updateError } = await client
    .from("deployment_recommendations")
    .update({
      current_bus_count: recommendation.current_bus_count,
      recommended_bus_count: recommendation.recommended_bus_count,
      reason: recommendation.reason,
      priority: recommendation.priority,
      source: recommendation.source,
      updated_at: new Date().toISOString(),
    })
    .eq("id", racedExisting.id)
    .select()
    .single();

  if (updateError) throw updateError;
  return { recommendation: updated, action: "updated" };
}

async function resolvePendingRecommendation(routeName, resolution, client = defaultSupabase) {
  const existing = await findPendingRecommendation(routeName, client);
  if (!existing) return null;

  const { data, error } = await client
    .from("deployment_recommendations")
    .update({
      status: "resolved",
      current_bus_count: resolution.current_bus_count,
      reason: resolution.reason,
      source: "database",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// GET saved recommendations, newest first.
router.get("/", async (req, res) => {
  try {
    const client = req.supabase || defaultSupabase;
    const { data, error } = await client
      .from("deployment_recommendations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({
      success: true,
      count: data.length,
      recommendations: data,
    });
  } catch (error) {
    return errorResponse(res, error, "Unable to retrieve deployment recommendations.");
  }
});

// Generate rule-based recommendations from stored bus passenger and capacity fields.
router.post("/generate", async (req, res) => {
  try {
    const client = req.supabase || defaultSupabase;
    const requestedThreshold = Number(req.body?.occupancyThreshold);
    const threshold =
      Number.isFinite(requestedThreshold) && requestedThreshold >= 1 && requestedThreshold <= 100
        ? requestedThreshold
        : serverThreshold;

    const { data: buses, error: busError } = await client
      .from("buses")
      .select("route_name,current_passengers,total_capacity");

    if (busError) throw busError;

    const routeGroups = new Map();
    for (const bus of buses ?? []) {
      const routeName = typeof bus.route_name === "string" ? bus.route_name.trim() : "";
      if (!routeName) continue;
      const group = routeGroups.get(routeName) ?? [];
      group.push(bus);
      routeGroups.set(routeName, group);
    }

    const recommendations = [];
    const skippedRoutes = [];
    const counts = { created: 0, updated: 0, resolved: 0 };

    for (const [routeName, routeBuses] of routeGroups) {
      const completeData = routeBuses.every((bus) => {
        const passengers = Number(bus.current_passengers);
        const capacity = Number(bus.total_capacity);
        return (
          bus.current_passengers !== null &&
          bus.current_passengers !== undefined &&
          bus.current_passengers !== "" &&
          bus.total_capacity !== null &&
          bus.total_capacity !== undefined &&
          bus.total_capacity !== "" &&
          Number.isFinite(passengers) &&
          passengers >= 0 &&
          Number.isFinite(capacity) &&
          capacity > 0
        );
      });

      if (!completeData) {
        skippedRoutes.push({
          route_name: routeName,
          reason: "Passenger or capacity data is missing or invalid for one or more buses.",
        });
        continue;
      }

      const totalPassengers = routeBuses.reduce(
        (sum, bus) => sum + Number(bus.current_passengers),
        0
      );
      const totalCapacity = routeBuses.reduce(
        (sum, bus) => sum + Number(bus.total_capacity),
        0
      );
      const currentBusCount = routeBuses.length;
      const averageOccupancy = (totalPassengers / totalCapacity) * 100;

      if (averageOccupancy < threshold) {
        const resolved = await resolvePendingRecommendation(
          routeName,
          {
            current_bus_count: currentBusCount,
            reason: `Current occupancy is ${averageOccupancy.toFixed(1)}% (${totalPassengers} passengers across ${totalCapacity} capacity), below the ${threshold}% threshold. This recommendation is no longer required.`,
          },
          client
        );
        if (resolved) counts.resolved += 1;
        continue;
      }

      const averageBusCapacity = totalCapacity / currentBusCount;
      const recommendedBusCount = Math.max(
        currentBusCount + 1,
        Math.ceil(totalPassengers / (averageBusCapacity * (threshold / 100)))
      );
      const priority = averageOccupancy >= Math.min(threshold + 10, 100) ? "high" : "medium";

      const saved = await savePendingRecommendation(
        {
          route_id: null,
          route_name: routeName,
          current_bus_count: currentBusCount,
          recommended_bus_count: recommendedBusCount,
          reason: `Passenger counts total ${totalPassengers} across ${totalCapacity} capacity, for ${averageOccupancy.toFixed(1)}% average occupancy. The configured deployment threshold is ${threshold}%.`,
          priority,
          status: "pending",
          source: "database",
        },
        client
      );

      counts[saved.action] += 1;
      recommendations.push(saved.recommendation);
    }

    const generatedMessage = recommendations.length
      ? `Generated ${recommendations.length} recommendation${recommendations.length === 1 ? "" : "s"} using a ${threshold}% occupancy threshold.`
      : skippedRoutes.length
        ? "No recommendations were generated because route passenger or capacity data is incomplete."
        : "No routes currently meet the configured occupancy threshold.";
    const message = counts.resolved
      ? `${generatedMessage} Resolved ${counts.resolved} recommendation${counts.resolved === 1 ? "" : "s"} that no longer meet the threshold.`
      : generatedMessage;

    return res.status(200).json({
      success: true,
      threshold,
      count: recommendations.length,
      created: counts.created,
      updated: counts.updated,
      resolved: counts.resolved,
      recommendations,
      skippedRoutes,
      message,
    });
  } catch (error) {
    return errorResponse(res, error, "Unable to generate deployment recommendations.");
  }
});

async function changeRecommendationStatus(req, res, status) {
  try {
    const client = req.supabase || defaultSupabase;
    const { data, error } = await client
      .from("deployment_recommendations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Pending recommendation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Recommendation ${status} successfully.`,
      recommendation: data,
    });
  } catch (error) {
    return errorResponse(res, error, `Unable to ${status} recommendation.`);
  }
}

router.patch("/:id/approve", (req, res) => changeRecommendationStatus(req, res, "approved"));
router.patch("/:id/reject", (req, res) => changeRecommendationStatus(req, res, "rejected"));

router.get("/:id", async (req, res) => {
  try {
    const client = req.supabase || defaultSupabase;
    const { data, error } = await client
      .from("deployment_recommendations")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: "Recommendation not found." });
    }

    return res.status(200).json({ success: true, recommendation: data });
  } catch (error) {
    return errorResponse(res, error, "Unable to retrieve the deployment recommendation.");
  }
});

module.exports = router;
