/**
 * Test Generator
 * 
 * Generates Playwright test specs from parsed checklist data.
 * Creates structured test files organized by feature area.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseChecklist, TestCase, TestSection, ParsedChecklist } from './checklist-parser';

const CHECKLIST_PATH = path.resolve(__dirname, '../../../docs/TESTING_CHECKLIST.md');
const SPECS_PATH = path.resolve(__dirname, '../specs');

interface GeneratorConfig {
  generateSkeletons: boolean;
  overwriteExisting: boolean;
  includeManual: boolean;
  tagsFilter?: string[];
  priorityFilter?: TestCase['priority'][];
}

const DEFAULT_CONFIG: GeneratorConfig = {
  generateSkeletons: true,
  overwriteExisting: false,
  includeManual: false,
  tagsFilter: undefined,
  priorityFilter: undefined,
};

/**
 * Generate test file name from section title
 */
function generateFileName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .concat('.spec.ts');
}

/**
 * Generate test name from description
 */
function generateTestName(description: string): string {
  return description
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate tags decorator
 */
function generateTagsDecorator(test: TestCase): string {
  const tags = [...test.tags];
  
  // Add priority tag
  if (test.priority === 'critical') tags.push('critical');
  if (test.priority === 'high') tags.push('smoke');
  
  // Add automation status
  if (!test.automatable) tags.push('manual');
  
  return tags.map(t => `@${t}`).join(' ');
}

/**
 * Generate a single test spec file
 */
function generateSpecFile(section: TestSection, checklist: ParsedChecklist, config: GeneratorConfig): string {
  const imports = `import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { TasksPage } from '../pages/tasks.page';
import { testUsers, testData } from '../fixtures/test-data';
`;

  const fileHeader = `/**
 * ${section.title} Tests
 * 
 * Auto-generated from: ${checklist.title}
 * Generated: ${new Date().toISOString()}
 * Section: ${section.id}
 * 
 * Total Tests: ${section.testCount}
 */

`;

  let testContent = '';

  for (const subsection of section.subsections) {
    testContent += `\ntest.describe('${subsection.title}', () => {\n`;

    for (const testCase of subsection.tests) {
      // Skip manual tests if configured
      if (!config.includeManual && !testCase.automatable) {
        testContent += `  // MANUAL TEST: ${testCase.description}\n`;
        continue;
      }

      // Apply filters
      if (config.tagsFilter && !config.tagsFilter.some(t => testCase.tags.includes(t))) {
        continue;
      }
      if (config.priorityFilter && !config.priorityFilter.includes(testCase.priority)) {
        continue;
      }

      const tags = generateTagsDecorator(testCase);
      const testName = generateTestName(testCase.description);

      testContent += `
  /**
   * Test ID: ${testCase.id}
   * Priority: ${testCase.priority.toUpperCase()}
   * Tags: ${testCase.tags.join(', ')}
   * Line: ${testCase.lineNumber}
   */
  test('${testName} ${tags}', async ({ page }) => {
    // TODO: Implement test
    // Description: ${testCase.description}
    
    test.skip(!${testCase.automatable}, 'Manual test - requires human verification');
    
    // Arrange
    
    // Act
    
    // Assert
    expect(true).toBe(true); // Placeholder
  });
`;
    }

    testContent += '});\n';
  }

  return imports + fileHeader + testContent;
}

/**
 * Generate all test spec files from checklist
 */
export function generateAllSpecs(config: GeneratorConfig = DEFAULT_CONFIG): void {
  console.log('🔧 Generating test specifications...\n');

  const checklist = parseChecklist(CHECKLIST_PATH);

  // Ensure specs directory exists
  if (!fs.existsSync(SPECS_PATH)) {
    fs.mkdirSync(SPECS_PATH, { recursive: true });
  }

  const generatedFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const section of checklist.sections) {
    const fileName = generateFileName(section.title);
    const filePath = path.join(SPECS_PATH, fileName);

    // Check if file exists
    if (fs.existsSync(filePath) && !config.overwriteExisting) {
      skippedFiles.push(fileName);
      continue;
    }

    const content = generateSpecFile(section, checklist, config);
    fs.writeFileSync(filePath, content);
    generatedFiles.push(fileName);
  }

  // Print summary
  console.log('═'.repeat(60));
  console.log('📝 TEST GENERATION RESULTS');
  console.log('═'.repeat(60));
  console.log(`\nGenerated: ${generatedFiles.length} files`);
  console.log(`Skipped (existing): ${skippedFiles.length} files\n`);

  if (generatedFiles.length > 0) {
    console.log('Generated files:');
    for (const file of generatedFiles) {
      console.log(`  ✅ ${file}`);
    }
  }

  if (skippedFiles.length > 0) {
    console.log('\nSkipped files (use --overwrite to replace):');
    for (const file of skippedFiles) {
      console.log(`  ⏭️  ${file}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Generation complete!');
  console.log('═'.repeat(60) + '\n');
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: GeneratorConfig = {
    generateSkeletons: true,
    overwriteExisting: args.includes('--overwrite'),
    includeManual: args.includes('--include-manual'),
    tagsFilter: undefined,
    priorityFilter: undefined,
  };

  generateAllSpecs(config);
}
