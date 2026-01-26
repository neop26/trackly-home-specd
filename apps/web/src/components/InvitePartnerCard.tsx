import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
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

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  const canShare = useMemo(
    () => typeof navigator !== "undefined" && "share" in navigator,
    []
  );

  if (!isAdmin) {
    return (
      <Box borderWidth={1} borderRadius="lg" p={4}>
        <VStack spacing={3} align="stretch">
          <Box>
            <Heading size="sm">Invite partner</Heading>
            <Text fontSize="sm" color="gray.600">
              Only admins can invite members to the household.
            </Text>
          </Box>
        </VStack>
      </Box>
    );
  }

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
    <Box borderWidth={1} borderRadius="lg" p={4}>
      <VStack spacing={3} align="stretch">
        <Box>
          <Heading size="sm">Invite partner</Heading>
          <Text fontSize="sm" color="gray.600">
            Send an invite email (Resend) and we'll also give you a shareable
            link.
          </Text>
        </Box>

        <FormControl>
          <FormLabel htmlFor="invite-email" fontSize="sm" fontWeight="medium">
            Partner email
          </FormLabel>

          <Flex gap={2}>
            <Input
              id="invite-email"
              aria-label="Partner email"
              flex={1}
              placeholder="partner@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />

            <Button
              colorScheme="blackAlpha"
              bg="black"
              color="white"
              onClick={sendInvite}
              isDisabled={busy}
            >
              {busy ? "Sending..." : "Invite"}
            </Button>
          </Flex>
        </FormControl>

        {error && (
          <Text fontSize="sm" color="red.600">
            {error}
          </Text>
        )}

        {inviteUrl && (
          <Box borderWidth={1} borderRadius="lg" p={3}>
            <VStack spacing={2} align="stretch">
              <Text fontSize="sm">
                {emailSent
                  ? "Email sent ✅"
                  : "Email not sent (share link below) ⚠️"}
              </Text>

              <Text fontSize="xs" color="gray.600">
                Invite link (copied to clipboard):
              </Text>

              <Flex align="center" gap={2}>
                <Input
                  aria-label="Invite link"
                  flex={1}
                  fontSize="sm"
                  value={inviteUrl}
                  readOnly
                />

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy(inviteUrl)}
                >
                  Copy
                </Button>

                {canShare && (
                  <Button size="sm" variant="outline" onClick={shareInvite}>
                    Share
                  </Button>
                )}
              </Flex>

              <Text fontSize="xs" color="gray.500">
                Tip: Share via WhatsApp/SMS if email delivery is slow.
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
