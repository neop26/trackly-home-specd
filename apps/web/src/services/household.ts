import { supabase } from "../lib/supabaseClient";

export type HouseholdContext = {
  householdId: string;
  householdName: string;
  role: string;
  ownerUserId: string;
};

export async function getHouseholdForUser(userId: string) {
  // membership (current user)
  const { data: memberRow, error: memberErr } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (memberErr) throw memberErr;
  if (!memberRow?.household_id) return null;

  const householdId = memberRow.household_id as string;

  const { data: householdRow, error: householdErr } = await supabase
    .from("households")
    .select("id, name, owner_user_id")
    .eq("id", householdId)
    .single();

  if (householdErr) throw householdErr;

  return {
    householdId: householdRow.id as string,
    householdName: householdRow.name as string,
    ownerUserId: householdRow.owner_user_id as string,
    role: (memberRow.role as string) || "member",
  } satisfies HouseholdContext;
}
