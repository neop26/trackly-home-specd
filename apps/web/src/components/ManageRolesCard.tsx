import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
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
    <Box borderWidth={1} borderRadius="lg" p={4}>
      <VStack spacing={3} align="stretch">
        <Box>
          <Heading size="sm">Household Members</Heading>
          <Text fontSize="sm" color="gray.600">
            Manage roles for members in your household.
          </Text>
        </Box>

        {loading && <Text fontSize="sm" color="gray.600">Loading...</Text>}
        {error && <Text fontSize="sm" color="red.600">{error}</Text>}
        {updateError && <Text fontSize="sm" color="red.600">{updateError}</Text>}

        {!loading && members.length > 0 && (
          <VStack spacing={2} align="stretch">
            {sortedMembers.map((member) => {
              const isSelf = member.user_id === currentUserId;
              return (
                <Flex
                  key={member.user_id}
                  align="center"
                  justify="space-between"
                  borderWidth={1}
                  borderRadius="lg"
                  p={3}
                >
                  <Box>
                    <Text fontWeight="medium">
                      {member.profile?.display_name}
                      {isSelf && " (You)"}
                    </Text>
                    <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                      {member.role}
                    </Text>
                  </Box>

                  {isAdmin && !isSelf && member.role !== "owner" && (
                    <Select
                      aria-label={`Change role for ${member.profile?.display_name}`}
                      size="sm"
                      w="auto"
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value)}
                      isDisabled={busy}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </Select>
                  )}
                </Flex>
              );
            })}
          </VStack>
        )}

        {!loading && members.length === 0 && (
          <Text fontSize="sm" color="gray.600">No members found.</Text>
        )}
      </VStack>
    </Box>
  );
}
