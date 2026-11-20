
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const busRoutes = require("./routes/busRoutes");
const stopRoutes = require("./routes/stopRoutes");
const routeRoutes = require("./routes/routeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const alertRoutes = require("./routes/alertRoutes");
const deploymentRoutes = require("./routes/deploymentRoutes");
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CrowdFlow Admin Backend is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "CrowdFlow Backend",
  });
});

// Fleet management API
app.use("/api/buses", busRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/deployments", deploymentRoutes);

app.listen(PORT, () => {
  console.log(`CrowdFlow backend running at http://localhost:${PORT}`);
});
