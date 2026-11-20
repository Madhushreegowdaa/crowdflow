
const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

// Current route occupancy derived from the latest values stored for each bus.
router.get("/route-demand", async (req, res) => {
  try {
    const { data: buses, error } = await supabase
      .from("buses")
      .select("route_name,current_passengers,total_capacity");

    if (error) throw error;

    const groups = new Map();
    for (const bus of buses ?? []) {
      const routeName = typeof bus.route_name === "string" ? bus.route_name.trim() : "";
      if (!routeName) continue;
      const group = groups.get(routeName) ?? [];
      group.push(bus);
      groups.set(routeName, group);
    }

    const routes = [];
    const skippedRoutes = [];
    for (const [routeName, routeBuses] of groups) {
      const validRecords = routeBuses.filter((bus) => {
        const passengers = Number(bus.current_passengers);
        const capacity = Number(bus.total_capacity);
        return Number.isFinite(passengers) && passengers >= 0 && Number.isFinite(capacity) && capacity > 0;
      });

      if (!validRecords.length) {
        skippedRoutes.push(routeName);
        continue;
      }

      const currentPassengers = validRecords.reduce(
        (total, bus) => total + Number(bus.current_passengers),
        0
      );
      const totalCapacity = validRecords.reduce(
        (total, bus) => total + Number(bus.total_capacity),
        0
      );

      routes.push({
        route_name: routeName,
        current_bus_count: validRecords.length,
        current_passengers: currentPassengers,
        total_capacity: totalCapacity,
        occupancy_percent: Number(((currentPassengers / totalCapacity) * 100).toFixed(1)),
      });
    }

    return res.status(200).json({
      success: true,
      as_of: new Date().toISOString(),
      count: routes.length,
      routes,
      skipped_routes: skippedRoutes,
    });
  } catch (error) {
    console.error("Dashboard route occupancy error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve current route occupancy.",
    });
  }
});

// GET admin dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    // Fetch bus data
    const { data: buses, error: busError } = await supabase
      .from("buses")
      .select("id, status, crowd_level");

    if (busError) {
      throw busError;
    }

    // Count routes
    const { count: routeCount, error: routeError } = await supabase
      .from("routes")
      .select("*", { count: "exact", head: true });

    if (routeError) {
      throw routeError;
    }

    // Count stops
    const { count: stopCount, error: stopError } = await supabase
      .from("stops")
      .select("*", { count: "exact", head: true });

    if (stopError) {
      throw stopError;
    }

    const totalBuses = buses.length;

    const delayedBuses = buses.filter(
      bus => bus.status?.toLowerCase() === "delayed"
    ).length;

    const highCrowdBuses = buses.filter(
      bus => bus.crowd_level?.toLowerCase() === "high"
    ).length;

    const statusBreakdown = {};
    const crowdBreakdown = {};

    buses.forEach(bus => {
      const status = bus.status || "Unknown";
      const crowd = bus.crowd_level || "Unknown";

      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      crowdBreakdown[crowd] = (crowdBreakdown[crowd] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      statistics: {
        totalBuses,
        delayedBuses,
        highCrowdBuses,
        totalRoutes: routeCount,
        totalStops: stopCount,
        statusBreakdown,
        crowdBreakdown
      }
    });

  } catch (error) {
    console.error("Dashboard statistics error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve dashboard statistics",
      error: error.message
    });
  }
});

module.exports = router;
