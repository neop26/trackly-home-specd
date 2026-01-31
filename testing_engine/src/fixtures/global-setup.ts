/**
 * Global Setup
 * 
 * Runs once before all tests.
 * Sets up authentication state and test data.
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const STORAGE_STATE_PATH = path.resolve(__dirname, '../../config/storage-state.json');

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('\n🚀 Running global setup...\n');

  // Create config directory if it doesn't exist
  const configDir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Skip browser setup in CI if storage state exists
  if (process.env.CI && fs.existsSync(STORAGE_STATE_PATH)) {
    console.log('✅ Using existing storage state in CI\n');
    return;
  }

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:5173';

    // Navigate to the application
    await page.goto(baseURL);
    console.log(`📍 Navigated to: ${baseURL}`);

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // If authentication is needed, perform it here
    // For now, we'll just save the initial state
    if (process.env.TEST_USER_EMAIL && process.env.TEST_AUTH_TOKEN) {
      console.log('🔐 Setting up authenticated session...');
      
      // Inject auth token into localStorage
      await page.evaluate(({ token }) => {
        // Adjust based on your auth implementation
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: { access_token: token },
        }));
      }, { token: process.env.TEST_AUTH_TOKEN });

      await page.reload();
      await page.waitForLoadState('networkidle');
    }

    // Save storage state
    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log(`💾 Saved storage state to: ${STORAGE_STATE_PATH}`);

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('\n✅ Global setup complete!\n');
}

export default globalSetup;
