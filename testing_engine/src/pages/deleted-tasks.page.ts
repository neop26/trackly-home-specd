/**
 * Deleted Tasks Page Object
 * 
 * Handles interactions with the deleted tasks view.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DeletedTasksPage extends BasePage {
  readonly selectors = {
    deletedTasksList: '[data-testid="deleted-tasks-list"]',
    deletedTaskItem: '[data-testid="deleted-task-item"]',
    restoreButton: 'button:has-text("Restore")',
    permanentDeleteButton: 'button:has-text("Permanently Delete"), button:has-text("Delete Forever")',
    emptyState: '[data-testid="empty-state"]',
    confirmDialog: '[role="alertdialog"]',
    confirmButton: 'button:has-text("Delete Forever")',
    cancelButton: 'button:has-text("Cancel")',
    accessDenied: ':has-text("Access Denied"), :has-text("Permission")',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to deleted tasks view
   */
  async navigateToDeletedTasks(): Promise<void> {
    await this.goto('/deleted-tasks');
    await this.waitForPageLoad();
  }

  /**
   * Get deleted task by title
   */
  getDeletedTaskByTitle(title: string): Locator {
    return this.page.locator(this.selectors.deletedTaskItem).filter({ hasText: title });
  }

  /**
   * Restore a deleted task
   */
  async restoreTask(title: string): Promise<void> {
    const task = this.getDeletedTaskByTitle(title);
    await task.locator(this.selectors.restoreButton).click();
    await this.waitForToast('restored');
  }

  /**
   * Permanently delete a task
   */
  async permanentlyDeleteTask(title: string): Promise<void> {
    const task = this.getDeletedTaskByTitle(title);
    await task.locator(this.selectors.permanentDeleteButton).click();

    // Confirm
    await this.page.waitForSelector(this.selectors.confirmDialog);
    await this.page.click(this.selectors.confirmButton);
    await this.waitForToast('permanently deleted');
  }

  /**
   * Cancel permanent delete
   */
  async cancelPermanentDelete(): Promise<void> {
    await this.page.click(this.selectors.cancelButton);
    await this.page.waitForSelector(this.selectors.confirmDialog, { state: 'hidden' });
  }

  /**
   * Get deleted task count
   */
  async getDeletedTaskCount(): Promise<number> {
    return await this.page.locator(this.selectors.deletedTaskItem).count();
  }

  /**
   * Check if access is denied
   */
  async isAccessDenied(): Promise<boolean> {
    return await this.page.locator(this.selectors.accessDenied).isVisible();
  }

  // ============ ASSERTIONS ============

  /**
   * Assert deleted task is visible
   */
  async assertDeletedTaskVisible(title: string): Promise<void> {
    const task = this.getDeletedTaskByTitle(title);
    await expect(task).toBeVisible();
  }

  /**
   * Assert deleted task is not visible
   */
  async assertDeletedTaskNotVisible(title: string): Promise<void> {
    const task = this.getDeletedTaskByTitle(title);
    await expect(task).not.toBeVisible();
  }

  /**
   * Assert empty state
   */
  async assertEmptyState(): Promise<void> {
    await this.assertVisible(this.selectors.emptyState);
  }

  /**
   * Assert access denied
   */
  async assertAccessDenied(): Promise<void> {
    const denied = await this.isAccessDenied();
    expect(denied).toBe(true);
  }
}
