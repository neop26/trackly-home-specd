import { buildCors, json } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { errorResponse, sanitizeDbError, ErrorCode } from "../_shared/errors.ts";

type Body = {
  household_id?: string;
  target_user_id?: string;
  new_role?: string;
};

// MVP: keep ownership immutable in-app to avoid accidental lockouts.
// (DB still supports 'owner', but this endpoint won't change it.)
const VALID_ROLES = ["admin", "member"];

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
  const targetUserId = (body.target_user_id ?? "").trim();
  const newRole = (body.new_role ?? "").trim().toLowerCase();

  if (!householdId)
    return errorResponse(ErrorCode.MISSING_FIELD, "Missing household_id", 400, headers);
  if (!targetUserId)
    return errorResponse(ErrorCode.MISSING_FIELD, "Missing target_user_id", 400, headers);
  if (!newRole || !VALID_ROLES.includes(newRole)) {
    return errorResponse(ErrorCode.INVALID_ROLE, "Invalid role. Must be admin or member", 400, headers);
  }

  const admin = createAdminClient();

  // Check caller is admin/owner
  const { data: callerMembership, error: callerErr } = await admin
    .from("household_members")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (callerErr)
    return sanitizeDbError(callerErr, headers);
  if (!callerMembership)
    return errorResponse(ErrorCode.NOT_HOUSEHOLD_MEMBER, "Not a household member", 403, headers);

  if (!["owner", "admin"].includes(callerMembership.role)) {
    return errorResponse(ErrorCode.NOT_ADMIN, "Only admins can manage roles", 403, headers);
  }

  // Get target member
  const { data: targetMember, error: targetErr } = await admin
    .from("household_members")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", targetUserId)
    .limit(1)
    .maybeSingle();

  if (targetErr)
    return sanitizeDbError(targetErr, headers);
  if (!targetMember)
    return errorResponse(ErrorCode.USER_NOT_FOUND, "Target user not found in household", 404, headers);

  // MVP: do not allow changing the household owner's role.
  if (targetMember.role === "owner") {
    return errorResponse(ErrorCode.CANNOT_CHANGE_OWNER, "Owner role cannot be changed", 403, headers);
  }

  // Prevent removing last admin (if demoting an admin to member)
  if (
    (targetMember.role === "admin" || targetMember.role === "owner") &&
    newRole === "member"
  ) {
    const { count, error: countErr } = await admin
      .from("household_members")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .in("role", ["admin", "owner"]);

    if (countErr)
      return sanitizeDbError(countErr, headers);

    if ((count ?? 0) <= 1) {
      return errorResponse(ErrorCode.LAST_ADMIN, "Cannot remove last admin from household", 409, headers);
    }
  }

  // Update role
  const { error: updateErr } = await admin
    .from("household_members")
    .update({ role: newRole })
    .eq("household_id", householdId)
    .eq("user_id", targetUserId);

  if (updateErr)
    return sanitizeDbError(updateErr, headers);

  return json({ success: true, new_role: newRole }, { status: 200, headers });
});
