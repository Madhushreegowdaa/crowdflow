import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: routes, error } = await supabase
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
