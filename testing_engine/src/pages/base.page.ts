/**
 * Base Page Object
 * 
 * Abstract base class for all page objects.
 * Provides common functionality and patterns.
 */

import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || 'http://localhost:5173';
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * Click element with retry
   */
  async clickWithRetry(selector: string, retries: number = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.click(selector);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Fill input with clear
   */
  async fillInput(selector: string, value: string): Promise<void> {
    const input = this.page.locator(selector);
    await input.clear();
    await input.fill(value);
  }

  /**
   * Get text content from element
   */
  async getText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    return (await element.textContent()) || '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `reports/screenshots/${name}.png` });
  }

  /**
   * Assert page URL contains path
   */
  async assertUrlContains(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Assert element has text
   */
  async assertText(selector: string, expectedText: string): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  /**
   * Assert element is visible
   */
  async assertVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /**
   * Assert element is not visible
   */
  async assertNotVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(text?: string): Promise<void> {
    const toast = this.page.locator('[role="alert"], .chakra-toast');
    await toast.waitFor({ state: 'visible' });
    if (text) {
      await expect(toast).toContainText(text);
    }
  }

  /**
   * Dismiss toast notification
   */
  async dismissToast(): Promise<void> {
    const closeButton = this.page.locator('[role="alert"] button[aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}
