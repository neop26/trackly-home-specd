import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * Centralized routing guard for onboarding and authentication flows.
 * 
 * Routing Rules:
 * 1. Unauthenticated users → /login (with ?next= for deep linking)
 * 2. Authenticated + no household → /setup (unless on /join with token)
 * 3. Authenticated + has household → /app
 * 4. /join?token=xyz → allow regardless of household status
 * 
 * @returns {object} - { redirect: string | null, isLoading: boolean }
 * - redirect: Target route to redirect to, or null if user can stay on current page
 * - isLoading: True while checking auth/household status
 */
export function useRouteGuard() {
  const [redirect, setRedirect] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Check authentication
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        const currentPath = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        const hasInviteToken = searchParams.has("token");

        // Rule 1: Not authenticated → redirect to /login
        if (!user) {
          if (currentPath === "/login" || currentPath === "/auth/callback") {
            // Already on login/callback, no redirect needed
            if (mounted) {
              setRedirect(null);
              setIsLoading(false);
            }
            return;
          }

          // Preserve current path for post-login redirect
          const next = encodeURIComponent(currentPath + location.search);
          if (mounted) {
            setRedirect(`/login?next=${next}`);
            setIsLoading(false);
          }
          return;
        }

        // User is authenticated - check onboarding status and household
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_status")
          .eq("user_id", user.id)
          .maybeSingle();

        // Check household membership
        const { data: membership } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        const onboardingStatus = profile?.onboarding_status || "new";
        const hasHousehold = !!membership?.household_id;

        // Rule 4: Allow /join page with token regardless of household status
        if (currentPath === "/join" && hasInviteToken) {
          if (mounted) {
            setRedirect(null);
            setIsLoading(false);
          }
          return;
        }

        // Rule 2: Authenticated but no household → /setup
        if (!hasHousehold && onboardingStatus !== "in_household") {
          if (currentPath === "/setup" || currentPath === "/auth/callback") {
            // Already on setup/callback, no redirect needed
            if (mounted) {
              setRedirect(null);
              setIsLoading(false);
            }
            return;
          }

          if (mounted) {
            setRedirect("/setup");
            setIsLoading(false);
          }
          return;
        }

        // Rule 3: Has household → should be on /app (prevent duplicate household)
        if (hasHousehold || onboardingStatus === "in_household") {
          if (currentPath === "/setup") {
            // Has household but trying to access /setup → redirect to /app
            if (mounted) {
              setRedirect("/app");
              setIsLoading(false);
            }
            return;
          }

          if (currentPath === "/login") {
            // Already has household, logged in, on login page → go to app
            if (mounted) {
              setRedirect("/app");
              setIsLoading(false);
            }
            return;
          }

          // On /app or other valid page with household - no redirect
          if (mounted) {
            setRedirect(null);
            setIsLoading(false);
          }
          return;
        }

        // Default: no redirect
        if (mounted) {
          setRedirect(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Route guard error:", error);
        // On error, default to safe state (no redirect, loading false)
        if (mounted) {
          setRedirect(null);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [location.pathname, location.search]);

  return { redirect, isLoading };
}
