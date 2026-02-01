/**
 * Test Data Fixtures
 * 
 * Centralized test data for consistent testing.
 */

export interface TestUser {
  email: string;
  password?: string;
  role: 'owner' | 'admin' | 'member';
  displayName: string;
}

export interface TestHousehold {
  id: string;
  name: string;
}

export interface TestTask {
  title: string;
  assignee?: string;
  dueDate?: string;
  notes?: string;
  status: 'incomplete' | 'complete';
}

/**
 * Test Users
 */
export const testUsers: Record<string, TestUser> = {
  owner: {
    email: process.env.TEST_OWNER_EMAIL || 'owner@test.trackly.dev',
    password: process.env.TEST_OWNER_PASSWORD,
    role: 'owner',
    displayName: 'Test Owner',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.trackly.dev',
    password: process.env.TEST_ADMIN_PASSWORD,
    role: 'admin',
    displayName: 'Test Admin',
  },
  member: {
    email: process.env.TEST_MEMBER_EMAIL || 'member@test.trackly.dev',
    password: process.env.TEST_MEMBER_PASSWORD,
    role: 'member',
    displayName: 'Test Member',
  },
};

/**
 * Test Household
 */
export const testHousehold: TestHousehold = {
  id: process.env.TEST_HOUSEHOLD_ID || 'test-household-id',
  name: 'Test Household',
};

/**
 * Sample Test Tasks
 */
export const sampleTasks: TestTask[] = [
  {
    title: 'E2E Test Task - Active',
    status: 'incomplete',
    notes: 'This is a test task created by E2E tests',
  },
  {
    title: 'E2E Test Task - Completed',
    status: 'complete',
    notes: 'This is a completed test task',
  },
  {
    title: 'E2E Test Task - With Due Date',
    status: 'incomplete',
    dueDate: '2026-02-15',
  },
  {
    title: 'E2E Test Task - Assigned',
    status: 'incomplete',
    assignee: testUsers.member.displayName,
  },
];

/**
 * Test Data Utilities
 */
export const testData = {
  /**
   * Generate unique task title
   */
  uniqueTaskTitle: (prefix = 'Test Task') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${prefix} - ${timestamp}-${random}`;
  },

  /**
   * Generate future date string
   */
  futureDate: (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  },

  /**
   * Generate past date string
   */
  pastDate: (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  },

  /**
   * Generate random notes
   */
  randomNotes: () => {
    const notes = [
      'Remember to check the details',
      'This needs urgent attention',
      'Follow up with the team',
      'Low priority task',
      'Weekend task - no rush',
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  },

  /**
   * Generate bulk test tasks
   */
  bulkTasks: (count: number): TestTask[] => {
    return Array.from({ length: count }, (_, i) => ({
      title: testData.uniqueTaskTitle(`Bulk Task ${i + 1}`),
      status: i % 2 === 0 ? 'incomplete' : 'complete',
      notes: `Bulk generated task ${i + 1}`,
    }));
  },
};

/**
 * Test Constants
 */
export const testConstants = {
  // Timeouts
  SHORT_TIMEOUT: 5000,
  MEDIUM_TIMEOUT: 10000,
  LONG_TIMEOUT: 30000,

  // Limits
  MAX_TASK_TITLE_LENGTH: 255,
  MAX_NOTES_LENGTH: 2000,

  // Messages
  EMPTY_TITLE_ERROR: 'Title is required',
  TASK_CREATED_SUCCESS: 'Task created',
  TASK_UPDATED_SUCCESS: 'Task updated',
  TASK_DELETED_SUCCESS: 'Task deleted',
  ALL_CAUGHT_UP: "You're all caught up",
};
