/**
 * Global Setup
 * 
 * Runs once before all tests.
 * Sets up authentication state using Supabase Admin API
 * to bypass magic link flow.
 */

import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const STORAGE_STATE_PATH = path.resolve(__dirname, '../../config/storage-state.json');
const AUTH_STATE_PATH = path.resolve(__dirname, '../../config/auth-state.json');

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('\n🚀 Running global setup...\n');

  // Create config directory if it doesn't exist
  const configDir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = process.env.TEST_USER_EMAIL || 'e2e-test@trackly.local';
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:5173';

  if (!serviceRoleKey) {
    console.log('⚠️  No SUPABASE_SERVICE_ROLE_KEY - tests will run without pre-authentication');
    return;
  }

  console.log(`📧 Test user: ${testEmail}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🌐 App URL: ${baseURL}`);

  // Create admin client
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Step 1: Get or create test user
    console.log('\n🔐 Setting up test user...');
    
    const { data: users } = await adminClient.auth.admin.listUsers();
    let testUser = users?.users?.find(u => u.email === testEmail);

    if (!testUser) {
      console.log(`   Creating new test user: ${testEmail}`);
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        email_confirm: true,
        user_metadata: {
          display_name: 'E2E Test User',
        },
      });

      if (createError) {
        throw new Error(`Failed to create test user: ${createError.message}`);
      }
      testUser = newUser.user;
      console.log(`   ✅ Created user: ${testUser.id}`);
    } else {
      console.log(`   ✅ Found existing user: ${testUser.id}`);
    }

    // Step 2: Generate magic link for the user
    console.log('\n🔗 Generating authentication link...');
    
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail,
      options: {
        redirectTo: baseURL,
      },
    });

    if (linkError) {
      throw new Error(`Failed to generate magic link: ${linkError.message}`);
    }

    const magicLink = linkData.properties?.action_link;
    console.log(`   ✅ Magic link generated`);

    // Step 3: Launch browser and authenticate
    console.log('\n🌐 Launching browser for authentication...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to magic link to authenticate
    if (magicLink) {
      console.log(`   📍 Navigating to magic link...`);
      await page.goto(magicLink);
      
      // Wait for redirect to app
      await page.waitForURL(url => url.href.includes(baseURL) || url.href.includes('localhost:5173'), {
        timeout: 30000,
      }).catch(() => {
        console.log('   ⚠️  Redirect timeout - continuing anyway');
      });

      // Wait for app to load
      await page.waitForLoadState('networkidle').catch(() => {});
      
      // Check if we landed on the app
      const currentUrl = page.url();
      console.log(`   📍 Current URL: ${currentUrl}`);

      // Give app time to process the auth
      await page.waitForTimeout(2000);
      
      // Step 3b: If on setup page, create a household
      if (currentUrl.includes('/setup')) {
        console.log('\n🏠 Setting up test household...');
        
        // The setup page has an input#household and "Create household" button
        const householdNameInput = page.locator('#household');
        
        if (await householdNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await householdNameInput.clear();
          await householdNameInput.fill('E2E Test Household');
          console.log(`   ✅ Filled household name`);
        }
        
        // Click the "Create household" button
        const createBtn = page.getByRole('button', { name: /create household/i });
        if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await createBtn.click();
          console.log(`   ✅ Clicked Create household button`);
        }
        
        // Wait for navigation to /app
        await page.waitForURL(url => url.href.includes('/app'), {
          timeout: 15000,
        }).catch((e) => {
          console.log(`   ⚠️  Navigation timeout: ${e.message}`);
        });
        
        await page.waitForLoadState('networkidle').catch(() => {});
        console.log(`   📍 After setup URL: ${page.url()}`);
      }
    }

    // Step 4: Save storage state for reuse
    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log(`\n💾 Saved storage state to: ${STORAGE_STATE_PATH}`);

    // Save user info for tests
    const authState = {
      userId: testUser.id,
      email: testUser.email,
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(authState, null, 2));
    console.log(`💾 Saved auth state to: ${AUTH_STATE_PATH}`);

    await browser.close();

  } catch (error) {
    console.error('\n❌ Global setup failed:', error);
    // Don't throw - let tests run and handle auth individually if needed
    console.log('⚠️  Tests will run without pre-authentication\n');
  }

  console.log('\n✅ Global setup complete!\n');
}

export default globalSetup;
