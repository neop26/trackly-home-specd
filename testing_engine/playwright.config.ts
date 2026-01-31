import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const CI = !!process.env.CI;

export default defineConfig({
  // Test directory
  testDir: './src/specs',

  // Test file pattern
  testMatch: '**/*.spec.ts',

  // Timeout for each test
  timeout: 60_000,

  // Timeout for expect assertions
  expect: {
    timeout: 10_000,
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: CI,

  // Retry on CI only
  retries: CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: CI ? 2 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/json/results.json' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['list'],
    // Custom reporter for checklist tracking
    ['./src/utils/checklist-reporter.ts'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL
    baseURL: BASE_URL,

    // Use stored auth state
    storageState: './config/storage-state.json',

    // Collect trace when retrying a failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Action timeout
    actionTimeout: 15_000,

    // Navigation timeout
    navigationTimeout: 30_000,

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  // Projects for different browsers and devices
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'reports/test-results',

  // Global setup/teardown
  globalSetup: './src/fixtures/global-setup.ts',
  globalTeardown: './src/fixtures/global-teardown.ts',

  // Web server configuration for local testing
  webServer: process.env.START_SERVER === 'true' ? {
    command: 'cd ../apps/web && npm run dev',
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 120_000,
  } : undefined,
});
