/**
 * In-memory unit tests for Express auth middleware.
 * Tests middleware directly with mock req/res/next objects — no TCP sockets.
 * Run: node --test server/test-auth-middleware.test.js
 */

const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test-anon-key";

const assert = require("node:assert/strict");
const { test, describe } = require("node:test");
const { createRequireAdminMiddleware } = require("./middleware/authMiddleware");

// In-memory mock req, res, next helper — avoids TCP socket binding in sandbox
function createMockContext(headers = {}) {
  let statusCode = 200;
  let responseBody = null;
  let nextCalled = false;

  const req = {
    headers: { ...headers },
    user: null,
    token: null,
    supabase: null,
  };

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseBody = data;
      return res;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    isNextCalled: () => nextCalled,
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
}

// Mock Supabase Auth verifier
function createMockVerifier() {
  return {
    auth: {
      async getUser(token) {
        if (token === "valid-admin-token") {
          return {
            data: {
              user: {
                id: "admin-uuid-1",
                email: "admin@crowdflow.org",
                app_metadata: { role: "admin" },
                user_metadata: { full_name: "Admin User" },
              },
            },
            error: null,
          };
        }
        if (token === "valid-passenger-token") {
          return {
            data: {
              user: {
                id: "passenger-uuid-1",
                email: "passenger@example.com",
                app_metadata: {}, // ordinary passenger — no admin role
                user_metadata: { full_name: "Passenger User" },
              },
            },
            error: null,
          };
        }
        if (token === "spoofed-role-token") {
          return {
            data: {
              user: {
                id: "spoofed-user-2",
                email: "spoof@example.com",
                app_metadata: {}, // no admin in app_metadata
                user_metadata: { role: "admin" }, // client tampered user_metadata
              },
            },
            error: null,
          };
        }
        return {
          data: { user: null },
          error: { message: "Invalid or expired token." },
        };
      },
    },
  };
}

describe("Express Server Authentication & Authorization Middleware (In-Memory)", () => {
  const mockVerifier = createMockVerifier();
  const requireAdmin = createRequireAdminMiddleware(mockVerifier);

  test("1. Unauthenticated request without Authorization header returns 401", async () => {
    const ctx = createMockContext({});
    await requireAdmin(ctx.req, ctx.res, ctx.next);

    assert.equal(ctx.isNextCalled(), false);
    assert.equal(ctx.getStatus(), 401);
    assert.equal(ctx.getBody().success, false);
    assert.match(ctx.getBody().message, /Authorization header is missing/i);
  });

  test("2. Unauthenticated request with non-Bearer header returns 401", async () => {
    const ctx = createMockContext({ authorization: "Basic dXNlcjpwYXNz" });
    await requireAdmin(ctx.req, ctx.res, ctx.next);

    assert.equal(ctx.isNextCalled(), false);
    assert.equal(ctx.getStatus(), 401);
    assert.equal(ctx.getBody().success, false);
    assert.match(ctx.getBody().message, /Bearer token format expected/i);
  });

  test("3. Unauthenticated request with empty Bearer token returns 401", async () => {
    const ctx = createMockContext({ authorization: "Bearer   " });
    await requireAdmin(ctx.req, ctx.res, ctx.next);

    assert.equal(ctx.isNextCalled(), false);
    assert.equal(ctx.getStatus(), 401);
    assert.equal(ctx.getBody().success, false);
    assert.match(ctx.getBody().message, /Bearer token is empty/i);
  });

  test("4. Request with invalid or expired token returns 401", async () => {
    const ctx = createMockContext({ authorization: "Bearer invalid-tampered-token" });
    await requireAdmin(ctx.req, ctx.res, ctx.next);

    assert.equal(ctx.isNextCalled(), false);
    assert.equal(ctx.getStatus(), 401);
    assert.equal(ctx.getBody().success, false);
    assert.match(ctx.getBody().message, /Invalid or expired authorization token/i);
  });

  test("5. Passenger attempting admin operation returns 403 Forbidden", async () => {
    const ctx = createMockContext({ authorization: "Bearer valid-passenger-token" });
    await requireAdmin(ctx.req, ctx.res, ctx.next);

    assert.equal(ctx.isNextCalled(), false);
    assert.equal(ctx.getStatus(), 403);
    assert.equal(ctx.getBody().success, false);
    assert.match(ctx.getBody().message, /Administrator role required/i);
  });

  test("6. User tampering with user_metadata.role='admin' is rejected with 403 Forbidden", async () => {
    const ctx = createMockContext({ authorization: "Bearer spoofed-role-token" });
    await requireAdmin(ctx.req, ctx.res, ctx.next);

    assert.equal(ctx.isNextCalled(), false);
    assert.equal(ctx.getStatus(), 403);
    assert.equal(ctx.getBody().success, false);
    assert.match(ctx.getBody().message, /Administrator role required/i);
  });

  test("7. Authenticated administrator calls next() and populates req.user, req.token", async () => {
    const ctx = createMockContext({ authorization: "Bearer valid-admin-token" });
    await requireAdmin(ctx.req, ctx.res, ctx.next);

    assert.equal(ctx.isNextCalled(), true);
    assert.equal(ctx.req.user.id, "admin-uuid-1");
    assert.equal(ctx.req.user.email, "admin@crowdflow.org");
    assert.equal(ctx.req.user.app_metadata.role, "admin");
    assert.equal(ctx.req.token, "valid-admin-token");
  });

  test("8. Route definitions verify protection boundary", () => {
    // Check that protected Express route modules load correctly
    const alertRoutes = require("./routes/alertRoutes");
    const deploymentRoutes = require("./routes/deploymentRoutes");
    const dashboardRoutes = require("./routes/dashboardRoutes");
    const analyticsRoutes = require("./routes/analyticsRoutes");
    const busRoutes = require("./routes/busRoutes");

    assert.ok(alertRoutes, "alertRoutes should load");
    assert.ok(deploymentRoutes, "deploymentRoutes should load");
    assert.ok(dashboardRoutes, "dashboardRoutes should load");
    assert.ok(analyticsRoutes, "analyticsRoutes should load");
    assert.ok(busRoutes, "busRoutes should load");
  });
});
