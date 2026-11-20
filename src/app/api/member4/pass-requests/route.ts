import { NextResponse } from "next/server";
import { PASS_TYPE_OPTIONS, type PassRequest, type PassRequestStatus } from "../../../../../member4/types";
import { createClient } from "../../../../lib/supabase/server";

interface PassRequestRow {
  id: string;
  pass_type: string;
  route_category: string;
  status: string;
  created_at: string;
}

function isPassRequestStatus(value: string): value is PassRequestStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Send a valid request body." }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const allowedFields = new Set(["passType", "routeCategory"]);
  if (Object.keys(values).some((field) => !allowedFields.has(field))) {
    return NextResponse.json({ error: "Only pass type and route category can be submitted." }, { status: 400 });
  }

  const passType = values.passType;
  const routeCategory = typeof values.routeCategory === "string" ? values.routeCategory.trim() : "";
  if (
    typeof passType !== "string" ||
    !PASS_TYPE_OPTIONS.some((option) => option === passType) ||
    routeCategory.length < 1 ||
    routeCategory.length > 120
  ) {
    return NextResponse.json({ error: "Choose a valid pass type and enter a route category (up to 120 characters)." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Sign in to submit a pass request." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("pass_requests")
      .insert({
        user_id: authData.user.id,
        pass_type: passType,
        route_category: routeCategory,
      })
      .select("id, pass_type, route_category, status, created_at")
      .single();

    if (error) {
      const status = error.code === "42501" ? 403 : 500;
      return NextResponse.json(
        { error: status === 403 ? "Your account cannot submit this request." : "We could not submit your pass request. Please try again." },
        { status },
      );
    }

    const row = data as PassRequestRow;
    if (!isPassRequestStatus(row.status)) {
      return NextResponse.json({ error: "The saved request has an unsupported status." }, { status: 500 });
    }

    const passRequest: PassRequest = {
      id: row.id,
      passType: row.pass_type,
      routeCategory: row.route_category,
      status: row.status,
      createdAt: row.created_at,
    };

    return NextResponse.json({ request: passRequest }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not submit your pass request. Please try again." }, { status: 500 });
  }
}
