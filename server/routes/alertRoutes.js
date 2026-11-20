
const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// GET all alerts
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      alerts: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET one alert
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      alert: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CREATE a new alert
router.post("/", async (req, res) => {
  try {
    const { bus_id, alert_type, message, severity } = req.body;

    if (!alert_type || !message) {
      return res.status(400).json({
        success: false,
        message: "Alert type and message are required.",
      });
    }

    const allowedSeverities = ["low", "medium", "high", "critical"];

    const normalizedSeverity = (severity || "medium").toLowerCase();

    if (!allowedSeverities.includes(normalizedSeverity)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert severity.",
      });
    }

    const { data, error } = await supabase
      .from("alerts")
      .insert([
        {
          bus_id: bus_id || null,
          alert_type,
          message,
          severity: normalizedSeverity,
          status: "active",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Alert created successfully.",
      alert: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// RESOLVE an alert
router.patch("/:id/resolve", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .eq("status", "active")
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Active alert not found.",
      });
    }

    res.json({
      success: true,
      message: "Alert resolved successfully.",
      alert: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
