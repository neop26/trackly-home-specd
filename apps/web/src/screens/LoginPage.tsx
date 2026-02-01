import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [params] = useSearchParams();
  const next = params.get("next") || "/app";
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    (async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    })();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  }

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
    <Flex minH="100vh" align="center" justify="center" p={6} data-testid="login-page">
      <Box
        w="full"
        maxW="md"
        borderWidth={1}
        borderRadius="xl"
        p={6}
      >
        <VStack spacing={4} align="stretch">
          <Flex alignItems="flex-start" justifyContent="space-between">
            <Box>
              <Heading size="xl">Trackly Home</Heading>
              <Text fontSize="sm" color="gray.600">
                Sign in to continue
              </Text>
            </Box>

            {isAuthenticated && (
              <Button 
                data-testid="signout-btn"
                size="sm" 
                variant="outline" 
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            )}
          </Flex>

          {error && (
            <Text fontSize="sm" color="red.600" data-testid="auth-error">
              {error}
            </Text>
          )}

          <Button
            data-testid="google-signin-btn"
            w="full"
            colorScheme="blackAlpha"
            bg="black"
            color="white"
            onClick={signInWithGoogle}
          >
            Continue with Google
          </Button>

          <Text fontSize="xs" color="gray.500" textAlign="center">
            or
          </Text>

          <VStack as="form" spacing={3} onSubmit={sendMagicLink} data-testid="magic-link-form">
            <Input
              data-testid="email-input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button 
              data-testid="magic-link-btn"
              w="full" 
              variant="outline" 
              type="submit"
            >
              Send magic link
            </Button>
          </VStack>

          {sent && (
            <Text fontSize="sm" color="green.700" data-testid="magic-link-sent">
              Magic link sent. Check your email (or Mailpit/Inbucket if local).
            </Text>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}
