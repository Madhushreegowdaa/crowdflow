
const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

// GET all buses
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("buses")
      .select("*");

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.status(200).json({
      success: true,
      count: data.length,
      buses: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve buses",
    });
  }
});

// GET a particular bus by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("buses")
      .select("*")
      .eq("id", id)
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
        message: "Bus not found",
      });
    }

    res.status(200).json({
      success: true,
      bus: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve bus details",
    });
  }
});

module.exports = router;
