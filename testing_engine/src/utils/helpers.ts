/**
 * Test Helpers
 * 
 * Utility functions for test operations.
 */

import { Page, BrowserContext } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get Supabase client for direct database operations
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseClient = createClient(url, key);
  }

  return supabaseClient;
}

/**
 * Wait for element with custom retry logic
 */
export async function waitForElementWithRetry(
  page: Page,
  selector: string,
  options: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<boolean> {
  const { timeout = 5000, retries = 3, retryDelay = 1000 } = options;

  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      return true;
    } catch {
      if (i < retries - 1) {
        await page.waitForTimeout(retryDelay);
      }
    }
  }

  return false;
}

/**
 * Clear all local storage
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Clear all session storage
 */
export async function clearSessionStorage(page: Page): Promise<void> {
  await page.evaluate(() => sessionStorage.clear());
}

/**
 * Clear all browser storage
 */
export async function clearAllStorage(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  const pages = context.pages();
  for (const page of pages) {
    await clearLocalStorage(page);
    await clearSessionStorage(page);
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `reports/screenshots/${name}-${timestamp}.png`;
  await page.screenshot({ path });
  return path;
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // Network might not become fully idle, continue anyway
  }
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Get all console errors during a test
 */
export function setupConsoleErrorCapture(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Simulate slow network
 */
export async function simulateSlowNetwork(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 500 * 1024 / 8, // 500 kbps
    uploadThroughput: 500 * 1024 / 8,
    latency: 500,
  });
}

/**
 * Restore normal network
 */
export async function restoreNetwork(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
}

/**
 * Generate unique identifier
 */
export function generateUniqueId(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Format date for input field
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse date from display text
 */
export function parseDateFromDisplay(text: string): Date | null {
  try {
    return new Date(text);
  } catch {
    return null;
  }
}
