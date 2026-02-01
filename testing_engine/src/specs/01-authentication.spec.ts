/**
 * Authentication & Access Control Tests
 * 
 * Tests for user authentication, session management,
 * and protected routes.
 * 
 * Checklist Section: 1. Authentication & Access Control
 * 
 * NOTE: These tests run WITHOUT authentication state to test the login page.
 * They use the 'chromium-unauth' project which doesn't load storageState.
 */

import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('Authentication & Access Control', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test.describe('Basic Authentication', () => {
    test('should display login page when not authenticated @smoke @critical', async ({ page }) => {
      // Try to access protected route - should redirect to login
      await page.goto('/app');
      await page.waitForURL(/login/);
      await authPage.assertOnLoginPage();
    });

    test('should show email input field on auth page @smoke', async ({ page }) => {
      await authPage.navigateToLogin();
      await authPage.assertEmailInputVisible();
    });

    test('should show sign in options on login page @smoke', async ({ page }) => {
      await authPage.navigateToLogin();
      
      // Should show Google sign in button
      await expect(page.locator(authPage.selectors.googleButton)).toBeVisible();
      
      // Should show magic link form
      await expect(page.locator(authPage.selectors.magicLinkForm)).toBeVisible();
    });

    test('should protect routes when not logged in @critical', async ({ page }) => {
      // Try to access protected routes - all should redirect to login
      const protectedRoutes = ['/app', '/setup'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        // Should redirect to login
        await page.waitForURL(/login/, { timeout: 10000 });
      }
    });
  });

  test.describe('Magic Link Authentication', () => {
    test('should show magic link option on login page @smoke', async ({ page }) => {
      await authPage.navigateToLogin();
      await authPage.assertMagicLinkOptionVisible();
    });

    test('should require valid email format @smoke', async ({ page }) => {
      await authPage.navigateToLogin();
      
      // The email input has type="email" which provides browser validation
      const emailInput = page.locator(authPage.selectors.emailInput);
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should show confirmation after sending magic link @smoke', async ({ page }) => {
      await authPage.navigateToLogin();
      
      // Enter a test email
      await page.fill(authPage.selectors.emailInput, 'test@example.com');
      await page.click(authPage.selectors.magicLinkButton);
      
      // Should show confirmation message
      await authPage.assertMagicLinkSent();
    });
  });

  test.describe('Household Setup', () => {
    test('should display household name in header after setup @smoke', async ({ page }) => {
      // This test needs authenticated state - skip in unauthenticated project
      test.skip(true, 'Requires authenticated session - tested in authenticated project');
    });
  });
});
