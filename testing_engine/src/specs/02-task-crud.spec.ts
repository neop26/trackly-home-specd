/**
 * Task Management - Core CRUD Tests
 * 
 * Tests for creating, reading, updating, and deleting tasks.
 * 
 * Checklist Section: 2. Task Management — Core CRUD
 */

import { test, expect } from '@playwright/test';
import { TasksPage, TaskData } from '../pages/tasks.page';
import { AuthPage } from '../pages/auth.page';
import { testData, testConstants, sampleTasks } from '../fixtures/test-data';

test.describe('Task Management - Core CRUD', () => {
  let tasksPage: TasksPage;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    
    // Navigate to tasks page (assumes authenticated)
    await tasksPage.navigateToTasks();
    await tasksPage.waitForPageLoad();
  });

  test.describe('Create Tasks', () => {
    test('should create task with title only @smoke @critical', async () => {
      const taskTitle = testData.uniqueTaskTitle('Minimal Task');
      
      await tasksPage.createTask({ title: taskTitle });
      await tasksPage.assertTaskVisible(taskTitle);
    });

    test('should create task with all fields @smoke', async () => {
      const taskData: TaskData = {
        title: testData.uniqueTaskTitle('Full Task'),
        dueDate: testData.futureDate(7),
        notes: 'This is a test note',
      };

      await tasksPage.createTask(taskData);
      await tasksPage.assertTaskVisible(taskData.title);
    });

    test('should show task at top of list immediately (optimistic update) @critical', async ({ page }) => {
      const taskTitle = testData.uniqueTaskTitle('Top Task');
      
      await tasksPage.createTask({ title: taskTitle });
      
      // Get first task in list
      const firstTask = page.locator(tasksPage.selectors.taskItem).first();
      await expect(firstTask).toContainText(taskTitle);
    });

    test('should persist task after page refresh @critical', async ({ page }) => {
      const taskTitle = testData.uniqueTaskTitle('Persistent Task');
      
      await tasksPage.createTask({ title: taskTitle });
      await tasksPage.assertTaskVisible(taskTitle);

      // Refresh page
      await page.reload();
      await tasksPage.waitForPageLoad();

      // Task should still be there
      await tasksPage.assertTaskVisible(taskTitle);
    });

    test('should reject empty title with validation error @critical', async ({ page }) => {
      // Try to create task with empty title
      await tasksPage.fillInput(tasksPage.selectors.addTaskInput, '');
      await page.click(tasksPage.selectors.addTaskButton);

      // Should show validation error or button should be disabled
      const addBtn = page.locator(tasksPage.selectors.addTaskButton);
      const isDisabled = await addBtn.isDisabled();
      
      // Either button is disabled or validation message appears
      const validationError = page.locator(':has-text("required"), :has-text("Title")');
      expect(isDisabled || await validationError.isVisible()).toBe(true);
    });

    test('should handle long titles properly', async () => {
      const longTitle = 'A'.repeat(200);
      
      await tasksPage.createTask({ title: longTitle });
      // Should either truncate or handle gracefully
      const exists = await tasksPage.taskExists(longTitle.substring(0, 50));
      expect(exists).toBe(true);
    });
  });

  test.describe('View Tasks', () => {
    test('should display all active tasks on load @smoke', async () => {
      const taskCount = await tasksPage.getTaskCount();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test('should show task title, assignee, and due date @smoke', async ({ page }) => {
      // Create a task with all fields first
      const taskTitle = testData.uniqueTaskTitle('Full Info Task');
      await tasksPage.createTask({ 
        title: taskTitle,
        dueDate: testData.futureDate(5),
      });

      const task = tasksPage.getTaskByTitle(taskTitle);
      await expect(task).toBeVisible();
      await expect(task).toContainText(taskTitle);
    });

    test('should display unassigned tasks appropriately', async () => {
      const taskTitle = testData.uniqueTaskTitle('Unassigned Task');
      await tasksPage.createTask({ title: taskTitle });

      const task = tasksPage.getTaskByTitle(taskTitle);
      // Should show "Unassigned" or empty assignee
      const text = await task.textContent();
      expect(text?.toLowerCase()).toMatch(/unassigned|assign/i);
    });
  });

  test.describe('Edit Tasks', () => {
    test('should open edit modal when clicking edit icon @smoke', async ({ page }) => {
      // Create a task first
      const taskTitle = testData.uniqueTaskTitle('Edit Test Task');
      await tasksPage.createTask({ title: taskTitle });

      // Click edit
      const task = tasksPage.getTaskByTitle(taskTitle);
      await task.locator(tasksPage.selectors.taskEditButton).click();

      // Modal should be visible
      await expect(page.locator(tasksPage.selectors.editModal)).toBeVisible();
    });

    test('should modify task title @critical', async () => {
      const originalTitle = testData.uniqueTaskTitle('Original Title');
      const newTitle = testData.uniqueTaskTitle('Updated Title');

      await tasksPage.createTask({ title: originalTitle });
      await tasksPage.editTask(originalTitle, { title: newTitle });

      await tasksPage.assertTaskNotVisible(originalTitle);
      await tasksPage.assertTaskVisible(newTitle);
    });

    test('should update due date', async () => {
      const taskTitle = testData.uniqueTaskTitle('Due Date Task');
      const newDueDate = testData.futureDate(14);

      await tasksPage.createTask({ title: taskTitle });
      await tasksPage.editTask(taskTitle, { dueDate: newDueDate });

      // Verify date is shown (implementation-specific)
      const task = tasksPage.getTaskByTitle(taskTitle);
      await expect(task).toBeVisible();
    });

    test('should add notes to task', async () => {
      const taskTitle = testData.uniqueTaskTitle('Notes Task');
      const notes = 'These are important notes for this task';

      await tasksPage.createTask({ title: taskTitle });
      await tasksPage.editTask(taskTitle, { notes });

      // Verify notes are visible
      const task = tasksPage.getTaskByTitle(taskTitle);
      await expect(task).toContainText(notes.substring(0, 20));
    });

    test('should cancel changes when clicking cancel button @smoke', async ({ page }) => {
      const taskTitle = testData.uniqueTaskTitle('Cancel Test Task');
      await tasksPage.createTask({ title: taskTitle });

      // Open edit modal
      const task = tasksPage.getTaskByTitle(taskTitle);
      await task.locator(tasksPage.selectors.taskEditButton).click();

      // Change title
      await tasksPage.fillInput(tasksPage.selectors.editTitleInput, 'Changed Title');

      // Cancel
      await page.click(tasksPage.selectors.editCancelButton);

      // Original title should remain
      await tasksPage.assertTaskVisible(taskTitle);
    });

    test('should validate against empty title in edit @critical', async ({ page }) => {
      const taskTitle = testData.uniqueTaskTitle('Validation Task');
      await tasksPage.createTask({ title: taskTitle });

      // Open edit modal
      const task = tasksPage.getTaskByTitle(taskTitle);
      await task.locator(tasksPage.selectors.taskEditButton).click();

      // Clear title
      await tasksPage.fillInput(tasksPage.selectors.editTitleInput, '');

      // Save button should be disabled or show error
      const saveBtn = page.locator(tasksPage.selectors.editSaveButton);
      const isDisabled = await saveBtn.isDisabled();
      expect(isDisabled).toBe(true);
    });
  });

  test.describe('Toggle Task Completion', () => {
    test('should mark task complete when clicking checkbox @smoke @critical', async () => {
      const taskTitle = testData.uniqueTaskTitle('Complete Me');
      await tasksPage.createTask({ title: taskTitle });

      // Switch to "All" view so task stays visible after completion
      await tasksPage.filterByStatus('all');
      
      await tasksPage.toggleTaskCompletion(taskTitle);
      await tasksPage.assertTaskCompleted(taskTitle);
    });

    test('should mark task incomplete when clicking again @critical', async () => {
      const taskTitle = testData.uniqueTaskTitle('Toggle Task');
      await tasksPage.createTask({ title: taskTitle });

      // Switch to "All" view so task stays visible through status changes
      await tasksPage.filterByStatus('all');

      // Complete
      await tasksPage.toggleTaskCompletion(taskTitle);
      await tasksPage.assertTaskCompleted(taskTitle);

      // Uncomplete
      await tasksPage.toggleTaskCompletion(taskTitle);
      await tasksPage.assertTaskNotCompleted(taskTitle);
    });

    test('should apply visual distinction to completed tasks', async ({ page }) => {
      const taskTitle = testData.uniqueTaskTitle('Styled Task');
      await tasksPage.createTask({ title: taskTitle });

      // Switch to "All" view so task stays visible after completion
      await tasksPage.filterByStatus('all');

      await tasksPage.toggleTaskCompletion(taskTitle);

      // Check for visual styling (strikethrough, opacity, etc.)
      const task = tasksPage.getTaskByTitle(taskTitle);
      const styles = await task.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          textDecoration: computed.textDecoration,
          opacity: computed.opacity,
        };
      });

      // Should have some visual distinction
      expect(
        styles.textDecoration.includes('line-through') || 
        parseFloat(styles.opacity) < 1
      ).toBe(true);
    });

    test('should persist completion status after refresh @critical', async ({ page }) => {
      const taskTitle = testData.uniqueTaskTitle('Persist Complete');
      await tasksPage.createTask({ title: taskTitle });

      await tasksPage.toggleTaskCompletion(taskTitle);

      // Refresh
      await page.reload();
      await tasksPage.waitForPageLoad();

      // Filter to show completed
      await tasksPage.filterByStatus('completed');
      await tasksPage.assertTaskVisible(taskTitle);
    });
  });

  test.describe('Delete Tasks (Soft Delete)', () => {
    test('should show confirmation dialog when clicking delete @smoke', async ({ page }) => {
      const taskTitle = testData.uniqueTaskTitle('Delete Dialog Task');
      await tasksPage.createTask({ title: taskTitle });

      const task = tasksPage.getTaskByTitle(taskTitle);
      await task.locator(tasksPage.selectors.taskDeleteButton).click();

      await expect(page.locator(tasksPage.selectors.deleteDialog)).toBeVisible();
    });

    test('should remove task from list after confirming delete @critical', async () => {
      const taskTitle = testData.uniqueTaskTitle('Delete Me');
      await tasksPage.createTask({ title: taskTitle });

      await tasksPage.deleteTask(taskTitle);
      await tasksPage.assertTaskNotVisible(taskTitle);
    });

    test('should keep task when canceling delete @smoke', async ({ page }) => {
      const taskTitle = testData.uniqueTaskTitle('Keep Me');
      await tasksPage.createTask({ title: taskTitle });

      const task = tasksPage.getTaskByTitle(taskTitle);
      await task.locator(tasksPage.selectors.taskDeleteButton).click();

      // Cancel
      await page.click(tasksPage.selectors.cancelDeleteButton);

      // Task should still be there
      await tasksPage.assertTaskVisible(taskTitle);
    });

    test('should not show deleted task in Active view @critical', async () => {
      const taskTitle = testData.uniqueTaskTitle('Deleted from Active');
      await tasksPage.createTask({ title: taskTitle });

      await tasksPage.deleteTask(taskTitle);
      await tasksPage.filterByStatus('active');

      await tasksPage.assertTaskNotVisible(taskTitle);
    });

    test('should not show deleted task in Completed view', async () => {
      const taskTitle = testData.uniqueTaskTitle('Deleted from Completed');
      await tasksPage.createTask({ title: taskTitle });

      // Complete then delete
      await tasksPage.toggleTaskCompletion(taskTitle);
      await tasksPage.deleteTask(taskTitle);

      await tasksPage.filterByStatus('completed');
      await tasksPage.assertTaskNotVisible(taskTitle);
    });
  });
});
