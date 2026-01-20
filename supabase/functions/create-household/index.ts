import { buildCors, json } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";

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
    return json({ error }, { status: 401, headers });
  }

  // Body
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400, headers });
  }

  const name = (body.name ?? "").trim();
  if (!name)
    return json({ error: "Missing household name" }, { status: 400, headers });
  if (name.length > 80) {
    return json(
      { error: "Household name too long (max 80)" },
      { status: 400, headers }
    );
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
    return json({ error: memberErr.message }, { status: 500, headers });

  if (existingMembership?.household_id) {
    return json(
      { error: "User already belongs to a household" },
      { status: 409, headers }
    );
  }

  // Create household + owner membership
  const { data: household, error: hErr } = await admin
    .from("households")
    .insert({ name, owner_user_id: user.id })
    .select("id")
    .single();

  if (hErr) return json({ error: hErr.message }, { status: 500, headers });

  const { error: hmErr } = await admin.from("household_members").insert({
    household_id: household.id,
    user_id: user.id,
    role: "owner",
  });

  if (hmErr) return json({ error: hmErr.message }, { status: 500, headers });

  return json({ household_id: household.id }, { status: 200, headers });
});
