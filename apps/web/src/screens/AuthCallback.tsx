import { useEffect, useState } from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { upsertProfile } from "../services/profile";

export default function AuthCallback() {
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // If your project uses PKCE, magic links land here with ?code=...
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError) throw exchangeError;
        }

        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;

        if (!user) {
          nav("/login", { replace: true });
          return;
        }

        await upsertProfile(user);

        const urlNext = new URL(window.location.href).searchParams.get("next");
        const storedNext = localStorage.getItem("trackly_next");
        const next = storedNext || urlNext || "/app";
        if (storedNext) localStorage.removeItem("trackly_next");

        nav(next, { replace: true });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [nav]);

  return (
    <Box p={6}>
      <Heading size="lg">Signing you in…</Heading>
      {error && <Text mt={3} fontSize="sm" color="red.600">{error}</Text>}
    </Box>
  );
}
