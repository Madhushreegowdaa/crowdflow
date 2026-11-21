import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: buses, error } = await supabase.from("buses").select("*");

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
