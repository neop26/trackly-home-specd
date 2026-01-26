import { Flex, Heading, Button, Box, Text } from "@chakra-ui/react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

type Props = {
  title?: string;
  subtitleLines?: string[];
  role?: string;
};

export default function AppHeader({
  title = "Trackly Home",
  subtitleLines = [],
  role,
}: Props) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <Flex alignItems="flex-start" justifyContent="space-between" gap={4}>
      <Box>
        <Heading size="lg">{title}</Heading>
        {role && (
          <Text fontSize="sm" color="gray.600" textTransform="capitalize">
            Role: {role}
          </Text>
        )}
        {subtitleLines.map((l) => (
          <Text key={l} fontSize="sm" color="gray.600">
            {l}
          </Text>
        ))}
      </Box>

      <Button variant="outline" onClick={signOut}>
        Sign out
      </Button>
    </Flex>
  );
}
