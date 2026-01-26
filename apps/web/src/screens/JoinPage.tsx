import { useEffect, useState } from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
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
          const anyErr = res.error as {
            context?: {
              status?: number;
              clone?: () => { json: () => Promise<unknown> };
              json?: () => Promise<unknown>;
            };
            status?: number;
            message?: string;
          };
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
                const e = (j as { error?: unknown }).error;
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
  }, [location.search, location.pathname, navigate]);

  return (
    <VStack p={6} spacing={6} align="stretch">
      <AppHeader />

      <Box maxW="lg" borderWidth={1} borderRadius="xl" p={6}>
        <VStack spacing={2} align="stretch">
          <Heading size="md">Join household</Heading>
          <Text fontSize="sm" color="gray.700">
            {status}
          </Text>
          {error && (
            <Text fontSize="sm" color="red.600">
              {error}
            </Text>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}
