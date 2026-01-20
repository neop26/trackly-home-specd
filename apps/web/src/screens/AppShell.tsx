import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import InvitePartnerCard from "../components/InvitePartnerCard";
import ManageRolesCard from "../components/ManageRolesCard";
import {
  getHouseholdForUser,
  type HouseholdContext,
} from "../services/household";

export default function AppShell() {
  const [displayName, setDisplayName] = useState<string>("");
  const [ctx, setCtx] = useState<HouseholdContext | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
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
          navigate("/login", { replace: true });
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

        if (!household) {
          navigate("/setup", { replace: true });
          return;
        }

        setCtx(household);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!ctx) return <div className="p-6">Loading…</div>;

  const subtitleLines = [
    displayName ? `Hi, ${displayName}` : "Hi",
    `Household: ${ctx.householdName}`,
  ];

  const isAdmin = ["owner", "admin"].includes(ctx.role);

  return (
    <div className="p-6 space-y-6">
      <AppHeader subtitleLines={subtitleLines} role={ctx.role} />

      {flags.joined && (
        <div className="rounded-lg border p-4">
          <div className="font-semibold">
            Welcome — you joined {ctx.householdName} ✅
          </div>
        </div>
      )}

      {flags.setup && isAdmin && (
        <div className="rounded-lg border p-4">
          <div className="font-semibold">
            Household setup complete ✅ (invite partner next)
          </div>
        </div>
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

      <div className="rounded-lg border p-4 text-sm text-gray-700">
        Planner comes next 🙂
      </div>
    </div>
  );
}
