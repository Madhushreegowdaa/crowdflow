import { NextResponse } from "next/server";
import { createClient as createAnonClient } from "../../../../lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAdmin() {
  // Verify the session using the anon client (reads the cookie)
  const supabase = await createAnonClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { authed: false, status: 401, message: "Unauthorized" };
  if (data.user.app_metadata?.role !== "admin") return { authed: false, status: 403, message: "Admin access required." };
  return { authed: true, status: 200, message: "" };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authed) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const db = getServiceClient();
  const { data, error } = await db
    .from("pass_requests")
    .select("id, user_id, pass_type, route_category, status, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load pass requests." }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authed) return NextResponse.json({ error: auth.message }, { status: auth.status });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const requestId = typeof values.requestId === "string" ? values.requestId.trim() : "";
  const newStatus = typeof values.status === "string" ? values.status.trim() : "";

  if (!requestId) return NextResponse.json({ error: "requestId is required." }, { status: 400 });
  if (newStatus !== "approved" && newStatus !== "rejected") {
    return NextResponse.json({ error: "Status must be 'approved' or 'rejected'." }, { status: 400 });
  }

  const db = getServiceClient();

  const { data: updatedRequest, error: updateError } = await db
    .from("pass_requests")
    .update({ status: newStatus })
    .eq("id", requestId)
    .select("id, user_id, pass_type, route_category, status, created_at")
    .single();

  if (updateError || !updatedRequest) {
    return NextResponse.json({ error: "Could not update pass request." }, { status: 500 });
  }

  if (newStatus === "approved") {
    const validFrom = new Date().toISOString().slice(0, 10);
    const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await db.from("digital_passes").insert({
      user_id: updatedRequest.user_id,
      pass_type: updatedRequest.pass_type,
      route_category: updatedRequest.route_category,
      valid_from: validFrom,
      valid_until: validUntil,
      status: "active",
      issued_at: validFrom,
    });
  }

  return NextResponse.json({ request: updatedRequest });
}
