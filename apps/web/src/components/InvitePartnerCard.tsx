import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  householdId: string;
  householdName?: string;
  userRole?: string;
};

export default function InvitePartnerCard({
  householdId,
  householdName,
  userRole,
}: Props) {
  const isAdmin = userRole && ["owner", "admin"].includes(userRole);

  if (!isAdmin) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <div>
          <div className="font-semibold">Invite partner</div>
          <div className="text-sm text-gray-600">
            Only admins can invite members to the household.
          </div>
        </div>
      </div>
    );
  }
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  const canShare = useMemo(
    () => typeof navigator !== "undefined" && "share" in navigator,
    []
  );

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  async function sendInvite() {
    setError(null);
    setInviteUrl(null);
    setEmailSent(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter an email address.");
      return;
    }

    setBusy(true);
    try {
      const res = await supabase.functions.invoke("create-invite", {
        body: { household_id: householdId, email: trimmed },
      });

      if (res.error) {
        setError(res.error.message);
        return;
      }

      const url = (res.data?.invite_url as string | undefined) ?? null;
      const sent = (res.data?.email_sent as boolean | undefined) ?? false;

      setInviteUrl(url);
      setEmailSent(sent);

      if (url) await copy(url);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function shareInvite() {
    if (!inviteUrl) return;

    const title = "Trackly Home invite";
    const text = householdName
      ? `Join my Trackly Home household: ${householdName}`
      : "Join my Trackly Home household";

    const navAny = navigator as Navigator & {
      share?: (data: {
        title?: string;
        text?: string;
        url?: string;
      }) => Promise<void>;
    };
    if (navAny.share) {
      await navAny.share({ title, text, url: inviteUrl });
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <div className="font-semibold">Invite partner</div>
        <div className="text-sm text-gray-600">
          Send an invite email (Resend) and we’ll also give you a shareable
          link.
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="invite-email" className="text-sm font-medium">
          Partner email
        </label>

        <div className="flex gap-2">
          <input
            id="invite-email"
            aria-label="Partner email"
            className="flex-1 rounded-lg border px-3 py-2"
            placeholder="partner@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />

          <button
            className="rounded-lg bg-black px-4 py-2 text-white"
            onClick={sendInvite}
            disabled={busy}
          >
            {busy ? "Sending..." : "Invite"}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {inviteUrl && (
        <div className="space-y-2 rounded-lg border p-3">
          <div className="text-sm">
            {emailSent
              ? "Email sent ✅"
              : "Email not sent (share link below) ⚠️"}
          </div>

          <div className="text-xs text-gray-600">
            Invite link (copied to clipboard):
          </div>

          <div className="flex items-center gap-2">
            <input
              aria-label="Invite link"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              value={inviteUrl}
              readOnly
            />

            <button
              className="rounded-lg border px-3 py-2 text-sm"
              onClick={() => copy(inviteUrl)}
            >
              Copy
            </button>

            {canShare && (
              <button
                className="rounded-lg border px-3 py-2 text-sm"
                onClick={shareInvite}
              >
                Share
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Tip: Share via WhatsApp/SMS if email delivery is slow.
          </div>
        </div>
      )}
    </div>
  );
}
