import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";

export default function JoinPage() {
  const [status, setStatus] = useState("Accepting invite…");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const token = new URLSearchParams(location.search).get("token");
        if (!token) {
          setStatus("Missing invite token.");
          return;
        }

        const next = encodeURIComponent(location.pathname + location.search);
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          navigate(`/login?next=${next}`, { replace: true });
          return;
        }

        const res = await supabase.functions.invoke("accept-invite", {
          body: { token },
        });

        if (res.error) {
          const anyErr = res.error as any;
          const ctx = anyErr?.context;
          const statusCode = ctx?.status ?? anyErr?.status ?? null;

          let serverMessage: string | null = null;
          try {
            if (
              ctx &&
              typeof ctx.clone === "function" &&
              typeof ctx.json === "function"
            ) {
              const j = await ctx.clone().json();
              if (j && typeof j === "object" && "error" in j) {
                const e = (j as any).error;
                if (typeof e === "string") serverMessage = e;
              }
            }
          } catch {
            // ignore
          }

          if (statusCode === 401) {
            await supabase.auth.signOut();
            navigate(`/login?next=${next}`, { replace: true });
            return;
          }

          const msg = serverMessage || anyErr?.message || "";
          if (statusCode === 410 || /expired/i.test(msg)) {
            setError("This invite has expired.");
          } else if (statusCode === 404 || /not found/i.test(msg)) {
            setError("This invite link is invalid.");
          } else if (statusCode === 409 || /already accepted/i.test(msg)) {
            setError("This invite was already accepted.");
          } else if (statusCode === 403) {
            setError(msg || "We couldn't accept this invite.");
          } else {
            setError("We couldn't accept this invite. Please try again.");
          }

          setStatus("Invite failed");
          return;
        }

        navigate("/app?joined=1", { replace: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/expired/i.test(msg)) setError("This invite has expired.");
        else if (/not found|invalid/i.test(msg))
          setError("This invite link is invalid.");
        else if (/already accepted/i.test(msg))
          setError("This invite was already accepted.");
        else setError("We couldn't accept this invite. Please try again.");
        setStatus("Invite failed");
      }
    })();
  }, [location.search, navigate]);

  return (
    <div className="p-6 space-y-6">
      <AppHeader />

      <div className="max-w-lg rounded-xl border p-6 space-y-2">
        <div className="text-lg font-semibold">Join household</div>
        <div className="text-sm text-gray-700">{status}</div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}
