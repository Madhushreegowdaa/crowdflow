import { NextResponse } from "next/server";
import { getCrowdflowApiUrl } from "@/lib/server/crowdflow-api";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Enter a valid boarding stop and destination." },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { success: false, message: "Enter a valid boarding stop and destination." },
      { status: 400 },
    );
  }

  const { boarding_stop, target_destination, current_bus_id } =
    payload as Record<string, unknown>;
  if (
    typeof boarding_stop !== "string" ||
    !boarding_stop.trim() ||
    typeof target_destination !== "string" ||
    !target_destination.trim() ||
    (current_bus_id !== undefined &&
      (typeof current_bus_id !== "string" || !current_bus_id.trim()))
  ) {
    return NextResponse.json(
      { success: false, message: "A boarding stop and destination are required." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(
      getCrowdflowApiUrl("/api/analytics/buses/alternatives"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boarding_stop: boarding_stop.trim(),
          target_destination: target_destination.trim(),
          ...(typeof current_bus_id === "string"
            ? { exclude_bus_id: current_bus_id.trim() }
            : {}),
        }),
        cache: "no-store",
      },
    );
    const result: unknown = await upstream.json();

    return NextResponse.json(result, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(
      "Passenger alternative bus request failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Alternative bus recommendations are temporarily unavailable.",
      },
      { status: 502 },
    );
  }
}
