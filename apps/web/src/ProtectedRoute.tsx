import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import { supabase } from "./lib/supabaseClient";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setAuthed(!!data.session);
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return <Box p={6}><Text>Loading…</Text></Box>;
  if (!authed) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
}
