import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type UserMetadata = {
  full_name?: string;
  name?: string;
  preferred_username?: string;
};

export function getDisplayName(user: User): string {
  const md = user.user_metadata as UserMetadata | undefined;

  return (
    md?.full_name ||
    md?.name ||
    md?.preferred_username ||
    user.email?.split("@")[0] ||
    "User"
  );
}

export async function upsertProfile(user: User) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const payload = {
    user_id: user.id,
    display_name: getDisplayName(user),
    timezone,
    last_login_at: new Date().toISOString(),
    onboarding_status: "new",
  };

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) throw error;
}

export async function upsertProfileOnLogin(user: User) {
  return upsertProfile(user);
}
