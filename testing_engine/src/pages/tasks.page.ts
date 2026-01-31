/**
 * Tasks Page Object
 * 
 * Handles all task-related interactions including
 * CRUD operations, filtering, sorting, and bulk actions.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export interface TaskData {
  title: string;
  assignee?: string;
  dueDate?: string;
  notes?: string;
}

export class TasksPage extends BasePage {
  // Selectors
  readonly selectors = {
    // Task list
    taskList: '[data-testid="task-list"], .task-list',
    taskItem: '[data-testid="task-item"], .task-item',
    taskTitle: '[data-testid="task-title"], .task-title',
    taskCheckbox: 'input[type="checkbox"], .task-checkbox',
    taskEditButton: 'button[aria-label="Edit"], [data-testid="edit-task"]',
    taskDeleteButton: 'button[aria-label="Delete"], [data-testid="delete-task"]',
    emptyState: '[data-testid="empty-state"], .empty-state',

    // Add task
    addTaskInput: '[data-testid="add-task-input"], input[placeholder*="task"]',
    addTaskButton: 'button:has-text("Add"), button:has-text("Create")',

    // Filters
    filterActive: 'button:has-text("Active")',
    filterCompleted: 'button:has-text("Completed")',
    filterAll: 'button:has-text("All")',
    filterMyTasks: 'button:has-text("My Tasks")',
    filterClear: 'button:has-text("Clear")',
    assigneeDropdown: 'select[data-testid="assignee-filter"], .assignee-filter select',
    sortDropdown: 'select[data-testid="sort-by"], .sort-by select',

    // Bulk actions
    selectModeButton: 'button:has-text("Select Mode")',
    exitSelectModeButton: 'button:has-text("Exit")',
    selectAllButton: 'button:has-text("Select All")',
    bulkAssignButton: 'button:has-text("Assign")',
    bulkDeleteButton: 'button:has-text("Delete")',
    selectedCount: '[data-testid="selected-count"], .selected-count',

    // Edit modal
    editModal: '[role="dialog"], .chakra-modal__content',
    editTitleInput: '[data-testid="edit-title"], input[name="title"]',
    editAssigneeSelect: '[data-testid="edit-assignee"], select[name="assignee"]',
    editDueDateInput: '[data-testid="edit-due-date"], input[type="date"]',
    editNotesTextarea: '[data-testid="edit-notes"], textarea[name="notes"]',
    editSaveButton: 'button:has-text("Save")',
    editCancelButton: 'button:has-text("Cancel")',

    // Delete confirmation
    deleteDialog: '[role="alertdialog"]',
    confirmDeleteButton: 'button:has-text("Delete"):not([aria-label])',
    cancelDeleteButton: 'button:has-text("Cancel")',

    // Loading
    loadingSpinner: '.chakra-spinner, [role="progressbar"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to tasks page
   */
  async navigateToTasks(): Promise<void> {
    await this.goto('/dashboard');
    await this.waitForPageLoad();
  }

  // ============ TASK CRUD ============

  /**
   * Create a new task
   */
  async createTask(data: TaskData): Promise<void> {
    await this.fillInput(this.selectors.addTaskInput, data.title);
    
    // If there are additional fields exposed in the add form
    if (data.assignee) {
      const assigneeSelect = this.page.locator(this.selectors.editAssigneeSelect).first();
      if (await assigneeSelect.isVisible()) {
        await assigneeSelect.selectOption({ label: data.assignee });
      }
    }

    await this.page.click(this.selectors.addTaskButton);
    await this.waitForTaskToAppear(data.title);
  }

  /**
   * Wait for a task to appear in the list
   */
  async waitForTaskToAppear(title: string): Promise<void> {
    const task = this.page.locator(this.selectors.taskItem).filter({ hasText: title });
    await task.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get task locator by title
   */
  getTaskByTitle(title: string): Locator {
    return this.page.locator(this.selectors.taskItem).filter({ hasText: title });
  }

  /**
   * Edit an existing task
   */
  async editTask(currentTitle: string, newData: Partial<TaskData>): Promise<void> {
    const task = this.getTaskByTitle(currentTitle);
    await task.locator(this.selectors.taskEditButton).click();

    // Wait for modal
    await this.page.waitForSelector(this.selectors.editModal);

    if (newData.title) {
      await this.fillInput(this.selectors.editTitleInput, newData.title);
    }
    if (newData.assignee) {
      await this.page.selectOption(this.selectors.editAssigneeSelect, { label: newData.assignee });
    }
    if (newData.dueDate) {
      await this.fillInput(this.selectors.editDueDateInput, newData.dueDate);
    }
    if (newData.notes !== undefined) {
      await this.fillInput(this.selectors.editNotesTextarea, newData.notes);
    }

    await this.page.click(this.selectors.editSaveButton);
    await this.page.waitForSelector(this.selectors.editModal, { state: 'hidden' });
  }

  /**
   * Toggle task completion
   */
  async toggleTaskCompletion(title: string): Promise<void> {
    const task = this.getTaskByTitle(title);
    await task.locator(this.selectors.taskCheckbox).click();
  }

  /**
   * Delete a task
   */
  async deleteTask(title: string): Promise<void> {
    const task = this.getTaskByTitle(title);
    await task.locator(this.selectors.taskDeleteButton).click();

    // Confirm deletion
    await this.page.waitForSelector(this.selectors.deleteDialog);
    await this.page.click(this.selectors.confirmDeleteButton);
    await this.page.waitForSelector(this.selectors.deleteDialog, { state: 'hidden' });
  }

  /**
   * Check if task exists
   */
  async taskExists(title: string): Promise<boolean> {
    const task = this.getTaskByTitle(title);
    return await task.isVisible();
  }

  /**
   * Get task count
   */
  async getTaskCount(): Promise<number> {
    return await this.page.locator(this.selectors.taskItem).count();
  }

  /**
   * Get all task titles
   */
  async getAllTaskTitles(): Promise<string[]> {
    const titles = await this.page.locator(this.selectors.taskTitle).allTextContents();
    return titles.map(t => t.trim());
  }

  // ============ FILTERS ============

  /**
   * Filter by status
   */
  async filterByStatus(status: 'active' | 'completed' | 'all'): Promise<void> {
    const selectors = {
      active: this.selectors.filterActive,
      completed: this.selectors.filterCompleted,
      all: this.selectors.filterAll,
    };
    await this.page.click(selectors[status]);
    await this.page.waitForTimeout(500); // Wait for filter to apply
  }

  /**
   * Toggle My Tasks filter
   */
  async toggleMyTasks(): Promise<void> {
    await this.page.click(this.selectors.filterMyTasks);
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter by assignee
   */
  async filterByAssignee(assignee: string): Promise<void> {
    await this.page.selectOption(this.selectors.assigneeDropdown, { label: assignee });
    await this.page.waitForTimeout(500);
  }

  /**
   * Sort tasks
   */
  async sortBy(option: 'due_date' | 'created_at' | 'title' | 'assignee'): Promise<void> {
    await this.page.selectOption(this.selectors.sortDropdown, option);
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    const clearBtn = this.page.locator(this.selectors.filterClear);
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
    await this.filterByStatus('all');
  }

  // ============ BULK ACTIONS ============

  /**
   * Enter selection mode
   */
  async enterSelectionMode(): Promise<void> {
    await this.page.click(this.selectors.selectModeButton);
  }

  /**
   * Exit selection mode
   */
  async exitSelectionMode(): Promise<void> {
    await this.page.click(this.selectors.exitSelectModeButton);
  }

  /**
   * Select a task in selection mode
   */
  async selectTask(title: string): Promise<void> {
    const task = this.getTaskByTitle(title);
    await task.locator(this.selectors.taskCheckbox).click();
  }

  /**
   * Select all visible tasks
   */
  async selectAllTasks(): Promise<void> {
    await this.page.click(this.selectors.selectAllButton);
  }

  /**
   * Get selected task count
   */
  async getSelectedCount(): Promise<number> {
    const countText = await this.getText(this.selectors.selectedCount);
    const match = countText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Bulk assign selected tasks
   */
  async bulkAssign(assignee: string): Promise<void> {
    // Select assignee in bulk action dropdown
    const bulkAssigneeSelect = this.page.locator('select').filter({ hasText: assignee });
    await bulkAssigneeSelect.selectOption({ label: assignee });
    await this.page.click(this.selectors.bulkAssignButton);
    await this.waitForToast();
  }

  /**
   * Bulk delete selected tasks
   */
  async bulkDelete(): Promise<void> {
    await this.page.click(this.selectors.bulkDeleteButton);
    await this.page.waitForSelector(this.selectors.deleteDialog);
    await this.page.click(this.selectors.confirmDeleteButton);
    await this.waitForToast();
  }

  // ============ ASSERTIONS ============

  /**
   * Assert task is visible
   */
  async assertTaskVisible(title: string): Promise<void> {
    const task = this.getTaskByTitle(title);
    await expect(task).toBeVisible();
  }

  /**
   * Assert task is not visible
   */
  async assertTaskNotVisible(title: string): Promise<void> {
    const task = this.getTaskByTitle(title);
    await expect(task).not.toBeVisible();
  }

  /**
   * Assert task is completed
   */
  async assertTaskCompleted(title: string): Promise<void> {
    const task = this.getTaskByTitle(title);
    const checkbox = task.locator(this.selectors.taskCheckbox);
    await expect(checkbox).toBeChecked();
  }

  /**
   * Assert task is not completed
   */
  async assertTaskNotCompleted(title: string): Promise<void> {
    const task = this.getTaskByTitle(title);
    const checkbox = task.locator(this.selectors.taskCheckbox);
    await expect(checkbox).not.toBeChecked();
  }

  /**
   * Assert task count
   */
  async assertTaskCount(expectedCount: number): Promise<void> {
    const count = await this.getTaskCount();
    expect(count).toBe(expectedCount);
  }

  /**
   * Assert empty state is shown
   */
  async assertEmptyState(): Promise<void> {
    await this.assertVisible(this.selectors.emptyState);
  }

  /**
   * Assert filter is active
   */
  async assertFilterActive(filter: 'active' | 'completed' | 'all' | 'myTasks'): Promise<void> {
    const selectors = {
      active: this.selectors.filterActive,
      completed: this.selectors.filterCompleted,
      all: this.selectors.filterAll,
      myTasks: this.selectors.filterMyTasks,
    };
    
    const button = this.page.locator(selectors[filter]);
    // Check for active state (typically has different styling/class)
    await expect(button).toHaveAttribute('data-active', 'true');
  }
}
