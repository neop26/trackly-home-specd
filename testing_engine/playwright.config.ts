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

  // Retry on CI, local retries for flaky tests
  retries: CI ? 2 : 2,

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
    // === Setup project - runs first to create auth state ===
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },

    // === Authenticated tests (use saved auth state) ===
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './config/storage-state.json',
      },
      dependencies: ['setup'],
      testIgnore: '**/01-authentication.spec.ts', // Auth tests run without auth state
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: './config/storage-state.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: './config/storage-state.json',
      },
      dependencies: ['setup'],
    },

    // === Unauthenticated tests (no auth state - for login page tests) ===
    {
      name: 'chromium-unauth',
      testMatch: '**/01-authentication.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: undefined, // No auth state
      },
    },

    // Mobile devices (authenticated)
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: './config/storage-state.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: './config/storage-state.json',
      },
      dependencies: ['setup'],
    },

    // Tablet (authenticated)
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro 11'],
        storageState: './config/storage-state.json',
      },
      dependencies: ['setup'],
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
