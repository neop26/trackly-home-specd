import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
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
    <VStack p={6} spacing={6} align="stretch">
      <AppHeader />

      <Box maxW="lg" borderWidth={1} borderRadius="xl" p={6}>
        <VStack spacing={4} align="stretch">
          <Box>
            <Heading size="md">Set up your household</Heading>
            <Text fontSize="sm" color="gray.600">
              Create your home space to coordinate with your partner.
            </Text>
          </Box>

          <FormControl>
            <FormLabel htmlFor="household" fontSize="sm" fontWeight="medium">
              Household name
            </FormLabel>
            <Input
              id="household"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>

          {error && (
            <Text fontSize="sm" color="red.600">
              {error}
            </Text>
          )}

          <Button
            w="full"
            colorScheme="blackAlpha"
            bg="black"
            color="white"
            onClick={createHousehold}
            isDisabled={busy}
          >
            {busy ? "Creating…" : "Create household"}
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
}
