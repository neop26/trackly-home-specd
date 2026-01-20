import { useState, useEffect } from "react";
import {
  useHouseholdMembers,
  updateMemberRole,
  type HouseholdMember,
} from "../services/members";
import { supabase } from "../lib/supabaseClient";

type Props = {
  householdId: string;
  currentUserRole: string;
};

export default function ManageRolesCard({
  householdId,
  currentUserRole,
}: Props) {
  const { members, loading, error } = useHouseholdMembers(householdId);
  const [busy, setBusy] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then((u) => setCurrentUserId(u.data.user?.id ?? null));
  }, []);

  const isAdmin = ["owner", "admin"].includes(currentUserRole);

  const sortedMembers = [...members].sort((a, b) => {
    const rank = (role: string) => {
      const r = (role || "").toLowerCase();
      if (r === "owner") return 0;
      if (r === "admin") return 1;
      return 2;
    };

    const ra = rank(a.role);
    const rb = rank(b.role);
    if (ra !== rb) return ra - rb;

    // Within the same role group, sort by display name for stability.
    const na = (a.profile?.display_name || "").toLowerCase();
    const nb = (b.profile?.display_name || "").toLowerCase();
    return na.localeCompare(nb);
  });

  async function handleRoleChange(member: HouseholdMember, newRole: string) {
    setUpdateError(null);
    setBusy(true);

    try {
      await updateMemberRole(householdId, member.user_id, newRole);
      // Refresh members list
      window.location.reload();
    } catch (e) {
      setUpdateError(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <div className="font-semibold">Household Members</div>
        <div className="text-sm text-gray-600">
          Manage roles for members in your household.
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {updateError && <div className="text-sm text-red-600">{updateError}</div>}

      {!loading && members.length > 0 && (
        <div className="space-y-2">
          {sortedMembers.map((member) => {
            const isSelf = member.user_id === currentUserId;
            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">
                    {member.profile?.display_name}
                    {isSelf && " (You)"}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {member.role}
                  </div>
                </div>

                {isAdmin && !isSelf && member.role !== "owner" && (
                  <select
                    aria-label={`Change role for ${member.profile?.display_name}`}
                    className="rounded-lg border px-3 py-2 text-sm"
                    value={member.role}
                    onChange={(e) => handleRoleChange(member, e.target.value)}
                    disabled={busy}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && members.length === 0 && (
        <div className="text-sm text-gray-600">No members found.</div>
      )}
    </div>
  );
}
