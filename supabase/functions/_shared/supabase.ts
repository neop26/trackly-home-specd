import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type Env = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  siteUrl: string;
  inviteTokenSecret: string;
  resendApiKey: string;
  resendFrom: string;
  corsOrigins: string; // optional CSV allowlist
};

function env(name: string): string {
  return Deno.env.get(name) ?? "";
}

// IMPORTANT:
// Supabase hosted “secrets” does NOT allow env names starting with SUPABASE_.
// So we read SB_* first, but keep SUPABASE_* as a fallback for local dev.
export function getEnv(): Env {
  const url = env("SB_URL") || env("SUPABASE_URL");
  const anonKey = env("SB_ANON_KEY") || env("SUPABASE_ANON_KEY");
  const serviceRoleKey =
    env("SB_SERVICE_ROLE_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");

  const siteUrl = env("SITE_URL");
  const inviteTokenSecret = env("INVITE_TOKEN_SECRET");
  const resendApiKey = env("RESEND_API_KEY");
  const resendFrom = env("RESEND_FROM");
  const corsOrigins = env("CORS_ORIGINS"); // optional

  return {
    url,
    anonKey,
    serviceRoleKey,
    siteUrl,
    inviteTokenSecret,
    resendApiKey,
    resendFrom,
    corsOrigins,
  };
}

export function requireCoreEnv(e = getEnv()) {
  const missing: string[] = [];
  if (!e.url) missing.push("SB_URL (or SUPABASE_URL)");
  if (!e.anonKey) missing.push("SB_ANON_KEY (or SUPABASE_ANON_KEY)");
  if (!e.serviceRoleKey)
    missing.push("SB_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

export function createAdminClient() {
  const e = getEnv();
  requireCoreEnv(e);

  return createClient(e.url, e.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function createUserClient(accessToken: string) {
  const e = getEnv();
  requireCoreEnv(e);

  return createClient(e.url, e.anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function getBearerToken(req: Request): string | null {
  const h =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function requireUser(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return {
      user: null,
      token: null,
      error: "Missing Authorization bearer token",
    };
  }

  const userClient = createUserClient(token);
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) {
    const msg = error?.message
      ? `Invalid session: ${error.message}`
      : "Invalid session";
    return { user: null, token: null, error: msg };
  }

  return { user: data.user, token, error: null };
}
