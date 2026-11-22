import { NextResponse } from "next/server";
import { createClient } from "../supabase/server";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

export type AdminAuthResult =
  | {
    authorized: true;
    user: User;
    token: string | null;
    supabase: SupabaseClient;
  }
  | {
    authorized: false;
    response: NextResponse;
  };

/** Type guard: returns true when auth was successful, narrowing to the authorized branch. */
export function isAdminAuthorized(
  auth: AdminAuthResult
): auth is { authorized: true; user: User; token: string | null; supabase: SupabaseClient } {
  return auth.authorized === true;
}

function createBearerScopedClient(token: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase configuration is missing.");
  }

  return createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Server-side guard for Next.js admin API routes.
 * 1. Checks Bearer token or Supabase session cookies.
 * 2. Validates identity against Supabase Auth service.
 * 3. Enforces app_metadata.role === 'admin' (never trusts client-supplied roles).
 * 4. Returns 401 for unauthenticated requests, 403 for non-admin passengers.
 *
 * @param request  The incoming Request.
 * @param customClient  Optional pre-built Supabase client (used in unit tests to inject a mock).
 */
export async function verifyAdminRequest(
  request: Request,
  customClient?: SupabaseClient
): Promise<AdminAuthResult> {
  try {
    const supabase = customClient ?? (await createClient());

    // 1. Check if an Authorization header was explicitly passed
    const authHeader = request.headers.get("authorization");
    let token: string | null = null;
    let user: User | null = null;

    if (authHeader !== null) {
      if (!authHeader.startsWith("Bearer ")) {
        return {
          authorized: false,
          response: NextResponse.json(
            { success: false, message: "Authentication required." },
            { status: 401 }
          ),
        };
      }

      token = authHeader.slice(7).trim();
      if (token) {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          user = data.user;
        }
      }
    } else {
      // Cookie authentication is used only when no Authorization header was supplied.
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token ?? null;
      }
    }

    // 3. Unauthenticated -> 401
    if (!user) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message: "Authentication required." },
          { status: 401 }
        ),
      };
    }

    // 4. Authenticated but non-admin (e.g. passenger) -> 403
    if (user.app_metadata?.role !== "admin") {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            message: "Forbidden: Administrator role required.",
          },
          { status: 403 }
        ),
      };
    }

    let queryClient = supabase;
    if (authHeader !== null) {
      if (!token) {
        return {
          authorized: false,
          response: NextResponse.json(
            { success: false, message: "Authentication required." },
            { status: 401 }
          ),
        };
      }

      queryClient = customClient ?? createBearerScopedClient(token);
    }

    return {
      authorized: true,
      user,
      token,
      supabase: queryClient,
    };
  } catch (err) {
    console.error(
      "[verifyAdminRequest] Exception:",
      err instanceof Error ? err.message : err
    );
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Authentication service error." },
        { status: 500 }
      ),
    };
  }
}
