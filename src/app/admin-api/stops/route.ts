import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/admin-auth-guard";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (auth.authorized === false) {
    return auth.response;
  }

  const { data: stops, error } = await auth.supabase
    .from("stops")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Admin stops API error:", error.message);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve stops." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, count: stops.length, stops },
    { headers: { "Cache-Control": "no-store" } },
  );
}
