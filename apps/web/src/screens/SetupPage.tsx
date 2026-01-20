import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { getHouseholdForUser } from "../services/household";

export default function SetupPage() {
  const [name, setName] = useState("Home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return;

      // If they already have a household, go to /app
      const ctx = await getHouseholdForUser(userId);
      if (ctx) navigate("/app", { replace: true });
    })();
  }, [navigate]);

  async function createHousehold() {
    setError(null);
    setBusy(true);

    try {
      const trimmed = name.trim();
      if (!trimmed) {
        setError("Please enter a household name.");
        return;
      }

      const res = await supabase.functions.invoke("create-household", {
        body: { name: trimmed },
      });

      if (res.error) throw res.error;

      // Send them into the app; AppShell will render invite UI if owner
      navigate("/app?setup=1", { replace: true });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <AppHeader />

      <div className="max-w-lg rounded-xl border p-6 space-y-4">
        <div>
          <div className="text-lg font-semibold">Set up your household</div>
          <div className="text-sm text-gray-600">
            Create your home space to coordinate with your partner.
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="household" className="text-sm font-medium">
            Household name
          </label>
          <input
            id="household"
            className="w-full rounded-lg border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          className="w-full rounded-lg bg-black px-4 py-2 text-white"
          onClick={createHousehold}
          disabled={busy}
        >
          {busy ? "Creating…" : "Create household"}
        </button>
      </div>
    </div>
  );
}
