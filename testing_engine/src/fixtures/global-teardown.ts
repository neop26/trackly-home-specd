/**
 * Global Teardown
 * 
 * Runs once after all tests complete.
 * Cleans up test data and resources.
 */

import * as fs from 'fs';
import * as path from 'path';

const STORAGE_STATE_PATH = path.resolve(__dirname, '../../config/storage-state.json');

async function globalTeardown(): Promise<void> {
  console.log('\n🧹 Running global teardown...\n');

  try {
    // Clean up test data if needed
    if (process.env.CLEANUP_TEST_DATA === 'true') {
      console.log('🗑️  Cleaning up test data...');
      // Add cleanup logic here (e.g., delete test tasks, etc.)
    }

    // Remove storage state in CI to ensure fresh state
    if (process.env.CI && fs.existsSync(STORAGE_STATE_PATH)) {
      fs.unlinkSync(STORAGE_STATE_PATH);
      console.log('🗑️  Removed storage state file');
    }

    // Generate summary report
    const reportsDir = path.resolve(__dirname, '../../reports');
    if (fs.existsSync(path.join(reportsDir, 'json/results.json'))) {
      console.log('📊 Test results saved to reports/');
    }

  } catch (error) {
    console.error('⚠️  Teardown warning:', error);
    // Don't throw - teardown errors shouldn't fail the test run
  }

  console.log('\n✅ Global teardown complete!\n');
}

export default globalTeardown;
