/**
 * Authentication Page Object
 * 
 * Handles all authentication-related interactions.
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AuthPage extends BasePage {
  // Selectors
  readonly selectors = {
    emailInput: 'input[type="email"], input[name="email"]',
    passwordInput: 'input[type="password"], input[name="password"]',
    signInButton: 'button:has-text("Sign In"), button:has-text("Sign in")',
    signOutButton: 'button:has-text("Sign Out"), button:has-text("Sign out")',
    magicLinkButton: 'button:has-text("Send Magic Link")',
    errorMessage: '[role="alert"], .error-message',
    loadingSpinner: '[role="progressbar"], .chakra-spinner',
    profileMenu: '[data-testid="profile-menu"], button:has-text("Profile")',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to auth page
   */
  async navigateToAuth(): Promise<void> {
    await this.goto('/auth');
    await this.waitForPageLoad();
  }

  /**
   * Sign in with email (magic link)
   */
  async signInWithMagicLink(email: string): Promise<void> {
    await this.fillInput(this.selectors.emailInput, email);
    await this.page.click(this.selectors.magicLinkButton);
    await this.waitForToast('Magic link sent');
  }

  /**
   * Sign in with email and password (if supported)
   */
  async signInWithPassword(email: string, password: string): Promise<void> {
    await this.fillInput(this.selectors.emailInput, email);
    await this.fillInput(this.selectors.passwordInput, password);
    await this.page.click(this.selectors.signInButton);
    await this.waitForPageLoad();
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    // Try to find sign out button directly or in menu
    const signOutBtn = this.page.locator(this.selectors.signOutButton);
    
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
    } else {
      // Try profile menu first
      const profileMenu = this.page.locator(this.selectors.profileMenu);
      if (await profileMenu.isVisible()) {
        await profileMenu.click();
        await signOutBtn.click();
      }
    }

    await this.waitForPageLoad();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check for presence of authenticated UI elements
      const signOutBtn = this.page.locator(this.selectors.signOutButton);
      const profileMenu = this.page.locator(this.selectors.profileMenu);
      
      return (await signOutBtn.isVisible()) || (await profileMenu.isVisible());
    } catch {
      return false;
    }
  }

  /**
   * Assert user is on auth page
   */
  async assertOnAuthPage(): Promise<void> {
    await this.assertUrlContains('/auth');
  }

  /**
   * Assert user is signed in
   */
  async assertSignedIn(): Promise<void> {
    const isAuth = await this.isAuthenticated();
    expect(isAuth).toBe(true);
  }

  /**
   * Assert user is signed out
   */
  async assertSignedOut(): Promise<void> {
    await this.assertOnAuthPage();
  }

  /**
   * Get authentication error message
   */
  async getErrorMessage(): Promise<string> {
    const error = this.page.locator(this.selectors.errorMessage);
    if (await error.isVisible()) {
      return (await error.textContent()) || '';
    }
    return '';
  }

  /**
   * Wait for redirect after authentication
   */
  async waitForAuthRedirect(): Promise<void> {
    await this.page.waitForURL(url => !url.pathname.includes('/auth'), {
      timeout: 30000,
    });
  }

  /**
   * Authenticate via Supabase API (for test setup)
   * Uses stored session to skip UI login
   */
  async authenticateViaApi(email: string, accessToken: string): Promise<void> {
    await this.page.evaluate(({ token }) => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: token,
          token_type: 'bearer',
        },
      }));
    }, { token: accessToken });

    await this.page.reload();
    await this.waitForPageLoad();
  }
}
