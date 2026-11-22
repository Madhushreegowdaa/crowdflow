/**
 * HTTP Integration Tests – Express Route Authorization Boundaries
 *
 * Tests actual route handlers (not middleware in isolation) using a real
 * Express application and HTTP requests, with mocked Supabase authentication.
 *
 * Run: node --test server/test-routes-integration.test.js
 */

const path = require("node:path");
const http = require("node:http");

// Inject env stubs before any module that reads process.env at load time
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test-anon-key";
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const assert = require("node:assert/strict");
const { test, describe, before, after } = require("node:test");

// ─── Mock Supabase module before any routes load it ───────────────────────────

// Tokens we'll use in tests
const ADMIN_TOKEN = "test-admin-jwt";
const PASSENGER_TOKEN = "test-passenger-jwt";
const INVALID_TOKEN = "not-a-valid-jwt";

// Shared mock state so individual tests can override DB behaviour per route
let mockDbResponse = { data: [], error: null };
let mockCrowdLogResponse = { data: [], error: null };
let mockSingleResponse = { data: null, error: null };
let mockPendingRecommendations = {};
let mockDeploymentWrites = [];
let generatedRecommendationId = 0;

function makeMockQueryBuilder(table, overrides = {}) {
  let operation = null;
  let writeValues;
  const filters = {};
  const rangeFilters = {};
  let ordering = null;
  let rowLimit = null;
  let rowRange = null;
  const builder = {
    select: () => {
      if (!operation) operation = "select";
      return builder;
    },
    insert: (values) => {
      operation = "insert";
      writeValues = values;
      return builder;
    },
    update: (values) => {
      operation = "update";
      writeValues = values;
      return builder;
    },
    eq: (field, value) => {
      filters[field] = value;
      return builder;
    },
    gte: (field, value) => {
      rangeFilters[field] = value;
      return builder;
    },
    order: (field, options) => {
      ordering = { field, ascending: options?.ascending !== false };
      return builder;
    },
    limit: (limit) => {
      rowLimit = limit;
      return builder;
    },
    range: (from, to) => {
      rowRange = { from, to };
      return builder;
    },
    maybeSingle: async () => {
      if (table !== "deployment_recommendations" || operation !== "update") return mockSingleResponse;

      const [routeName, existing] = Object.entries(mockPendingRecommendations).find(
        ([, recommendation]) => recommendation.id === filters.id,
      ) || [];
      if (!existing) return mockSingleResponse;

      const recommendation = { ...existing, ...writeValues };
      mockDeploymentWrites.push({ operation, recommendation });
      if (recommendation.status !== "pending") delete mockPendingRecommendations[routeName];
      else mockPendingRecommendations[routeName] = recommendation;
      return { data: recommendation, error: null };
    },
    single: async () => {
      if (table !== "deployment_recommendations") return mockSingleResponse;

      if (operation === "insert") {
        const recommendation = {
          id: `test-recommendation-${++generatedRecommendationId}`,
          ...writeValues[0],
        };
        mockDeploymentWrites.push({ operation, recommendation });
        return { data: recommendation, error: null };
      }

      if (operation === "update") {
        const existing = Object.values(mockPendingRecommendations).find(
          (recommendation) => recommendation.id === filters.id,
        );
        const recommendation = { ...existing, ...writeValues };
        mockDeploymentWrites.push({ operation, recommendation });
        return { data: recommendation, error: null };
      }

      return mockSingleResponse;
    },
    // Resolve as the final step when no terminal is called
    then: (resolve) => {
      if (table === "deployment_recommendations" && operation === "select" && filters.route_name) {
        const existing = mockPendingRecommendations[filters.route_name];
        return resolve({ data: existing ? [existing] : [], error: null });
      }
      if (table !== "crowd_logs") return resolve(mockDbResponse);

      const response = mockCrowdLogResponse;
      let rows = Array.isArray(response.data) ? [...response.data] : [];
      for (const [field, value] of Object.entries(rangeFilters)) {
        const minimum = new Date(value).getTime();
        rows = rows.filter((row) => new Date(row[field]).getTime() >= minimum);
      }
      if (ordering) {
        const direction = ordering.ascending ? 1 : -1;
        rows.sort(
          (left, right) =>
            direction *
            (new Date(left[ordering.field]).getTime() -
              new Date(right[ordering.field]).getTime()),
        );
      }
      if (rowLimit !== null) rows = rows.slice(0, rowLimit);
      if (rowRange !== null) rows = rows.slice(rowRange.from, rowRange.to + 1);
      return resolve({ ...response, data: rows });
    },
  };
  return Object.assign(builder, overrides);
}

