
const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

// GET current crowd analytics
router.get("/crowd", async (req, res) => {
  try {
    const { data: buses, error } = await supabase
      .from("buses")
      .select("id,bus_number,route_name,crowd_level,current_passengers,total_capacity,occupancy_percent");

    if (error) {
      throw error;
    }

    const totalBuses = buses.length;

    const crowdSummary = {
      low: 0,
      medium: 0,
      high: 0,
      unknown: 0
    };

    const busCrowdDetails = buses.map((bus) => {
      const level = (bus.crowd_level || "").toLowerCase();

      if (level === "low") {
        crowdSummary.low++;
      } else if (level === "medium") {
        crowdSummary.medium++;
      } else if (level === "high") {
        crowdSummary.high++;
      } else {
        crowdSummary.unknown++;
      }

      return {
        busId: bus.id,
        busNumber: bus.bus_number,
        routeName: bus.route_name,
        passengerCount: bus.current_passengers,
        capacity: bus.total_capacity,
        occupancy:
          bus.occupancy_percent ??
          (Number(bus.total_capacity) > 0
            ? (Number(bus.current_passengers) / Number(bus.total_capacity)) * 100
            : null),
        crowdLevel: bus.crowd_level
      };
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalBuses,
        crowdSummary,
        busCrowdDetails
      }
    });

  } catch (error) {
    console.error("Crowd analytics error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve crowd analytics"
    });
  }
});

module.exports = router;
