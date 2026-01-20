import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const next = new URLSearchParams(location.search).get("next") || "/app";

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const s = data.session;
      if (s?.user?.email) setSessionEmail(s.user.email);
    })();
  }, []);

  async function sendMagicLink() {
    setMsg(null);
    setBusy(true);

    try {
      const redirectTo = `${
        window.location.origin
      }/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;
      setMsg("Magic link sent. Check your email.");
    } catch (e) {
      setMsg(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSessionEmail(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4">
        <div>
          <div className="text-xl font-bold">Trackly Home</div>
          <div className="text-sm text-gray-600">Sign in with a magic link</div>
        </div>

        {sessionEmail && (
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-sm">
              You’re already signed in as <b>{sessionEmail}</b>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-lg bg-black px-4 py-2 text-white"
                onClick={() => navigate("/app", { replace: true })}
              >
                Go to app
              </button>
              <button className="rounded-lg border px-4 py-2" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoComplete="email"
          />
        </div>

        <button
          className="w-full rounded-lg bg-black px-4 py-2 text-white"
          onClick={sendMagicLink}
          disabled={busy}
        >
          {busy ? "Sending…" : "Send magic link"}
        </button>

        {msg && <div className="text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  );
}
