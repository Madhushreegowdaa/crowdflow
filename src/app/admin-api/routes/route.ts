import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/admin-auth-guard";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (auth.authorized === false) {
    return auth.response;
  }

  const { data: routes, error } = await auth.supabase
    .from("routes")
    .select("*")
    .order("route_name", { ascending: true });

  if (error) {
    console.error("Admin routes API error:", error.message);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve routes." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, count: routes.length, routes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
