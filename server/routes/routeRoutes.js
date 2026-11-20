
const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

// GET all routes
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("routes")
      .select("*")
      .order("route_name", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.status(200).json({
      success: true,
      count: data.length,
      routes: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve routes",
    });
  }
});

// GET route by ID
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("routes")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.status(200).json({
      success: true,
      route: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve route",
    });
  }
});

module.exports = router;
