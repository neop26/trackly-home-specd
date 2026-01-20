import { buildCors, json } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";

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
  if (!user) return json({ error }, { status: 401, headers });

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400, headers });
  }

  const householdId = (body.household_id ?? "").trim();
  const targetUserId = (body.target_user_id ?? "").trim();
  const newRole = (body.new_role ?? "").trim().toLowerCase();

  if (!householdId)
    return json({ error: "Missing household_id" }, { status: 400, headers });
  if (!targetUserId)
    return json({ error: "Missing target_user_id" }, { status: 400, headers });
  if (!newRole || !VALID_ROLES.includes(newRole)) {
    return json(
      { error: "Invalid role. Must be admin or member" },
      { status: 400, headers },
    );
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
    return json({ error: callerErr.message }, { status: 500, headers });
  if (!callerMembership)
    return json({ error: "Not a household member" }, { status: 403, headers });

  if (!["owner", "admin"].includes(callerMembership.role)) {
    return json(
      { error: "Only admins can manage roles" },
      { status: 403, headers },
    );
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
    return json({ error: targetErr.message }, { status: 500, headers });
  if (!targetMember)
    return json({ error: "Target user not found" }, { status: 404, headers });

  // MVP: do not allow changing the household owner's role.
  if (targetMember.role === "owner") {
    return json(
      { error: "Owner role cannot be changed in this MVP" },
      { status: 403, headers },
    );
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
      return json({ error: countErr.message }, { status: 500, headers });

    if ((count ?? 0) <= 1) {
      return json(
        { error: "Cannot remove last admin from household" },
        { status: 409, headers },
      );
    }
  }

  // Update role
  const { error: updateErr } = await admin
    .from("household_members")
    .update({ role: newRole })
    .eq("household_id", householdId)
    .eq("user_id", targetUserId);

  if (updateErr)
    return json({ error: updateErr.message }, { status: 500, headers });

  return json({ success: true, new_role: newRole }, { status: 200, headers });
});
