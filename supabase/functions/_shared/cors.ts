import { getEnv } from "./supabase.ts";

const DEFAULT_DEV_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function parseCsv(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildCors(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const e = getEnv();

  const allowed = new Set<string>();

  // Always allow SITE_URL (your SWA URL should be here in hosted env)
  if (e.siteUrl) allowed.add(e.siteUrl);

  // Optional explicit allowlist
  if (e.corsOrigins) {
    for (const o of parseCsv(e.corsOrigins)) allowed.add(o);
  }

  // Local dev convenience
  for (const o of DEFAULT_DEV_ORIGINS) allowed.add(o);

  const originAllowed = !!origin && allowed.has(origin);

  // Only reflect origin if allowed (secure default)
  const headers: HeadersInit = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };

  if (originAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return { origin, originAllowed, headers };
}

export function json(
  body: unknown,
  init: { status?: number; headers?: HeadersInit } = {}
) {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}
