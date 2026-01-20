import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export type HouseholdMember = {
  user_id: string;
  role: string;
  profile?: {
    display_name: string;
  };
};

export async function getHouseholdMembers(householdId: string) {
  const { data: members, error } = await supabase
    .from("household_members")
    .select(
      `
      user_id,
      role
    `,
    )
    .eq("household_id", householdId);

  if (error) throw error;

  const rows = members || [];
  const userIds = rows.map((m) => m.user_id).filter(Boolean);

  if (userIds.length === 0) return [] as HouseholdMember[];

  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);

  if (profileErr) throw profileErr;

  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, p.display_name]),
  );

  return rows.map((m) => ({
    user_id: m.user_id,
    role: m.role,
    profile: {
      display_name: profileMap.get(m.user_id) || "Unknown",
    },
  })) as HouseholdMember[];
}

export function useHouseholdMembers(householdId: string | null) {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getHouseholdMembers(householdId)
      .then(setMembers)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [householdId]);

  return { members, loading, error };
}

export async function updateMemberRole(
  householdId: string,
  targetUserId: string,
  newRole: string,
) {
  const res = await supabase.functions.invoke("manage-roles", {
    body: {
      household_id: householdId,
      target_user_id: targetUserId,
      new_role: newRole,
    },
  });

  if (res.error) throw new Error(res.error.message);
  return res.data;
}
