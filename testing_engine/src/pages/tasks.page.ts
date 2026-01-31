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
  // Selectors - Updated to match actual Trackly UI
  readonly selectors = {
    // Task list
    taskList: '.task-list, [role="list"]',
    taskItem: '.task-item, [role="listitem"]',
    taskTitle: '.task-title, [data-testid="task-title"]',
    taskCheckbox: 'input[type="checkbox"]',
    taskEditButton: 'button[aria-label*="Edit"], [data-testid="edit-task"]',
    taskDeleteButton: 'button[aria-label*="Delete"], [data-testid="delete-task"]',
    emptyState: '[data-testid="empty-state"], .empty-state, :has-text("No tasks")',

    // Add task form - matches AddTask.tsx
    addTaskInput: '#task-title, [placeholder="What needs to be done?"]',
    addTaskAssignee: '#task-assignee',
    addTaskDueDate: '#task-due-date, input[type="date"]',
    addTaskNotes: '#task-notes, textarea',
    addTaskButton: 'button:has-text("Add Task")',

    // Filters - matches TaskFilters.tsx
    filterActive: 'button:has-text("Active")',
    filterCompleted: 'button:has-text("Completed")',
    filterAll: 'button:has-text("All")',
    filterMyTasks: 'button:has-text("My Tasks")',
    filterClear: 'button:has-text("Clear")',
    assigneeDropdown: 'select, [data-testid="assignee-filter"]',
    sortDropdown: 'select, [data-testid="sort-by"]',

    // Bulk actions
    selectModeButton: 'button:has-text("Select Mode")',
    exitSelectModeButton: 'button:has-text("Exit"), button:has-text("Done")',
    selectAllButton: 'button:has-text("Select All")',
    bulkAssignButton: 'button:has-text("Assign")',
    bulkDeleteButton: 'button:has-text("Delete")',
    selectedCount: '[data-testid="selected-count"], .selected-count',

    // Edit modal
    editModal: '[role="dialog"], .chakra-modal__content',
    editTitleInput: '[data-testid="edit-title"], #edit-task-title, input[name="title"]',
    editAssigneeSelect: '[data-testid="edit-assignee"], #edit-task-assignee, select',
    editDueDateInput: '[data-testid="edit-due-date"], #edit-task-due-date, input[type="date"]',
    editNotesTextarea: '[data-testid="edit-notes"], #edit-task-notes, textarea',
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
    await this.goto('/app');
    await this.waitForPageLoad();
  }

  // ============ TASK CRUD ============

  /**
   * Create a new task
   */
  async createTask(data: TaskData): Promise<void> {
    // Fill title
    const titleInput = this.page.locator(this.selectors.addTaskInput);
    await titleInput.fill(data.title);
    
    // Fill optional assignee
    if (data.assignee) {
      const assigneeSelect = this.page.locator(this.selectors.addTaskAssignee);
      if (await assigneeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await assigneeSelect.selectOption({ label: data.assignee });
      }
    }

    // Fill optional due date
    if (data.dueDate) {
      const dueDateInput = this.page.locator(this.selectors.addTaskDueDate);
      if (await dueDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dueDateInput.fill(data.dueDate);
      }
    }

    // Fill optional notes
    if (data.notes) {
      const notesInput = this.page.locator(this.selectors.addTaskNotes);
      if (await notesInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await notesInput.fill(data.notes);
      }
    }

    // Submit
    await this.page.click(this.selectors.addTaskButton);
    
    // Wait for the task to actually appear (not just the toast)
    await this.waitForTaskToAppear(data.title);
  }

  /**
   * Wait for a task to appear in the list
   */
  async waitForTaskToAppear(title: string): Promise<void> {
    // Wait for the title text to be visible on the page
    await this.page.getByText(title).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get task checkbox using Playwright's getByText to find the task row
   * Returns the actual input element for use with check() method
   */
  getTaskCheckbox(title: string): Locator {
    // Find the text, traverse to the closest row with a checkbox, get the checkbox input
    return this.page.getByText(title).locator('xpath=ancestor::div[.//input[@type="checkbox"]][1]//input[@type="checkbox"]');
  }
  
  /**
   * Get task edit button for a specific task
   */
  getTaskEditButton(title: string): Locator {
    // Find the text, traverse to the closest row with buttons, get the edit button (first icon button)
    return this.page.getByText(title).locator('xpath=ancestor::div[.//button][1]//button').first();
  }
  
  /**
   * Get task delete button for a specific task  
   */
  getTaskDeleteButton(title: string): Locator {
    // Find the text, traverse to the closest row with buttons, get the delete button (usually last)
    return this.page.getByText(title).locator('xpath=ancestor::div[.//button][1]//button').last();
  }
  
  /**
   * Get task locator by title
   */
  getTaskByTitle(title: string): Locator {
    return this.page.getByText(title).locator('xpath=ancestor::div[.//input[@type="checkbox"]][1]');
  }

  /**
   * Edit an existing task
   */
  async editTask(currentTitle: string, newData: Partial<TaskData>): Promise<void> {
    // Use the specific edit button locator
    const editBtn = this.getTaskEditButton(currentTitle);
    await editBtn.click();

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
   * Chakra UI checkboxes require clicking the label or using dispatchEvent
   */
  async toggleTaskCompletion(title: string): Promise<void> {
    // Find the checkbox label/wrapper and click it
    // Chakra checkbox: label.chakra-checkbox > input + span
    const checkboxLabel = this.page.getByText(title).locator('xpath=ancestor::div[.//input[@type="checkbox"]][1]//label[contains(@class, "chakra-checkbox")]');
    
    if (await checkboxLabel.count() > 0) {
      await checkboxLabel.click();
    } else {
      // Fallback: find the row and click anywhere on the checkbox area
      const checkbox = this.getTaskCheckbox(title);
      await checkbox.dispatchEvent('click');
    }
    
    // Wait for state to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Delete a task
   */
  async deleteTask(title: string): Promise<void> {
    // Use the specific delete button locator
    const deleteBtn = this.getTaskDeleteButton(title);
    await deleteBtn.click();

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
    // Use simpler text-based check
    await expect(this.page.getByText(title, { exact: false }).first()).toBeVisible();
  }

  /**
   * Assert task is not visible
   */
  async assertTaskNotVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title, { exact: false })).not.toBeVisible();
  }

  /**
   * Assert task is completed
   */
  async assertTaskCompleted(title: string): Promise<void> {
    const checkbox = this.getTaskCheckbox(title);
    await expect(checkbox).toBeChecked();
  }

  /**
   * Assert task is not completed
   */
  async assertTaskNotCompleted(title: string): Promise<void> {
    const checkbox = this.getTaskCheckbox(title);
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
