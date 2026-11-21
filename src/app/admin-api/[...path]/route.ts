import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function isAllowedRequest(path: string[], method: string) {
  const isIdentifier = (value: string | undefined) =>
    Boolean(value && /^[A-Za-z0-9_-]+$/.test(value));

  if (
    method === "GET" &&
    ((path.length === 2 &&
      path[0] === "dashboard" &&
      (path[1] === "stats" || path[1] === "route-demand")) ||
      (path.length === 1 &&
        (path[0] === "alerts" || path[0] === "deployments")))
  ) {
    return true;
  }

  if (
    method === "PATCH" &&
    path.length === 3 &&
    path[0] === "alerts" &&
    isIdentifier(path[1]) &&
    path[2] === "resolve"
  ) {
    return true;
  }

  if (
    method === "POST" &&
    path.length === 2 &&
    path[0] === "deployments" &&
    path[1] === "generate"
  ) {
    return true;
  }

  return (
    method === "PATCH" &&
    path.length === 3 &&
    path[0] === "deployments" &&
    isIdentifier(path[1]) &&
    (path[2] === "approve" || path[2] === "reject")
  );
}

async function forwardRequest(
  request: Request,
  context: RouteContext,
  method: "GET" | "POST" | "PATCH",
) {
  const { path } = await context.params;

  if (!isAllowedRequest(path, method)) {
    return NextResponse.json(
      { success: false, message: "Admin API endpoint not found." },
      { status: 404 },
    );
  }

  const backendUrl = process.env.ADMIN_API_BASE_URL ?? "http://127.0.0.1:5000";
  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const target = new URL(`/api/${encodedPath}`, backendUrl);
  target.search = new URL(request.url).search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: method === "GET" ? undefined : await request.text(),
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "Admin API backend request failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Admin backend is unavailable. Restart the application with npm run dev.",
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) {
    responseHeaders.set("content-type", upstreamContentType);
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export function GET(request: Request, context: RouteContext) {
  return forwardRequest(request, context, "GET");
}

export function POST(request: Request, context: RouteContext) {
  return forwardRequest(request, context, "POST");
}

export function PATCH(request: Request, context: RouteContext) {
  return forwardRequest(request, context, "PATCH");
}
