import { buildCors, json } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { createHash } from "../_shared/crypto.ts";
import { errorResponse, sanitizeDbError, ErrorCode } from "../_shared/errors.ts";

type Body = { token?: string };

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

  const token = (body.token ?? "").trim();
  if (!token) return errorResponse(ErrorCode.MISSING_FIELD, "Missing token", 400, headers);

  const token_hash = await createHash(token);
  const admin = createAdminClient();

  // Find invite
  const { data: invite, error: invErr } = await admin
    .from("invites")
    .select("id, household_id, email, accepted_at, expires_at")
    .eq("token_hash", token_hash)
    .limit(1)
    .maybeSingle();

  if (invErr) return sanitizeDbError(invErr, headers);
  if (!invite)
    return errorResponse(ErrorCode.INVITE_NOT_FOUND, "Invite not found", 404, headers);

  if (invite.accepted_at) {
    return errorResponse(ErrorCode.INVITE_ALREADY_USED, "Invite already accepted", 409, headers);
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return errorResponse(ErrorCode.INVITE_EXPIRED, "Invite has expired", 410, headers);
  }

  // Add membership (idempotent)
  const { error: memErr } = await admin.from("household_members").upsert(
    {
      household_id: invite.household_id,
      user_id: user.id,
      role: "member",
    },
    { onConflict: "household_id,user_id" }
  );

  if (memErr) return sanitizeDbError(memErr, headers);

  // Mark invite accepted
  const { error: accErr } = await admin
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (accErr) return sanitizeDbError(accErr, headers);

  // Update onboarding status
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ onboarding_status: "in_household" })
    .eq("user_id", user.id);

  if (profileErr) return sanitizeDbError(profileErr, headers);

  return json({ household_id: invite.household_id }, { status: 200, headers });
});
