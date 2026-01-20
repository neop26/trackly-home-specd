import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { upsertProfileOnLogin } from "../services/profile";

export default function AuthCallback() {
  const [status, setStatus] = useState("Completing sign-in…");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // For PKCE/code flows:
        // If there's a code in the URL, exchange it.
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;
        if (!session) {
          setStatus("No session found. Please try signing in again.");
          return;
        }

        await upsertProfileOnLogin(session.user);

        const next =
          new URL(window.location.href).searchParams.get("next") || "/app";

        navigate(next, { replace: true });
      } catch (e) {
        setStatus(String(e));
      }
    })();
  }, [navigate]);

  return <div className="p-6">{status}</div>;
}
