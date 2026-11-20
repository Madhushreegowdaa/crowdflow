
const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

// GET all stops
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("stops")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.status(200).json({
      success: true,
      count: data.length,
      stops: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve stops",
    });
  }
});

// GET a stop by ID
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("stops")
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
        message: "Stop not found",
      });
    }

    res.status(200).json({
      success: true,
      stop: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve stop",
    });
  }
});

module.exports = router;
