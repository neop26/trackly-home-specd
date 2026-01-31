/**
 * Authentication Page Object
 * 
 * Handles all authentication-related interactions.
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AuthPage extends BasePage {
  // Selectors - using data-testid for stability
  readonly selectors = {
    loginPage: '[data-testid="login-page"]',
    emailInput: '[data-testid="email-input"]',
    magicLinkButton: '[data-testid="magic-link-btn"]',
    magicLinkForm: '[data-testid="magic-link-form"]',
    magicLinkSent: '[data-testid="magic-link-sent"]',
    googleButton: '[data-testid="google-signin-btn"]',
    signOutButton: '[data-testid="signout-btn"]',
    errorMessage: '[data-testid="auth-error"]',
    loadingSpinner: '.chakra-spinner',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Sign in with email (magic link)
   */
  async signInWithMagicLink(email: string): Promise<void> {
    await this.page.fill(this.selectors.emailInput, email);
    await this.page.click(this.selectors.magicLinkButton);
    // Wait for confirmation message
    await this.page.waitForSelector(this.selectors.magicLinkSent, { timeout: 10000 });
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    const signOutBtn = this.page.locator(this.selectors.signOutButton);
    
    if (await signOutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signOutBtn.click();
      await this.waitForPageLoad();
    }
  }

  /**
   * Check if user is authenticated (sign out button visible)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const signOutBtn = this.page.locator(this.selectors.signOutButton);
      return await signOutBtn.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  /**
   * Assert user is on login page
   */
  async assertOnLoginPage(): Promise<void> {
    await expect(this.page.locator(this.selectors.loginPage)).toBeVisible();
  }

  /**
   * Assert email input is visible
   */
  async assertEmailInputVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.emailInput)).toBeVisible();
  }

  /**
   * Assert magic link option is available
   */
  async assertMagicLinkOptionVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.magicLinkButton)).toBeVisible();
  }

  /**
   * Assert magic link was sent
   */
  async assertMagicLinkSent(): Promise<void> {
    await expect(this.page.locator(this.selectors.magicLinkSent)).toBeVisible();
  }

  /**
   * Assert sign out button is visible (user is authenticated)
   */
  async assertSignOutVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.signOutButton)).toBeVisible();
  }

  /**
   * Get authentication error message
   */
  async getErrorMessage(): Promise<string> {
    const error = this.page.locator(this.selectors.errorMessage);
    if (await error.isVisible({ timeout: 3000 }).catch(() => false)) {
      return (await error.textContent()) || '';
    }
    return '';
  }

  /**
   * Wait for redirect after authentication
   */
  async waitForAuthRedirect(): Promise<void> {
    await this.page.waitForURL(url => !url.pathname.includes('/login'), {
      timeout: 30000,
    });
  }
}
