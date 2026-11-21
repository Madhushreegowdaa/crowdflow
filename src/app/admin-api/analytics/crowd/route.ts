import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: buses, error } = await supabase
      .from("buses")
      .select(
        "id,bus_number,route_name,crowd_level,current_passengers,total_capacity,occupancy_percent",
      );

    if (error) {
      console.error("Crowd analytics API error:", error.message);
      return NextResponse.json(
        { success: false, message: "Unable to retrieve crowd analytics." },
        { status: 500 },
      );
    }

    const crowdSummary = { low: 0, medium: 0, high: 0, unknown: 0 };
    const busCrowdDetails = (buses ?? []).map((bus) => {
      const level = String(bus.crowd_level ?? "").toLowerCase();

      if (level === "low") {
        crowdSummary.low++;
      } else if (level === "medium") {
        crowdSummary.medium++;
      } else if (level === "high") {
        crowdSummary.high++;
      } else {
        crowdSummary.unknown++;
      }

      const capacity = Number(bus.total_capacity);
      const passengers = Number(bus.current_passengers);

      return {
        busId: bus.id,
        busNumber: bus.bus_number,
        routeName: bus.route_name,
        passengerCount: bus.current_passengers,
        capacity: bus.total_capacity,
        occupancy:
          bus.occupancy_percent ??
          (capacity > 0 ? (passengers / capacity) * 100 : null),
        crowdLevel: bus.crowd_level,
      };
    });

    return NextResponse.json(
      {
        success: true,
        analytics: {
          totalBuses: busCrowdDetails.length,
          crowdSummary,
          busCrowdDetails,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Crowd analytics API error:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { success: false, message: "Unable to retrieve crowd analytics." },
      { status: 500 },
    );
  }
}