// Replace the real @supabase/supabase-js createClient with a mock factory
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@supabase/supabase-js") {
    return {
      createClient: (url, key, opts) => {
        // If the caller attaches a bearer token, we know the user identity
        const authHeader = opts?.global?.headers?.Authorization ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

        const getUser = async (passedToken) => {
          const resolved = passedToken || token;
          if (resolved === ADMIN_TOKEN) {
            return {
              data: {
                user: {
                  id: "admin-id",
                  email: "admin@crowdflow.org",
                  app_metadata: { role: "admin" },
                  user_metadata: {},
                },
              },
              error: null,
            };
          }
          if (resolved === PASSENGER_TOKEN) {
            return {
              data: {
                user: {
                  id: "passenger-id",
                  email: "passenger@example.com",
                  app_metadata: {},
                  user_metadata: {},
                },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: { message: "Invalid token" } };
        };

        return {
          auth: { getUser },
          from: (table) => makeMockQueryBuilder(table),
        };
      },
    };
  }
  return originalLoad.apply(this, arguments);
};

// ─── Build the Express app under test ─────────────────────────────────────────

const express = require("express");
const cors = require("cors");

const busRoutes = require("./routes/busRoutes");
const stopRoutes = require("./routes/stopRoutes");
const routeRoutes = require("./routes/routeRoutes");
const alertRoutes = require("./routes/alertRoutes");
const deploymentRoutes = require("./routes/deploymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const alternativeBusRoutes = require("./routes/alternativeBusRoutes");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/buses", busRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics/buses", alternativeBusRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─── HTTP helper ──────────────────────────────────────────────────────────────

let server;
let baseUrl;

before(
  () =>
    new Promise((resolve, reject) => {
      server = http.createServer(app);
      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
      server.on("error", reject);
    }),
);

after(() => new Promise((resolve) => server.close(resolve)));

function request(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { "Content-Type": "application/json", ...headers },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("HTTP Route Integration – Authorization Boundaries", () => {

  // ── Public endpoints ──────────────────────────────────────────────────────

  describe("Public commuter endpoints (no auth required)", () => {
    test("GET /api/buses → 200 without token", async () => {
      const { status } = await request("GET", "/api/buses");
      assert.equal(status, 200);
    });

    test("GET /api/stops → 200 without token", async () => {
      const { status } = await request("GET", "/api/stops");
      assert.equal(status, 200);
    });

    test("GET /api/routes → 200 without token", async () => {
      const { status } = await request("GET", "/api/routes");
      assert.equal(status, 200);
    });

    test("GET /api/alerts → 200 without token (commuter read access preserved)", async () => {
      const { status, body } = await request("GET", "/api/alerts");
      assert.equal(status, 200);
      assert.equal(body.success, true);
    });
  });

  // ── Alert mutations ───────────────────────────────────────────────────────

  describe("POST /api/alerts – alert creation (admin-only)", () => {
    const payload = { alert_type: "Delay", message: "Bus delayed by 10 minutes", severity: "medium" };

    test("No token → 401", async () => {
      const { status, body } = await request("POST", "/api/alerts", {}, payload);
      assert.equal(status, 401);
      assert.equal(body.success, false);
      assert.match(body.message, /Authorization header is missing/i);
    });

    test("Invalid token → 401", async () => {
      const { status, body } = await request("POST", "/api/alerts", { Authorization: `Bearer ${INVALID_TOKEN}` }, payload);
      assert.equal(status, 401);
      assert.equal(body.success, false);
      assert.match(body.message, /Invalid or expired/i);
    });

    test("Passenger token → 403", async () => {
      const { status, body } = await request("POST", "/api/alerts", { Authorization: `Bearer ${PASSENGER_TOKEN}` }, payload);
      assert.equal(status, 403);
      assert.equal(body.success, false);
      assert.match(body.message, /Administrator role required/i);
    });

    test("Admin token + valid body → passes auth (500 from mock DB is expected)", async () => {
      // Mock DB returns a null record → triggers a 500 from route logic, but confirms auth passed
      const { status, body } = await request("POST", "/api/alerts", { Authorization: `Bearer ${ADMIN_TOKEN}` }, payload);
      // 201 (success) or 500 (mock DB) both mean auth was accepted; 401/403 mean it was rejected
      assert.ok(
        status !== 401 && status !== 403,
        `Expected auth to pass; got ${status}: ${JSON.stringify(body)}`
      );
    });
  });

  describe("PATCH /api/alerts/:id/resolve – alert resolution (admin-only)", () => {
    test("No token → 401", async () => {
      const { status, body } = await request("PATCH", "/api/alerts/abc-123/resolve");
      assert.equal(status, 401);
      assert.equal(body.success, false);
    });

    test("Passenger token → 403", async () => {
      const { status, body } = await request("PATCH", "/api/alerts/abc-123/resolve", { Authorization: `Bearer ${PASSENGER_TOKEN}` });
      assert.equal(status, 403);
      assert.equal(body.success, false);
    });

    test("Admin token → passes auth", async () => {
      const { status, body } = await request("PATCH", "/api/alerts/abc-123/resolve", { Authorization: `Bearer ${ADMIN_TOKEN}` });
      assert.ok(status !== 401 && status !== 403, `Auth should pass; got ${status}: ${JSON.stringify(body)}`);
    });
  });

  // ── Deployment mutations ──────────────────────────────────────────────────

  describe("POST /api/deployments/generate – recommendation generation (admin-only)", () => {
    test("No token → 401", async () => {
      const { status, body } = await request("POST", "/api/deployments/generate");
      assert.equal(status, 401);
      assert.equal(body.success, false);
    });

    test("Invalid token → 401", async () => {
      const { status, body } = await request("POST", "/api/deployments/generate", { Authorization: `Bearer ${INVALID_TOKEN}` });
      assert.equal(status, 401);
      assert.equal(body.success, false);
    });

    test("Passenger token → 403", async () => {
      const { status, body } = await request("POST", "/api/deployments/generate", { Authorization: `Bearer ${PASSENGER_TOKEN}` });
      assert.equal(status, 403);
      assert.equal(body.success, false);
    });

    test("Admin token → passes auth", async () => {
      const { status, body } = await request("POST", "/api/deployments/generate", { Authorization: `Bearer ${ADMIN_TOKEN}` }, {});
      assert.ok(status !== 401 && status !== 403, `Auth should pass; got ${status}: ${JSON.stringify(body)}`);
    });
  });

  describe("GET /api/deployments – list recommendations (admin-only)", () => {
    test("No token → 401", async () => {
      const { status } = await request("GET", "/api/deployments");
      assert.equal(status, 401);
    });

    test("Passenger token → 403", async () => {
      const { status } = await request("GET", "/api/deployments", { Authorization: `Bearer ${PASSENGER_TOKEN}` });
      assert.equal(status, 403);
    });

    test("Admin token → passes auth", async () => {
      const { status } = await request("GET", "/api/deployments", { Authorization: `Bearer ${ADMIN_TOKEN}` });
      assert.ok(status !== 401 && status !== 403);
    });

    test("Admin receives saved database recommendation rows", async () => {
      const savedRecommendation = {
        id: "saved-rec-001",
        route_name: "Current Fleet Route",
        current_bus_count: 2,
        recommended_bus_count: 3,
        reason: "Calculated from current database values.",
        priority: "medium",
        status: "pending",
        source: "database",
      };
      mockDbResponse = { data: [savedRecommendation], error: null };

      try {
        const { status, body } = await request("GET", "/api/deployments", {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        });
        assert.equal(status, 200);
        assert.equal(body.count, 1);
        assert.deepEqual(body.recommendations, [savedRecommendation]);
      } finally {
        mockDbResponse = { data: [], error: null };
      }
    });

    test("Admin can retrieve one saved recommendation by ID", async () => {
      const recommendation = { id: "saved-rec-detail", route_name: "Detail Route", status: "pending" };
      mockSingleResponse = { data: recommendation, error: null };
      try {
        const { status, body } = await request("GET", "/api/deployments/saved-rec-detail", {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        });
        assert.equal(status, 200);
        assert.deepEqual(body.recommendation, recommendation);
      } finally {
        mockSingleResponse = { data: null, error: null };
      }
    });
  });

  describe("PATCH /api/deployments/:id/approve – approve recommendation (admin-only)", () => {
    test("No token → 401", async () => {
      const { status } = await request("PATCH", "/api/deployments/rec-001/approve");
      assert.equal(status, 401);
    });

    test("Passenger token → 403", async () => {
      const { status } = await request("PATCH", "/api/deployments/rec-001/approve", { Authorization: `Bearer ${PASSENGER_TOKEN}` });
      assert.equal(status, 403);
    });

    test("Admin token → passes auth (404 from mock is expected without real DB record)", async () => {
      const { status } = await request("PATCH", "/api/deployments/rec-001/approve", { Authorization: `Bearer ${ADMIN_TOKEN}` });
      assert.ok(status !== 401 && status !== 403);
    });

    test("Admin can approve a pending recommendation", async () => {
      const recommendation = { id: "rec-approve", status: "approved" };
      mockSingleResponse = { data: recommendation, error: null };
      try {
        const { status, body } = await request("PATCH", "/api/deployments/rec-approve/approve", {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        });
        assert.equal(status, 200);
        assert.equal(body.recommendation.status, "approved");
      } finally {
        mockSingleResponse = { data: null, error: null };
      }
    });
  });

  describe("PATCH /api/deployments/:id/reject – reject recommendation (admin-only)", () => {
    test("No token → 401", async () => {
      const { status } = await request("PATCH", "/api/deployments/rec-001/reject");
      assert.equal(status, 401);
    });

    test("Passenger token → 403", async () => {
      const { status } = await request("PATCH", "/api/deployments/rec-001/reject", { Authorization: `Bearer ${PASSENGER_TOKEN}` });
      assert.equal(status, 403);
    });

    test("Admin token → passes auth", async () => {
      const { status } = await request("PATCH", "/api/deployments/rec-001/reject", { Authorization: `Bearer ${ADMIN_TOKEN}` });
      assert.ok(status !== 401 && status !== 403);
    });

    test("Admin can reject a pending recommendation", async () => {
      const recommendation = { id: "rec-reject", status: "rejected" };
      mockSingleResponse = { data: recommendation, error: null };
      try {
        const { status, body } = await request("PATCH", "/api/deployments/rec-reject/reject", {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        });
        assert.equal(status, 200);
        assert.equal(body.recommendation.status, "rejected");
      } finally {
        mockSingleResponse = { data: null, error: null };
      }
    });
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────

  describe("GET /api/dashboard/stats – dashboard statistics (admin-only)", () => {
    test("No token → 401", async () => {
      const { status } = await request("GET", "/api/dashboard/stats");
      assert.equal(status, 401);
    });

    test("Passenger token → 403", async () => {
      const { status } = await request("GET", "/api/dashboard/stats", { Authorization: `Bearer ${PASSENGER_TOKEN}` });
      assert.equal(status, 403);
    });

    test("Admin token → passes auth", async () => {
      const { status } = await request("GET", "/api/dashboard/stats", { Authorization: `Bearer ${ADMIN_TOKEN}` });
      assert.ok(status !== 401 && status !== 403);
    });

    test("unavailable and Very High labels remain distinct from Low and High", async () => {
      mockDbResponse = {
        data: [
          { id: "low-bus", status: "On Time", crowd_level: "low" },
          { id: "high-bus", status: "On Time", crowd_level: "high" },
          { id: "very-high-bus", status: "On Time", crowd_level: "very high" },
          { id: "stale-level-bus", status: "On Time", crowd_level: "high", occupancy_percent: 88 },
          { id: "unavailable-bus", status: "On Time", crowd_level: "unavailable" },
          { id: "missing-bus", status: "On Time", crowd_level: null },
        ],
        error: null,
      };

      try {
        const { status, body } = await request(
          "GET",
          "/api/dashboard/stats",
          { Authorization: `Bearer ${ADMIN_TOKEN}` },
        );

        assert.equal(status, 200);
        assert.equal(body.statistics.highCrowdBuses, 1);
        assert.deepEqual(body.statistics.crowdBreakdown, {
          Low: 1,
          High: 1,
          "Very high": 2,
          Unavailable: 2,
        });
      } finally {
        mockDbResponse = { data: [], error: null };
      }
    });
  });

  describe("GET /api/dashboard/route-demand – route occupancy (admin-only)", () => {
    test("No token → 401", async () => {
      const { status } = await request("GET", "/api/dashboard/route-demand");
      assert.equal(status, 401);
    });

    test("Passenger token → 403", async () => {
      const { status } = await request("GET", "/api/dashboard/route-demand", { Authorization: `Bearer ${PASSENGER_TOKEN}` });
      assert.equal(status, 403);
    });

    test("Admin token → passes auth", async () => {
      const { status } = await request("GET", "/api/dashboard/route-demand", { Authorization: `Bearer ${ADMIN_TOKEN}` });
      assert.ok(status !== 401 && status !== 403);
    });

    test("aggregates valid route values and reports routes with no usable records", async () => {
      mockDbResponse = {
        data: [
          { route_name: "North Route", current_passengers: 24, total_capacity: 40 },
          { route_name: "North Route", current_passengers: 21, total_capacity: 60 },
          { route_name: "Invalid Route", current_passengers: -1, total_capacity: 20 },
          { route_name: "  ", current_passengers: 5, total_capacity: 10 },
        ],
        error: null,
      };

      try {
        const { status, body } = await request(
          "GET",
          "/api/dashboard/route-demand",
          { Authorization: `Bearer ${ADMIN_TOKEN}` },
        );

        assert.equal(status, 200);
        assert.equal(body.count, 1);
        assert.deepEqual(body.routes, [{
          route_name: "North Route",
          current_bus_count: 2,
          current_passengers: 45,
          total_capacity: 100,
          occupancy_percent: 45,
        }]);
        assert.deepEqual(body.skipped_routes, ["Invalid Route"]);
      } finally {
        mockDbResponse = { data: [], error: null };
      }
    });
  });

  describe("POST /api/deployments/generate – controlled recommendation results", () => {
    test("creates and updates threshold recommendations and skips invalid or below-threshold routes", async () => {
      mockDbResponse = {
        data: [
          { route_name: "Busy Route", current_passengers: 48, total_capacity: 50 },
          { route_name: "Busy Route", current_passengers: 45, total_capacity: 50 },
          { route_name: "At Threshold", current_passengers: 40, total_capacity: 50 },
          { route_name: "At Threshold", current_passengers: 40, total_capacity: 50 },
          { route_name: "Below Threshold", current_passengers: 30, total_capacity: 50 },
          { route_name: "Below Threshold", current_passengers: 30, total_capacity: 50 },
          { route_name: "Incomplete Route", current_passengers: null, total_capacity: 50 },
        ],
        error: null,
      };
      mockPendingRecommendations = {
        "Busy Route": { id: "pending-busy", route_name: "Busy Route", status: "pending" },
        "Below Threshold": { id: "pending-below", route_name: "Below Threshold", status: "pending", recommended_bus_count: 3 },
      };
      mockDeploymentWrites = [];
      generatedRecommendationId = 0;

      try {
        const { status, body } = await request(
          "POST",
          "/api/deployments/generate",
          { Authorization: `Bearer ${ADMIN_TOKEN}` },
          { occupancyThreshold: 80 },
        );

        assert.equal(status, 200);
        assert.equal(body.threshold, 80);
        assert.equal(body.count, 2);
        assert.equal(body.created, 1);
        assert.equal(body.updated, 1);
        assert.equal(body.resolved, 1);
        assert.equal(body.recommendations[0].source, "database");
        assert.deepEqual(
          body.recommendations.map(({ route_name, current_bus_count, recommended_bus_count, priority }) => ({
            route_name,
            current_bus_count,
            recommended_bus_count,
            priority,
          })),
          [
            { route_name: "Busy Route", current_bus_count: 2, recommended_bus_count: 3, priority: "high" },
            { route_name: "At Threshold", current_bus_count: 2, recommended_bus_count: 3, priority: "medium" },
          ],
        );
        assert.deepEqual(body.skippedRoutes.map(({ route_name }) => route_name), ["Incomplete Route"]);
        assert.deepEqual(
          mockDeploymentWrites.map(({ operation }) => operation),
          ["update", "insert", "update"],
        );
        assert.equal(mockDeploymentWrites[2].recommendation.status, "resolved");
        assert.match(mockDeploymentWrites[2].recommendation.reason, /below the 80% threshold/i);
        assert.equal(mockPendingRecommendations["Below Threshold"], undefined);
      } finally {
        mockDbResponse = { data: [], error: null };
        mockPendingRecommendations = {};
        mockDeploymentWrites = [];
      }
    });

    test("uses the default 85% threshold for below-threshold and high occupancy cases", async () => {
      mockDbResponse = {
        data: [
          { route_name: "Forty Percent", current_passengers: 20, total_capacity: 50 },
          { route_name: "Seventy Percent", current_passengers: 35, total_capacity: 50 },
          { route_name: "Ninety Percent", current_passengers: 45, total_capacity: 50 },
          { route_name: "Ninety Eight Percent", current_passengers: 49, total_capacity: 50 },
        ],
        error: null,
      };
      mockPendingRecommendations = {};
      mockDeploymentWrites = [];

      try {
        const { status, body } = await request(
          "POST",
          "/api/deployments/generate",
          { Authorization: `Bearer ${ADMIN_TOKEN}` },
        );

        assert.equal(status, 200);
        assert.equal(body.threshold, 85);
        assert.deepEqual(
          body.recommendations.map(({ route_name }) => route_name),
          ["Ninety Percent", "Ninety Eight Percent"],
        );
        assert.equal(mockDeploymentWrites.length, 2);
        assert.ok(mockDeploymentWrites.every(({ operation }) => operation === "insert"));
      } finally {
        mockDbResponse = { data: [], error: null };
        mockPendingRecommendations = {};
        mockDeploymentWrites = [];
      }
    });
  });

  // ── Analytics ─────────────────────────────────────────────────────────────

  describe("GET /api/analytics/crowd – crowd analytics (admin-only)", () => {
    test("No token → 401", async () => {
      const { status } = await request("GET", "/api/analytics/crowd");
      assert.equal(status, 401);
    });

    test("Passenger token → 403", async () => {
      const { status } = await request("GET", "/api/analytics/crowd", { Authorization: `Bearer ${PASSENGER_TOKEN}` });
      assert.equal(status, 403);
    });

    test("Admin token → passes auth", async () => {
      const { status } = await request("GET", "/api/analytics/crowd", { Authorization: `Bearer ${ADMIN_TOKEN}` });
      assert.ok(status !== 401 && status !== 403);
    });

    test("derives the displayed current crowd level from occupancy when the stored label is stale", async () => {
      mockDbResponse = {
        data: [{
          id: "bus-335e-1",
          bus_number: "335-E",
          route_name: "Majestic to Whitefield via HAL",
          crowd_level: "high",
          current_passengers: 44,
          total_capacity: 50,
          occupancy_percent: 88,
        }],
        error: null,
      };
      mockCrowdLogResponse = { data: [], error: null };

      try {
        const { status, body } = await request(
          "GET",
          "/api/analytics/crowd",
          { Authorization: `Bearer ${ADMIN_TOKEN}` },
        );

        assert.equal(status, 200);
        assert.equal(body.analytics.busCrowdDetails[0].busId, "bus-335e-1");
        assert.equal(body.analytics.busCrowdDetails[0].crowdLevel, "very high");
        assert.equal(body.analytics.crowdSummary.veryHigh, 1);
        assert.equal(body.analytics.crowdSummary.high, 0);
      } finally {
        mockDbResponse = { data: [], error: null };
        mockCrowdLogResponse = { data: [], error: null };
      }
    });

    test("uses recorded crowd logs for route history and forwards samples to FastAPI", async () => {
      const previousAiUrl = process.env.AI_ENGINE_URL;
      const recordedSamples = [
        { bus_id: "bus-1", occupancy_percent: 20, recorded_at: new Date(Date.now() - 45 * 60_000).toISOString() },
        { bus_id: "bus-1", occupancy_percent: 30, recorded_at: new Date(Date.now() - 30 * 60_000).toISOString() },
        { bus_id: "bus-1", occupancy_percent: 40, recorded_at: new Date(Date.now() - 15 * 60_000).toISOString() },
      ];
      let aiRequest;
      const aiServer = http.createServer((incoming, response) => {
        let body = "";
        incoming.on("data", (chunk) => (body += chunk));
        incoming.on("end", () => {
          aiRequest = {
            method: incoming.method,
            url: incoming.url,
            body: JSON.parse(body),
          };
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify({
            success: true,
            predictions: [{
              busId: "bus-1",
              predictionAvailable: true,
              sampleCount: 3,
              predictedOccupancyPercent: 50,
              predictedCrowdLevel: "Moderate",
              horizonMinutes: 15,
              method: "linear-trend",
              dataSource: "public.crowd_logs",
            }],
          }));
        });
      });

      await new Promise((resolve, reject) => {
        aiServer.listen(0, "127.0.0.1", resolve);
        aiServer.on("error", reject);
      });

      try {
        process.env.AI_ENGINE_URL = `http://127.0.0.1:${aiServer.address().port}`;
        mockDbResponse = {
          data: [{
            id: "bus-1",
            bus_number: "101",
            route_name: "North Route",
            crowd_level: "moderate",
            current_passengers: 20,
            total_capacity: 50,
            occupancy_percent: 40,
          }],
          error: null,
        };
        mockCrowdLogResponse = { data: recordedSamples, error: null };

        const { status, body } = await request(
          "GET",
          "/api/analytics/crowd",
          { Authorization: `Bearer ${ADMIN_TOKEN}` },
        );

        assert.equal(status, 200);
        assert.equal(aiRequest.method, "POST");
        assert.equal(aiRequest.url, "/api/crowd/predict");
        assert.equal(aiRequest.body.buses[0].bus_id, "bus-1");
        assert.equal(aiRequest.body.buses[0].samples.length, 3);
        assert.equal(body.analytics.routeCrowdStats[0].historicalAverageOccupancy, 30);
        assert.equal(body.analytics.routeCrowdStats[0].historySampleCount, 3);
        assert.equal(body.analytics.busCrowdDetails[0].prediction.predictedOccupancyPercent, 50);
      } finally {
        mockDbResponse = { data: [], error: null };
        mockCrowdLogResponse = { data: [], error: null };
        if (previousAiUrl === undefined) delete process.env.AI_ENGINE_URL;
        else process.env.AI_ENGINE_URL = previousAiUrl;
        await new Promise((resolve) => aiServer.close(resolve));
      }
    });

    test("paginates past newer fleet history and keeps all five samples per schema bus ID", async () => {
      const previousAiUrl = process.env.AI_ENGINE_URL;
      const now = Date.now();
      const busIds = [
        "bus-335e-1",
        "bus-500d-1",
        "bus-k3-alt",
        "bus-kia8-1",
      ];
      const buses = busIds.map((id) => ({
        id,
        bus_number: id,
        route_name: "Test Route",
        crowd_level: "moderate",
        current_passengers: 20,
        total_capacity: 50,
        occupancy_percent: 40,
      }));
      const fillerBusId = "bus-history-filler";
      buses.push({
        id: fillerBusId,
        bus_number: fillerBusId,
        route_name: "Historical Load",
        crowd_level: "moderate",
        current_passengers: 20,
        total_capacity: 50,
        occupancy_percent: 40,
      });

      const targetSamples = busIds.flatMap((bus_id) =>
        [25, 20, 15, 10, 5].map((minutesAgo, index) => ({
          bus_id,
          crowd_level: "moderate",
          occupancy_percent: 30 + index * 5,
          passenger_count: 15 + index,
          recorded_at: new Date(now - minutesAgo * 60_000).toISOString(),
        })),
      );
      const fillerStart = now - 4 * 60_000;
      const fillerEnd = now - 60_000;
      const fillerSamples = Array.from({ length: 3001 }, (_, index) => ({
        bus_id: fillerBusId,
        crowd_level: "moderate",
        occupancy_percent: 40,
        passenger_count: 20,
        recorded_at: new Date(
          fillerStart +
            (index * (fillerEnd - fillerStart)) / (3001 - 1),
        ).toISOString(),
      }));
      let aiRequest;
      const aiServer = http.createServer((incoming, response) => {
        let body = "";
        incoming.on("data", (chunk) => (body += chunk));
        incoming.on("end", () => {
          aiRequest = JSON.parse(body);
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify({
            success: true,
            predictions: aiRequest.buses.map(({ bus_id, samples }) => ({
              busId: bus_id,
              sampleCount: samples.length,
              predictionAvailable: samples.length >= 3,
              method: "linear-trend",
              dataSource: "public.crowd_logs",
            })),
          }));
        });
      });

      await new Promise((resolve, reject) => {
        aiServer.listen(0, "127.0.0.1", resolve);
        aiServer.on("error", reject);
      });

      try {
        process.env.AI_ENGINE_URL = `http://127.0.0.1:${aiServer.address().port}`;
        mockDbResponse = { data: buses, error: null };
        mockCrowdLogResponse = {
          data: [...fillerSamples, ...targetSamples],
          error: null,
        };

        const { status, body } = await request(
          "GET",
          "/api/analytics/crowd",
          { Authorization: `Bearer ${ADMIN_TOKEN}` },
        );

        assert.equal(status, 200);
        for (const id of busIds) {
          const forwarded = aiRequest.buses.find((bus) => bus.bus_id === id);
          assert.ok(forwarded, `expected exact schema ID ${id} in FastAPI payload`);
          assert.equal(forwarded.samples.length, 5);

          const detail = body.analytics.busCrowdDetails.find(
            (bus) => bus.busId === id,
          );
          assert.equal(detail.historySampleCount, 5);
          assert.equal(detail.prediction.sampleCount, 5);
          assert.equal(detail.prediction.predictionAvailable, true);
        }
      } finally {
        mockDbResponse = { data: [], error: null };
        mockCrowdLogResponse = { data: [], error: null };
        if (previousAiUrl === undefined) delete process.env.AI_ENGINE_URL;
        else process.env.AI_ENGINE_URL = previousAiUrl;
        await new Promise((resolve) => aiServer.close(resolve));
      }
    });
  });

});
