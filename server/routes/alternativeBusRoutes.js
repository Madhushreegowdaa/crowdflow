const express = require("express");
const { requestAlternativeBuses } = require("../services/bus-records");

function createAlternativeBusRouter(requestAlternatives = requestAlternativeBuses) {
  const router = express.Router();

  router.post("/alternatives", async (req, res) => {
    const targetDestination = req.body?.target_destination;
    const boardingStop = req.body?.boarding_stop;
    const excludeBusId = req.body?.exclude_bus_id;

    if (
      typeof targetDestination !== "string" ||
      !targetDestination.trim() ||
      typeof boardingStop !== "string" ||
      !boardingStop.trim() ||
      (excludeBusId !== undefined &&
        (typeof excludeBusId !== "string" || !excludeBusId.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: "A boarding stop and target destination are required.",
      });
    }

    if (targetDestination.trim().toLowerCase() === boardingStop.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Choose different boarding and destination stops.",
      });
    }

    try {
      const data = await requestAlternatives(targetDestination, {
        aiEngineUrl: process.env.AI_ENGINE_URL || "http://127.0.0.1:8000",
        boardingStop,
        excludeBusId,
      });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Alternative bus request failed:", error.message);
      if (
        error.code === "AI_ENGINE_UNAVAILABLE" ||
        error.code === "AI_ENGINE_BAD_RESPONSE"
      ) {
        return res.status(502).json({
          success: false,
          message: "Alternative bus recommendations are temporarily unavailable.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve alternative buses.",
      });
    }
  });

  return router;
}

module.exports = createAlternativeBusRouter();
module.exports.createAlternativeBusRouter = createAlternativeBusRouter;
