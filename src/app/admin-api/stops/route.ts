import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: stops, error } = await supabase
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
