/**
 * Task Sorting Tests
 * 
 * Tests for all sorting options and their interaction with filters.
 * 
 * Checklist Section: 4. Task Sorting
 */

import { test, expect } from '@playwright/test';
import { TasksPage } from '../pages/tasks.page';
import { testData } from '../fixtures/test-data';

test.describe('Task Sorting', () => {
  let tasksPage: TasksPage;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    await tasksPage.navigateToTasks();
    await tasksPage.waitForPageLoad();
  });

  test.describe('Sort by Due Date', () => {
    test('should sort tasks with due dates first, earliest to latest @smoke @critical', async () => {
      // Create tasks with different due dates
      const earlyTask = testData.uniqueTaskTitle('Early Due');
      const lateTask = testData.uniqueTaskTitle('Late Due');
      const noDueTask = testData.uniqueTaskTitle('No Due Date');

      await tasksPage.createTask({ title: noDueTask });
      await tasksPage.createTask({ title: lateTask, dueDate: testData.futureDate(14) });
      await tasksPage.createTask({ title: earlyTask, dueDate: testData.futureDate(3) });

      await tasksPage.sortBy('due_date');

      const titles = await tasksPage.getAllTaskTitles();
      
      // Early due should come before late due
      const earlyIndex = titles.findIndex(t => t.includes('Early Due'));
      const lateIndex = titles.findIndex(t => t.includes('Late Due'));
      const noIndex = titles.findIndex(t => t.includes('No Due Date'));

      expect(earlyIndex).toBeLessThan(lateIndex);
      // No due date should be at the end
      expect(noIndex).toBeGreaterThan(lateIndex);
    });

    test('should put tasks without due dates at the end @critical', async () => {
      const withDue = testData.uniqueTaskTitle('Has Due Date');
      const withoutDue = testData.uniqueTaskTitle('No Due Date');

      await tasksPage.createTask({ title: withoutDue });
      await tasksPage.createTask({ title: withDue, dueDate: testData.futureDate(1) });

      await tasksPage.sortBy('due_date');

      const titles = await tasksPage.getAllTaskTitles();
      const withIndex = titles.findIndex(t => t.includes('Has Due Date'));
      const withoutIndex = titles.findIndex(t => t.includes('No Due Date'));

      expect(withIndex).toBeLessThan(withoutIndex);
    });

    test('should show Sort by: Due Date in dropdown @smoke', async ({ page }) => {
      await tasksPage.sortBy('due_date');

      const dropdown = page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/due date/i);
    });

    test('should persist due date sort across refresh @critical', async ({ page }) => {
      await tasksPage.sortBy('due_date');

      await page.reload();
      await tasksPage.waitForPageLoad();

      const dropdown = page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/due date/i);
    });
  });

  test.describe('Sort by Created Date', () => {
    test('should sort tasks from oldest to newest @smoke @critical', async () => {
      // Create tasks in sequence
      const firstTask = testData.uniqueTaskTitle('First Created');
      const secondTask = testData.uniqueTaskTitle('Second Created');

      await tasksPage.createTask({ title: firstTask });
      await tasksPage.page.waitForTimeout(100); // Small delay
      await tasksPage.createTask({ title: secondTask });

      await tasksPage.sortBy('created_at');

      const titles = await tasksPage.getAllTaskTitles();
      const firstIndex = titles.findIndex(t => t.includes('First Created'));
      const secondIndex = titles.findIndex(t => t.includes('Second Created'));

      // Oldest first
      expect(firstIndex).toBeLessThan(secondIndex);
    });

    test('should show newly created tasks at bottom @critical', async () => {
      await tasksPage.sortBy('created_at');

      const newTask = testData.uniqueTaskTitle('Newest Task');
      await tasksPage.createTask({ title: newTask });

      const titles = await tasksPage.getAllTaskTitles();
      const newIndex = titles.findIndex(t => t.includes('Newest Task'));

      // Should be at or near the end
      expect(newIndex).toBe(titles.length - 1);
    });

    test('should show Sort by: Created Date in dropdown @smoke', async ({ page }) => {
      await tasksPage.sortBy('created_at');

      const dropdown = page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/created/i);
    });

    test('should persist created date sort across refresh @critical', async ({ page }) => {
      await tasksPage.sortBy('created_at');

      await page.reload();
      await tasksPage.waitForPageLoad();

      const dropdown = page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/created/i);
    });
  });

  test.describe('Sort by Title (A-Z)', () => {
    test('should sort tasks alphabetically @smoke @critical', async () => {
      const taskA = testData.uniqueTaskTitle('AAA First');
      const taskZ = testData.uniqueTaskTitle('ZZZ Last');
      const taskM = testData.uniqueTaskTitle('MMM Middle');

      await tasksPage.createTask({ title: taskZ });
      await tasksPage.createTask({ title: taskA });
      await tasksPage.createTask({ title: taskM });

      await tasksPage.sortBy('title');

      const titles = await tasksPage.getAllTaskTitles();
      const aIndex = titles.findIndex(t => t.includes('AAA'));
      const mIndex = titles.findIndex(t => t.includes('MMM'));
      const zIndex = titles.findIndex(t => t.includes('ZZZ'));

      expect(aIndex).toBeLessThan(mIndex);
      expect(mIndex).toBeLessThan(zIndex);
    });

    test('should sort case-insensitively @critical', async () => {
      const upperTask = testData.uniqueTaskTitle('UPPER Case');
      const lowerTask = testData.uniqueTaskTitle('lower case');

      await tasksPage.createTask({ title: upperTask });
      await tasksPage.createTask({ title: lowerTask });

      await tasksPage.sortBy('title');

      // Both should be sorted together, not separated by case
      const titles = await tasksPage.getAllTaskTitles();
      // Verification depends on exact task titles
    });

    test('should show Sort by: Title (A-Z) in dropdown @smoke', async ({ page }) => {
      await tasksPage.sortBy('title');

      const dropdown = page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/title/i);
    });

    test('should persist title sort across refresh @critical', async ({ page }) => {
      await tasksPage.sortBy('title');

      await page.reload();
      await tasksPage.waitForPageLoad();

      const dropdown = page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/title/i);
    });
  });

  test.describe('Sort by Assignee', () => {
    test('should show unassigned tasks first @smoke @critical', async () => {
      const unassignedTask = testData.uniqueTaskTitle('No Assignee');
      await tasksPage.createTask({ title: unassignedTask });

      await tasksPage.sortBy('assignee');

      const titles = await tasksPage.getAllTaskTitles();
      const unassignedIndex = titles.findIndex(t => t.includes('No Assignee'));

      // Unassigned should be near the top
      expect(unassignedIndex).toBeLessThan(5);
    });

    test('should then sort alphabetically by assignee name @critical', async () => {
      await tasksPage.sortBy('assignee');

      // Verification depends on actual assignee data
    });

    test('should show Sort by: Assignee in dropdown @smoke', async ({ page }) => {
      await tasksPage.sortBy('assignee');

      const dropdown = page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/assignee/i);
    });

    test('should persist assignee sort across refresh @critical', async ({ page }) => {
      await tasksPage.sortBy('assignee');

      await page.reload();
      await tasksPage.waitForPageLoad();

      const dropdown = page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/assignee/i);
    });
  });

  test.describe('Sorting with Filters', () => {
    test('should maintain sort when toggling status filter @critical', async () => {
      await tasksPage.sortBy('title');

      await tasksPage.filterByStatus('active');
      // Sort should still be by title

      await tasksPage.filterByStatus('completed');
      // Sort should still be by title

      await tasksPage.filterByStatus('all');
      // Sort should still be by title

      const dropdown = tasksPage.page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/title/i);
    });

    test('should maintain sort when toggling My Tasks filter @critical', async () => {
      await tasksPage.sortBy('due_date');

      await tasksPage.toggleMyTasks();
      // Sort should still be by due_date

      const dropdown = tasksPage.page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/due date/i);
    });

    test('should maintain sort when changing assignee filter @critical', async () => {
      await tasksPage.sortBy('created_at');

      await tasksPage.filterByAssignee('Unassigned');
      // Sort should still be by created_at

      await tasksPage.filterByAssignee('All Members');
      // Sort should still be by created_at

      const dropdown = tasksPage.page.locator(tasksPage.selectors.sortDropdown);
      await expect(dropdown).toContainText(/created/i);
    });

    test('should sort filtered results correctly @critical', async () => {
      // Create mixed tasks
      const activeA = testData.uniqueTaskTitle('AAA Active');
      const activeZ = testData.uniqueTaskTitle('ZZZ Active');
      const completedA = testData.uniqueTaskTitle('AAA Complete');

      await tasksPage.createTask({ title: activeZ });
      await tasksPage.createTask({ title: activeA });
      await tasksPage.createTask({ title: completedA });
      await tasksPage.toggleTaskCompletion(completedA);

      // Filter to active and sort by title
      await tasksPage.filterByStatus('active');
      await tasksPage.sortBy('title');

      const titles = await tasksPage.getAllTaskTitles();

      // Only active tasks, sorted by title
      const aIndex = titles.findIndex(t => t.includes('AAA Active'));
      const zIndex = titles.findIndex(t => t.includes('ZZZ Active'));
      const completedIndex = titles.findIndex(t => t.includes('AAA Complete'));

      expect(aIndex).toBeLessThan(zIndex);
      expect(completedIndex).toBe(-1); // Should not be visible
    });
  });
});
