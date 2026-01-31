/**
 * Authentication & Access Control Tests
 * 
 * Tests for user authentication, session management,
 * and protected routes.
 * 
 * Checklist Section: 1. Authentication & Access Control
 */

import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { testUsers, testConstants } from '../fixtures/test-data';

test.describe('Authentication & Access Control', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test.describe('Basic Authentication', () => {
    test('should display login page when not authenticated @smoke @critical', async ({ page }) => {
      await page.goto('/dashboard');
      await authPage.assertOnAuthPage();
    });

    test('should show email input field on auth page @smoke', async ({ page }) => {
      await authPage.navigateToAuth();
      await authPage.assertVisible(authPage.selectors.emailInput);
    });

    test('should maintain session after page refresh @critical', async ({ page, context }) => {
      // This test requires pre-authenticated state
      test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authenticated session');

      await page.goto('/dashboard');
      await authPage.waitForPageLoad();

      // Verify authenticated state
      const isAuth = await authPage.isAuthenticated();
      expect(isAuth).toBe(true);

      // Refresh page
      await page.reload();
      await authPage.waitForPageLoad();

      // Verify still authenticated
      const stillAuth = await authPage.isAuthenticated();
      expect(stillAuth).toBe(true);
    });

    test('should sign out successfully @smoke @critical', async ({ page }) => {
      test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authenticated session');

      await page.goto('/dashboard');
      await authPage.waitForPageLoad();

      // Sign out
      await authPage.signOut();

      // Should be on auth page
      await authPage.assertOnAuthPage();
    });

    test('should protect routes when not logged in @critical', async ({ page }) => {
      // Try to access protected routes
      const protectedRoutes = ['/dashboard', '/tasks', '/members', '/settings'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await authPage.waitForPageLoad();
        await authPage.assertUrlContains('/auth');
      }
    });
  });

  test.describe('Magic Link Authentication', () => {
    test('should show magic link option on login page @smoke', async ({ page }) => {
      await authPage.navigateToAuth();
      await authPage.assertVisible(authPage.selectors.magicLinkButton);
    });

    test('should validate email format before sending magic link', async ({ page }) => {
      await authPage.navigateToAuth();
      await authPage.fillInput(authPage.selectors.emailInput, 'invalid-email');
      
      const magicLinkBtn = page.locator(authPage.selectors.magicLinkButton);
      // Button should be disabled or show validation error
      // Implementation depends on your validation approach
    });

    test('should show confirmation after sending magic link @smoke', async ({ page }) => {
      test.skip(!process.env.TEST_EMAIL_SERVICE, 'Requires email service');

      await authPage.navigateToAuth();
      await authPage.signInWithMagicLink(testUsers.owner.email);
      await authPage.waitForToast('Magic link sent');
    });
  });

  test.describe('Household Setup', () => {
    test('should require household after authentication @critical', async ({ page }) => {
      test.skip(!process.env.TEST_NEW_USER_TOKEN, 'Requires new user without household');

      // User without household should be redirected to setup
      await page.goto('/dashboard');
      await authPage.waitForPageLoad();

      // Should see household creation flow
      const createHouseholdBtn = page.locator('button:has-text("Create Household")');
      await expect(createHouseholdBtn).toBeVisible();
    });

    test('should display household name in header after setup @smoke', async ({ page }) => {
      test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authenticated session');

      await page.goto('/dashboard');
      await authPage.waitForPageLoad();

      // Should see household name in header
      const header = page.locator('header, [role="banner"]');
      await expect(header).toContainText(/household|home/i);
    });
  });
});
