import { buildCors, json } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { createHash } from "../_shared/crypto.ts";

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
  if (!user) return json({ error }, { status: 401, headers });

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400, headers });
  }

  const token = (body.token ?? "").trim();
  if (!token) return json({ error: "Missing token" }, { status: 400, headers });

  const token_hash = await createHash(token);
  const admin = createAdminClient();

  // Find invite
  const { data: invite, error: invErr } = await admin
    .from("invites")
    .select("id, household_id, email, accepted_at, expires_at")
    .eq("token_hash", token_hash)
    .limit(1)
    .maybeSingle();

  if (invErr) return json({ error: invErr.message }, { status: 500, headers });
  if (!invite)
    return json({ error: "Invite not found" }, { status: 404, headers });

  if (invite.accepted_at) {
    return json({ error: "Invite already accepted" }, { status: 409, headers });
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return json({ error: "Invite expired" }, { status: 410, headers });
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

  if (memErr) return json({ error: memErr.message }, { status: 500, headers });

  // Mark invite accepted
  const { error: accErr } = await admin
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (accErr) return json({ error: accErr.message }, { status: 500, headers });

  return json({ household_id: invite.household_id }, { status: 200, headers });
});
