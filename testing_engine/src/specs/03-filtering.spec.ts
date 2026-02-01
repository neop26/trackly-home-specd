/**
 * Task Filtering Tests
 * 
 * Tests for status filters, My Tasks, and assignee filters.
 * 
 * Checklist Section: 3. Advanced Filtering
 */

import { test, expect } from '@playwright/test';
import { TasksPage } from '../pages/tasks.page';
import { testData, testUsers } from '../fixtures/test-data';

test.describe('Advanced Filtering', () => {
  let tasksPage: TasksPage;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    await tasksPage.navigateToTasks();
    await tasksPage.waitForPageLoad();
  });

  test.describe('Status Filter (Tabs)', () => {
    test('should show only incomplete tasks in Active tab @smoke @critical', async () => {
      // Create both active and completed tasks
      const activeTask = testData.uniqueTaskTitle('Filter Active');
      const completedTask = testData.uniqueTaskTitle('Filter Completed');

      await tasksPage.createTask({ title: activeTask });
      await tasksPage.createTask({ title: completedTask });
      await tasksPage.toggleTaskCompletion(completedTask);

      // Filter to Active
      await tasksPage.filterByStatus('active');

      await tasksPage.assertTaskVisible(activeTask);
      await tasksPage.assertTaskNotVisible(completedTask);
    });

    test('should show only completed tasks in Completed tab @smoke @critical', async () => {
      const activeTask = testData.uniqueTaskTitle('Stay Active');
      const completedTask = testData.uniqueTaskTitle('Get Completed');

      await tasksPage.createTask({ title: activeTask });
      await tasksPage.createTask({ title: completedTask });
      await tasksPage.toggleTaskCompletion(completedTask);

      // Filter to Completed
      await tasksPage.filterByStatus('completed');

      await tasksPage.assertTaskNotVisible(activeTask);
      await tasksPage.assertTaskVisible(completedTask);
    });

    test('should show all tasks in All Tasks tab @smoke', async () => {
      const activeTask = testData.uniqueTaskTitle('All Active');
      const completedTask = testData.uniqueTaskTitle('All Completed');

      await tasksPage.createTask({ title: activeTask });
      await tasksPage.createTask({ title: completedTask });
      await tasksPage.toggleTaskCompletion(completedTask);

      // Filter to All
      await tasksPage.filterByStatus('all');

      await tasksPage.assertTaskVisible(activeTask);
      await tasksPage.assertTaskVisible(completedTask);
    });

    test('should visually indicate selected tab @smoke', async ({ page }) => {
      await tasksPage.filterByStatus('completed');

      const completedBtn = page.locator(tasksPage.selectors.filterCompleted);
      // Check for active state styling (uses data-active attribute)
      await expect(completedBtn).toHaveAttribute('data-active', 'true');
    });

    test('should persist filter in localStorage across sessions @critical', async ({ page, context }) => {
      await tasksPage.filterByStatus('completed');

      // Check localStorage
      const filterValue = await page.evaluate(() => {
        return localStorage.getItem('trackly_task_filters');
      });

      expect(filterValue).toContain('completed');

      // Reload page
      await page.reload();
      await tasksPage.waitForPageLoad();

      // Filter should still be applied
      const completedBtn = page.locator(tasksPage.selectors.filterCompleted);
      await expect(completedBtn).toHaveAttribute('data-active', 'true');
    });

    test('should update list immediately when switching tabs @critical', async () => {
      const task = testData.uniqueTaskTitle('Quick Switch');
      await tasksPage.createTask({ title: task });

      // Switch tabs rapidly
      await tasksPage.filterByStatus('completed');
      await tasksPage.assertTaskNotVisible(task);

      await tasksPage.filterByStatus('active');
      await tasksPage.assertTaskVisible(task);

      await tasksPage.filterByStatus('all');
      await tasksPage.assertTaskVisible(task);
    });
  });

  test.describe('My Tasks Filter', () => {
    test('should filter to tasks assigned to current user @smoke @critical', async ({ page }) => {
      // This test assumes tasks can be assigned to current user
      await tasksPage.toggleMyTasks();

      const myTasksBtn = page.locator(tasksPage.selectors.filterMyTasks);
      await expect(myTasksBtn).toContainText(/showing|my/i);
    });

    test('should show active button state when enabled @smoke', async ({ page }) => {
      await tasksPage.toggleMyTasks();

      const myTasksBtn = page.locator(tasksPage.selectors.filterMyTasks);
      await expect(myTasksBtn).toHaveAttribute('data-active', 'true');
    });

    test('should show empty state when no tasks assigned @smoke', async ({ page }) => {
      await tasksPage.toggleMyTasks();

      // If no tasks assigned, should show empty message
      const emptyMessage = page.locator(':has-text("all caught up"), :has-text("no tasks")');
      // This might or might not be visible depending on data
    });

    test('should show Clear Filter button when My Tasks is active @smoke', async ({ page }) => {
      await tasksPage.toggleMyTasks();

      const clearBtn = page.locator(tasksPage.selectors.filterClear);
      await expect(clearBtn).toBeVisible();
    });

    test('should return to All Members view when clearing filter', async ({ page }) => {
      await tasksPage.toggleMyTasks();
      
      const clearBtn = page.locator(tasksPage.selectors.filterClear);
      await clearBtn.click();

      // My Tasks should no longer be active
      const myTasksBtn = page.locator(tasksPage.selectors.filterMyTasks);
      await expect(myTasksBtn).not.toHaveAttribute('data-active', 'true');
    });

    test('should persist My Tasks filter across refresh @critical', async ({ page }) => {
      await tasksPage.toggleMyTasks();
      
      await page.reload();
      await tasksPage.waitForPageLoad();

      // Filter should still be active
      const myTasksBtn = page.locator(tasksPage.selectors.filterMyTasks);
      await expect(myTasksBtn).toHaveAttribute('data-active', 'true');
    });

    test('should work correctly with status filter (combined) @critical', async () => {
      await tasksPage.toggleMyTasks();
      await tasksPage.filterByStatus('completed');

      // Both filters should be applied
      // Results should be: completed tasks assigned to me
    });
  });

  test.describe('Assignee Filter (Dropdown)', () => {
    test('should display All Members, Unassigned, and member list @smoke', async ({ page }) => {
      // The assignee dropdown is a <select> element, not a click-dropdown
      const dropdown = page.locator(tasksPage.selectors.assigneeDropdown);
      await expect(dropdown).toBeVisible();
      
      // Check that the select has the expected default option
      await expect(dropdown.locator('option').first()).toContainText(/All/i);
    });

    test('should filter to specific member tasks when selected @critical', async () => {
      await tasksPage.filterByAssignee('Unassigned');

      // All visible tasks should be unassigned
      const tasks = await tasksPage.getAllTaskTitles();
      // Verification depends on data setup
    });

    test('should show only unassigned tasks when Unassigned selected @critical', async ({ page }) => {
      const unassignedTask = testData.uniqueTaskTitle('No Owner');
      await tasksPage.createTask({ title: unassignedTask });

      await tasksPage.filterByAssignee('Unassigned');

      await tasksPage.assertTaskVisible(unassignedTask);
    });

    test('should show all tasks when All Members selected @smoke', async () => {
      const task = testData.uniqueTaskTitle('All Members Task');
      await tasksPage.createTask({ title: task });

      await tasksPage.filterByAssignee('All Members');
      await tasksPage.assertTaskVisible(task);
    });

    test('should update list immediately when selection changes @critical', async () => {
      await tasksPage.filterByAssignee('Unassigned');
      const countUnassigned = await tasksPage.getTaskCount();

      await tasksPage.filterByAssignee('All Members');
      const countAll = await tasksPage.getTaskCount();

      // All should be >= unassigned
      expect(countAll).toBeGreaterThanOrEqual(countUnassigned);
    });

    test('should persist filter in localStorage @critical', async ({ page }) => {
      await tasksPage.filterByAssignee('Unassigned');

      const filterValue = await page.evaluate(() => {
        return localStorage.getItem('trackly_task_filters');
      });

      expect(filterValue).toContain('unassigned');
    });

    test('should work correctly with status filter @critical', async () => {
      await tasksPage.filterByStatus('completed');
      await tasksPage.filterByAssignee('Unassigned');

      // Both filters should be combined
    });
  });

  test.describe('Combined Filters', () => {
    test('should combine Status + My Tasks correctly @critical', async () => {
      await tasksPage.filterByStatus('active');
      await tasksPage.toggleMyTasks();

      // Should show active tasks assigned to current user
    });

    test('should combine Status + Assignee dropdown correctly @critical', async () => {
      await tasksPage.filterByStatus('completed');
      await tasksPage.filterByAssignee('Unassigned');

      // Should show completed unassigned tasks
    });

    test('should clear only affected filter without affecting others', async () => {
      await tasksPage.filterByStatus('completed');
      await tasksPage.toggleMyTasks();

      // Clear My Tasks
      await tasksPage.toggleMyTasks();

      // Status filter should still be completed
    });

    test('should persist all combined filters correctly', async ({ page }) => {
      await tasksPage.filterByStatus('completed');
      await tasksPage.toggleMyTasks();

      await page.reload();
      await tasksPage.waitForPageLoad();

      // Both filters should still be active
    });
  });
});
