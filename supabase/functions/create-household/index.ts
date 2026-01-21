import { buildCors, json } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { errorResponse, sanitizeDbError, ErrorCode } from "../_shared/errors.ts";

type Body = { name?: string };

Deno.serve(async (req) => {
  const { originAllowed, headers } = buildCors(req);

  // Handle preflight
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

  // Auth
  const { user, error } = await requireUser(req);
  if (!user) {
    return errorResponse(ErrorCode.UNAUTHORIZED, error || "Unauthorized", 401, headers);
  }

  // Body
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Invalid JSON body", 400, headers);
  }

  const name = (body.name ?? "").trim();
  if (!name)
    return errorResponse(ErrorCode.MISSING_FIELD, "Missing household name", 400, headers);
  if (name.length > 80) {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Household name too long (max 80)", 400, headers);
  }

  const admin = createAdminClient();

  // Prevent the same user creating multiple households (for now)
  // (Later we can support multiple roles/multi-household if you want.)
  const { data: existingMembership, error: memberErr } = await admin
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (memberErr)
    return sanitizeDbError(memberErr, headers);

  if (existingMembership?.household_id) {
    return errorResponse(
      ErrorCode.ALREADY_IN_HOUSEHOLD,
      "User already belongs to a household",
      409,
      headers
    );
  }

  // Create household + owner membership
  const { data: household, error: hErr } = await admin
    .from("households")
    .insert({ name, owner_user_id: user.id })
    .select("id")
    .single();

  if (hErr) return sanitizeDbError(hErr, headers);

  const { error: hmErr } = await admin.from("household_members").insert({
    household_id: household.id,
    user_id: user.id,
    role: "owner",
  });

  if (hmErr) return sanitizeDbError(hmErr, headers);

  // Update onboarding status
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ onboarding_status: "in_household" })
    .eq("user_id", user.id);

  if (profileErr) return sanitizeDbError(profileErr, headers);

  return json({ household_id: household.id }, { status: 200, headers });
});
