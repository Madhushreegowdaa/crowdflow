import { describe, expect, it } from "vitest";
import { verifyAdminRequest } from "../src/lib/auth/admin-auth-guard";
import type { SupabaseClient, User } from "@supabase/supabase-js";

function createMockSupabaseClient(handlers: {
  getUser?: (token?: string) => Promise<{ data: { user: User | null }; error: any }>;
  getSession?: () => Promise<{ data: { session: any }; error: any }>;
}): SupabaseClient {
  return {
    auth: {
      getUser: handlers.getUser || (async () => ({ data: { user: null }, error: null })),
      getSession: handlers.getSession || (async () => ({ data: { session: null }, error: null })),
    },
  } as unknown as SupabaseClient;
}

describe("Next.js Server-side Admin Auth Guard (verifyAdminRequest)", () => {
  it("returns 401 when request is completely unauthenticated (no header, no session)", async () => {
    const mockClient = createMockSupabaseClient({
      getUser: async () => ({ data: { user: null }, error: { message: "No session" } }),
    });

    const req = new Request("http://localhost:3000/admin-api/buses");
    const result = await verifyAdminRequest(req, mockClient);

    expect(result.authorized).toBe(false);
    if (result.authorized === false) {
      expect(result.response.status).toBe(401);
      const json = await result.response.json();
      expect(json.success).toBe(false);
      expect(json.message).toMatch(/Authentication required/i);
    }
  });

  it("returns 401 when Bearer token is invalid or expired", async () => {
    const mockClient = createMockSupabaseClient({
      getUser: async (token) => {
        if (token === "invalid-token") {
          return { data: { user: null }, error: { message: "Invalid JWT" } };
        }
        return { data: { user: null }, error: null };
      },
    });

    const req = new Request("http://localhost:3000/admin-api/buses", {
      headers: { Authorization: "Bearer invalid-token" },
    });
    const result = await verifyAdminRequest(req, mockClient);

    expect(result.authorized).toBe(false);
    if (result.authorized === false) {
      expect(result.response.status).toBe(401);
      const json = await result.response.json();
      expect(json.message).toMatch(/Authentication required/i);
    }
  });

  it("returns 403 Forbidden when authenticated user is an ordinary passenger without admin role", async () => {
    const passengerUser = {
      id: "passenger-123",
      email: "passenger@test.com",
      app_metadata: {}, // no role
      user_metadata: {},
    } as unknown as User;

    const mockClient = createMockSupabaseClient({
      getUser: async () => ({ data: { user: passengerUser }, error: null }),
    });

    const req = new Request("http://localhost:3000/admin-api/buses", {
      headers: { Authorization: "Bearer passenger-token" },
    });
    const result = await verifyAdminRequest(req, mockClient);

    expect(result.authorized).toBe(false);
    if (result.authorized === false) {
      expect(result.response.status).toBe(403);
      const json = await result.response.json();
      expect(json.success).toBe(false);
      expect(json.message).toMatch(/Administrator role required/i);
    }
  });

  it("returns 403 Forbidden if user maliciously sets user_metadata.role = 'admin' but app_metadata lacks it", async () => {
    const spoofedUser = {
      id: "spoof-user-456",
      email: "attacker@test.com",
      app_metadata: { provider: "email" }, // no app_metadata.role
      user_metadata: { role: "admin" }, // Client attempted spoofing in user_metadata
    } as unknown as User;

    const mockClient = createMockSupabaseClient({
      getUser: async () => ({ data: { user: spoofedUser }, error: null }),
    });

    const req = new Request("http://localhost:3000/admin-api/alerts", {
      headers: { Authorization: "Bearer spoof-token" },
    });
    const result = await verifyAdminRequest(req, mockClient);

    expect(result.authorized).toBe(false);
    if (result.authorized === false) {
      expect(result.response.status).toBe(403);
      const json = await result.response.json();
      expect(json.message).toMatch(/Administrator role required/i);
    }
  });

  it("authorizes request when user has verified app_metadata.role = 'admin' via Bearer token", async () => {
    const adminUser = {
      id: "admin-789",
      email: "admin@crowdflow.org",
      app_metadata: { role: "admin" },
      user_metadata: { full_name: "Fleet Administrator" },
    } as unknown as User;

    const mockClient = createMockSupabaseClient({
      getUser: async (token) => {
        if (token === "valid-admin-jwt") {
          return { data: { user: adminUser }, error: null };
        }
        return { data: { user: null }, error: { message: "Unknown" } };
      },
    });

    const req = new Request("http://localhost:3000/admin-api/buses", {
      headers: { Authorization: "Bearer valid-admin-jwt" },
    });
    const result = await verifyAdminRequest(req, mockClient);

    expect(result.authorized).toBe(true);
    if (result.authorized === true) {
      expect(result.user.id).toBe("admin-789");
      expect(result.user.app_metadata.role).toBe("admin");
      expect(result.token).toBe("valid-admin-jwt");
    }
  });

  it("authorizes request when admin is authenticated via server session cookies", async () => {
    const adminUser = {
      id: "admin-session-999",
      email: "admin-cookie@crowdflow.org",
      app_metadata: { role: "admin" },
      user_metadata: {},
    } as unknown as User;

    const mockClient = createMockSupabaseClient({
      getUser: async (token) => {
        // called without token (cookie inspection)
        if (!token) {
          return { data: { user: adminUser }, error: null };
        }
        return { data: { user: null }, error: null };
      },
      getSession: async () => ({
        data: {
          session: {
            access_token: "session-access-token-xyz",
            user: adminUser,
          },
        },
        error: null,
      }),
    });

    const req = new Request("http://localhost:3000/admin-api/deployments");
    const result = await verifyAdminRequest(req, mockClient);

    expect(result.authorized).toBe(true);
    if (result.authorized === true) {
      expect(result.user.id).toBe("admin-session-999");
      expect(result.token).toBe("session-access-token-xyz");
    }
  });
});
