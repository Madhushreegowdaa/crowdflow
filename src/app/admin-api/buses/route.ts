import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/admin-auth-guard";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (auth.authorized === false) {
    return auth.response;
  }

  const { data: buses, error } = await auth.supabase.from("buses").select("*");

  if (error) {
    console.error("Fleet buses API error:", error.message);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve buses." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, count: buses.length, buses },
    { headers: { "Cache-Control": "no-store" } },
  );
}
