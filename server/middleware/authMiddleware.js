const { createClient } = require("@supabase/supabase-js");

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Reusable auth verification client
let authVerifierClient = null;

function getAuthVerifierClient() {
  if (!authVerifierClient && supabaseUrl && supabaseKey) {
    authVerifierClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return authVerifierClient;
}

/**
 * Creates a scoped Supabase client with the caller's JWT attached to all requests.
 * This ensures database operations execute under the caller's authenticated user context
 * and strictly obey PostgreSQL Row Level Security (RLS).
 */
function getScopedSupabaseClient(token) {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Express middleware requiring a verified Supabase Bearer token
 * and asserting that app_metadata.role === 'admin'.
 *
 * Never trusts client-supplied roles; verifies token cryptographically via Supabase Auth.
 * Returns:
 * - 401: Missing, malformed, invalid, or expired Bearer token.
 * - 403: Authenticated user lacks administrator privileges (e.g. passenger).
 */
function createRequireAdminMiddleware(customVerifier) {
  return async function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication required: Authorization header is missing.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: Bearer token format expected.",
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: Bearer token is empty.",
      });
    }

    const verifier = customVerifier || getAuthVerifierClient();
    if (!verifier) {
      console.error("[requireAdmin] Supabase verifier client is not configured.");
      return res.status(500).json({
        success: false,
        message: "Server authentication service is not configured.",
      });
    }

    try {
      const { data, error } = await verifier.auth.getUser(token);

      if (error || !data?.user) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired authorization token.",
        });
      }

      const role = data.user.app_metadata?.role;
      if (role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Administrator role required.",
        });
      }

      req.user = data.user;
      req.token = token;
      req.supabase = getScopedSupabaseClient(token);
      next();
    } catch (err) {
      console.error("[requireAdmin] Token verification exception:", err.message);
      return res.status(500).json({
        success: false,
        message: "Authentication verification service error.",
      });
    }
  };
}

const requireAdmin = createRequireAdminMiddleware();

module.exports = {
  requireAdmin,
  createRequireAdminMiddleware,
  getScopedSupabaseClient,
  getAuthVerifierClient,
};
