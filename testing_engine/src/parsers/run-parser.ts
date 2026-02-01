/**
 * Checklist Parser CLI Runner
 * 
 * Parses the testing checklist and outputs statistics and test cases.
 */

import * as path from 'path';
import { parseChecklist, exportToJson, getStatistics } from './checklist-parser';

const CHECKLIST_PATH = path.resolve(__dirname, '../../../docs/TESTING_CHECKLIST.md');
const OUTPUT_PATH = path.resolve(__dirname, '../../config/parsed-tests.json');

async function main() {
  console.log('🔍 Parsing Testing Checklist...\n');
  console.log(`Source: ${CHECKLIST_PATH}\n`);

  try {
    const checklist = parseChecklist(CHECKLIST_PATH);
    const stats = getStatistics(checklist);

    // Print summary
    console.log('═'.repeat(60));
    console.log('📊 CHECKLIST PARSING RESULTS');
    console.log('═'.repeat(60));
    console.log(`\n📋 Title: ${checklist.title}`);
    console.log(`📅 Date: ${checklist.date}`);
    console.log(`🔢 Version: ${checklist.version}\n`);

    console.log('─'.repeat(60));
    console.log('TEST STATISTICS');
    console.log('─'.repeat(60));
    console.log(`Total Test Cases:    ${stats.totalTests}`);
    console.log(`Automatable:         ${stats.automatableTests} (${Math.round(stats.automatableTests / stats.totalTests * 100)}%)`);
    console.log(`Manual Only:         ${stats.manualTests} (${Math.round(stats.manualTests / stats.totalTests * 100)}%)`);

    console.log('\n─'.repeat(60));
    console.log('BY PRIORITY');
    console.log('─'.repeat(60));
    console.log(`🔴 Critical:  ${stats.byPriority.critical}`);
    console.log(`🟠 High:      ${stats.byPriority.high}`);
    console.log(`🟡 Medium:    ${stats.byPriority.medium}`);
    console.log(`🟢 Low:       ${stats.byPriority.low}`);

    console.log('\n─'.repeat(60));
    console.log('BY SECTION');
    console.log('─'.repeat(60));
    for (const [section, count] of Object.entries(stats.bySection)) {
      console.log(`  ${section}: ${count}`);
    }

    console.log('\n─'.repeat(60));
    console.log('BY TAG (Top 10)');
    console.log('─'.repeat(60));
    const sortedTags = Object.entries(stats.byTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [tag, count] of sortedTags) {
      console.log(`  @${tag}: ${count}`);
    }

    // Export to JSON
    exportToJson(checklist, OUTPUT_PATH);
    console.log(`\n✅ Exported to: ${OUTPUT_PATH}\n`);

    // Print sample test cases
    console.log('─'.repeat(60));
    console.log('SAMPLE TEST CASES (First 5)');
    console.log('─'.repeat(60));
    let count = 0;
    outer: for (const section of checklist.sections) {
      for (const subsection of section.subsections) {
        for (const test of subsection.tests) {
          if (count >= 5) break outer;
          console.log(`\n${test.id} [${test.priority.toUpperCase()}]`);
          console.log(`  Section: ${test.section}`);
          console.log(`  Subsection: ${test.subsection}`);
          console.log(`  Description: ${test.description}`);
          console.log(`  Tags: ${test.tags.join(', ')}`);
          console.log(`  Automatable: ${test.automatable ? 'Yes' : 'No'}`);
          count++;
        }
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Parsing complete!');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error parsing checklist:', error);
    process.exit(1);
  }
}

main();
