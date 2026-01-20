import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [params] = useSearchParams();
  const next = params.get("next") || "/app";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function persistNext() {
    localStorage.setItem("trackly_next", next);
  }

  async function signInWithGoogle() {
    setError(null);
    persistNext();

    const redirectTo = new URL(
      "/auth/callback",
      window.location.origin
    ).toString();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) setError(error.message);
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    persistNext();

    const redirectTo = new URL(
      "/auth/callback",
      window.location.origin
    ).toString();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border p-6">
        <h1 className="text-2xl font-bold">Trackly Home</h1>
        <p className="text-sm text-gray-600">Sign in to continue</p>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          onClick={signInWithGoogle}
          className="w-full rounded-lg bg-black px-4 py-2 text-white"
        >
          Continue with Google
        </button>

        <div className="text-center text-xs text-gray-500">or</div>

        <form onSubmit={sendMagicLink} className="space-y-3">
          <input
            className="w-full rounded-lg border px-3 py-2"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="w-full rounded-lg border px-4 py-2" type="submit">
            Send magic link
          </button>
        </form>

        {sent && (
          <div className="text-sm text-green-700">
            Magic link sent. Check your email (or Mailpit/Inbucket if local).
          </div>
        )}
      </div>
    </div>
  );
}
