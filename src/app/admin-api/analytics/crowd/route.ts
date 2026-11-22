import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/admin-auth-guard";
import { getCrowdflowApiUrl } from "@/lib/server/crowdflow-api";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (auth.authorized === false) {
    return auth.response;
  }

  if (!auth.token) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    const target = getCrowdflowApiUrl("/api/analytics/crowd");
    target.search = new URL(request.url).search;
    const upstream = await fetch(target, {
      headers: { authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });

    return new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error(
      "Crowd analytics backend request failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { success: false, message: "Crowd analytics backend is unavailable." },
      { status: 502 },
    );
  }
}
