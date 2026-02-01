/**
 * Supabase Auth Helper
 * 
 * Handles authentication for E2E tests by using Supabase Admin API
 * to create sessions directly, bypassing magic link flow.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Page, BrowserContext } from '@playwright/test';

export interface AuthConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  supabaseAnonKey: string;
}

export interface TestUserSession {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

let adminClient: SupabaseClient | null = null;

/**
 * Get Supabase admin client (service role)
 */
export function getAdminClient(config: AuthConfig): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}

/**
 * Create or get a test user and generate a valid session
 * This bypasses the magic link flow entirely
 */
export async function createTestUserSession(
  config: AuthConfig,
  email: string
): Promise<TestUserSession> {
  const admin = getAdminClient(config);

  // First, try to get existing user
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  let user = existingUsers?.users?.find(u => u.email === email);

  if (!user) {
    // Create user if doesn't exist
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: `Test User ${email.split('@')[0]}`,
      },
    });

    if (createError) {
      throw new Error(`Failed to create test user: ${createError.message}`);
    }
    user = newUser.user;
  }

  if (!user) {
    throw new Error('Failed to get or create user');
  }

  // Generate a magic link (we'll extract the token)
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (linkError || !linkData) {
    throw new Error(`Failed to generate link: ${linkError?.message}`);
  }

  // The generateLink returns token info we can use
  // We need to verify the OTP to get a session
  const { data: sessionData, error: sessionError } = await admin.auth.verifyOtp({
    email,
    token: linkData.properties?.hashed_token || '',
    type: 'email',
  });

  // Alternative approach: Use admin API to create session directly
  // by impersonating the user (Supabase doesn't have direct API for this)
  // We'll use the magic link token approach

  // Actually, let's use a simpler approach - generate link and extract tokens
  const actionLink = linkData.properties?.action_link;
  
  if (!actionLink) {
    // Fallback: Create a session via signInWithPassword if we have test credentials
    // Or use the impersonation approach
    throw new Error('Could not generate action link');
  }

  // Parse the token from the action link
  const url = new URL(actionLink);
  const token = url.searchParams.get('token') || url.hash.match(/access_token=([^&]+)/)?.[1];

  return {
    userId: user.id,
    email: user.email || email,
    accessToken: token || '',
    refreshToken: '',
  };
}

/**
 * Alternative: Sign in by directly setting the session in localStorage
 * This is the most reliable approach for E2E testing
 */
export async function authenticateWithAdminSession(
  page: Page,
  config: AuthConfig,
  email: string
): Promise<TestUserSession> {
  const admin = getAdminClient(config);

  // Get or create user
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  let user = existingUsers?.users?.find(u => u.email === email);

  if (!user) {
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error) throw new Error(`Create user failed: ${error.message}`);
    user = newUser.user;
  }

  if (!user) throw new Error('No user found');

  // Generate magic link and extract token
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: config.supabaseUrl,
    },
  });

  if (linkError) throw new Error(`Generate link failed: ${linkError.message}`);

  // Navigate to the magic link directly
  const actionLink = linkData.properties?.action_link;
  
  if (actionLink) {
    // Go to the app first
    await page.goto('/');
    
    // Then navigate to the magic link to authenticate
    await page.goto(actionLink);
    
    // Wait for redirect back to app
    await page.waitForURL(url => !url.href.includes('supabase'), { timeout: 10000 });
  }

  return {
    userId: user.id,
    email: user.email || email,
    accessToken: '',
    refreshToken: '',
  };
}

/**
 * Set authentication state directly in browser storage
 * Most reliable method for E2E tests
 */
export async function setAuthState(
  page: Page,
  context: BrowserContext,
  session: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
    };
    expires_at?: number;
  }
): Promise<void> {
  const storageKey = 'sb-localhost-auth-token'; // Adjust based on your Supabase URL
  
  const sessionData = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
    user: session.user,
  };

  await page.evaluate(({ key, data }) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, { key: storageKey, data: sessionData });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    // Check for Supabase session in localStorage
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.includes('auth-token') || k.includes('supabase'));
    if (!authKey) return false;
    
    try {
      const session = JSON.parse(localStorage.getItem(authKey) || '{}');
      return !!session.access_token;
    } catch {
      return false;
    }
  });
}

/**
 * Clear authentication state
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('auth') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
  });
}
