import { buildCors, json } from "../_shared/cors.ts";
import { createAdminClient, getEnv, requireUser } from "../_shared/supabase.ts";
import { createHash } from "../_shared/crypto.ts";
import { errorResponse, sanitizeDbError, ErrorCode } from "../_shared/errors.ts";

type Body = { household_id?: string; email?: string };

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

Deno.serve(async (req) => {
  const { originAllowed, headers } = buildCors(req);

  if (req.method === "OPTIONS") {
    if (!originAllowed)
      return new Response("Forbidden", { status: 403, headers });
    return new Response(null, { status: 204, headers });
  }

  if (!originAllowed) {
    return json({ error: "Origin not allowed" }, { status: 403, headers });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers });
  }

  const { user, error } = await requireUser(req);
  if (!user) return errorResponse(ErrorCode.UNAUTHORIZED, error || "Unauthorized", 401, headers);

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Invalid JSON body", 400, headers);
  }

  const householdId = (body.household_id ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();

  if (!householdId)
    return errorResponse(ErrorCode.MISSING_FIELD, "Missing household_id", 400, headers);
  if (!email || !isEmail(email)) {
    return errorResponse(ErrorCode.INVALID_EMAIL, "Invalid email format", 400, headers);
  }

  const admin = createAdminClient();

  // Check the caller is an admin or owner in the household
  const { data: membership, error: mErr } = await admin
    .from("household_members")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (mErr) return sanitizeDbError(mErr, headers);
  if (!membership)
    return errorResponse(ErrorCode.NOT_HOUSEHOLD_MEMBER, "Not a household member", 403, headers);

  // Only admins and owners can invite
  if (!["owner", "admin"].includes(membership.role)) {
    return errorResponse(ErrorCode.NOT_ADMIN, "Only admins can create invites", 403, headers);
  }

  // Create token + hash
  const token = crypto.randomUUID();
  const token_hash = await createHash(token);

  const expires_at = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString(); // 7 days

  const { error: iErr } = await admin.from("invites").insert({
    household_id: householdId,
    email,
    token_hash,
    expires_at,
    invited_by_user_id: user.id,
  });

  if (iErr) return sanitizeDbError(iErr, headers);

  const e = getEnv();
  const base = (e.siteUrl || "").replace(/\/$/, "");
  const invite_url = `${base}/join?token=${encodeURIComponent(token)}`;

  // Email sending is optional — if RESEND not configured, we still return the URL.
  let email_sent = false;
  if (e.resendApiKey && e.resendFrom) {
    try {
      const subject = "Trackly Home invite";
      const html = `<p>You’ve been invited to join a Trackly Home household.</p>
<p><a href="${invite_url}">Click here to join</a></p>`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${e.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: e.resendFrom,
          to: [email],
          subject,
          html,
        }),
      });

      email_sent = r.ok;
    } catch {
      email_sent = false;
    }
  }

  return json({ invite_url, email_sent }, { status: 200, headers });
});
