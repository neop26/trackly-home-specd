import { useEffect, useMemo, useState } from "react";
import { Box, Text, VStack, Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import { supabase } from "../lib/supabaseClient";
import { useLocation } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import InvitePartnerCard from "../components/InvitePartnerCard";
import ManageRolesCard from "../components/ManageRolesCard";
import TasksScreen from "./TasksScreen";
import DeletedTasksView from "../components/DeletedTasksView";
import {
  getHouseholdForUser,
  type HouseholdContext,
} from "../services/household";

export default function AppShell() {
  const [displayName, setDisplayName] = useState<string>("");
  const [ctx, setCtx] = useState<HouseholdContext | null>(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  const flags = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return {
      joined: sp.get("joined") === "1",
      setup: sp.get("setup") === "1",
    };
  }, [location.search]);

  useEffect(() => {
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) {
          // Route guard will handle redirect
          setLoading(false);
          return;
        }

        // profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.display_name) setDisplayName(profile.display_name);

        const household = await getHouseholdForUser(user.id);

        // Route guard ensures we only reach here if user has household
        setCtx(household);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Box p={6}><Text>Loading…</Text></Box>;
  if (!ctx) return <Box p={6}><Text>Loading…</Text></Box>;

  const subtitleLines = [
    displayName ? `Hi, ${displayName}` : "Hi",
    `Household: ${ctx.householdName}`,
  ];

  const isAdmin = ["owner", "admin"].includes(ctx.role);

  return (
    <VStack p={6} spacing={6} align="stretch">
      <AppHeader subtitleLines={subtitleLines} role={ctx.role} />

      {flags.joined && (
        <Box borderWidth={1} borderRadius="lg" p={4}>
          <Text fontWeight="semibold">
            Welcome — you joined {ctx.householdName} ✅
          </Text>
        </Box>
      )}

      {flags.setup && isAdmin && (
        <Box borderWidth={1} borderRadius="lg" p={4}>
          <Text fontWeight="semibold">
            Household setup complete ✅ (invite partner next)
          </Text>
        </Box>
      )}

      <InvitePartnerCard
        householdId={ctx.householdId}
        householdName={ctx.householdName}
        userRole={ctx.role}
      />

      <ManageRolesCard
        householdId={ctx.householdId}
        currentUserRole={ctx.role}
      />

      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Active Tasks</Tab>
          <Tab>Deleted Tasks</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <TasksScreen householdId={ctx.householdId} />
          </TabPanel>
          <TabPanel px={0}>
            <DeletedTasksView householdId={ctx.householdId} userRole={ctx.role} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
