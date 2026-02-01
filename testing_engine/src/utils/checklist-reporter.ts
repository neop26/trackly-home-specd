/**
 * Custom Checklist Reporter
 * 
 * Tracks test results against the original checklist
 * and generates a compliance report.
 */

import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface ChecklistResult {
  id: string;
  description: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  error?: string;
}

interface ChecklistReport {
  timestamp: string;
  duration: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
    passRate: string;
  };
  results: ChecklistResult[];
  failedTests: Array<{
    title: string;
    file: string;
    error: string;
  }>;
}

class ChecklistReporter implements Reporter {
  private results: ChecklistResult[] = [];
  private failedTests: ChecklistReport['failedTests'] = [];
  private startTime: number = 0;
  private outputPath: string;

  constructor(options: { outputFile?: string } = {}) {
    this.outputPath = options.outputFile || 
      path.resolve(__dirname, '../../reports/checklist-results.json');
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    console.log('\n📋 Checklist Reporter: Starting test run...\n');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Extract checklist ID from test title or annotations
    const idMatch = test.title.match(/TC-\d{4}/);
    const id = idMatch ? idMatch[0] : `auto-${test.id}`;

    const checklistResult: ChecklistResult = {
      id,
      description: test.title,
      status: this.mapStatus(result.status),
      duration: result.duration,
    };

    if (result.status === 'failed' && result.error) {
      checklistResult.error = result.error.message;
      this.failedTests.push({
        title: test.title,
        file: test.location.file,
        error: result.error.message || 'Unknown error',
      });
    }

    this.results.push(checklistResult);
  }

  onEnd(result: FullResult): void {
    const duration = Date.now() - this.startTime;

    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const pending = this.results.filter(r => r.status === 'pending').length;
    const total = this.results.length;

    const report: ChecklistReport = {
      timestamp: new Date().toISOString(),
      duration,
      summary: {
        total,
        passed,
        failed,
        skipped,
        pending,
        passRate: `${total > 0 ? Math.round((passed / total) * 100) : 0}%`,
      },
      results: this.results,
      failedTests: this.failedTests,
    };

    // Ensure reports directory exists
    const reportsDir = path.dirname(this.outputPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Write report
    fs.writeFileSync(this.outputPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '═'.repeat(60));
    console.log('📋 CHECKLIST TEST RESULTS');
    console.log('═'.repeat(60));
    console.log(`\n⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total:   ${total}`);
    console.log(`   ✅ Passed:  ${passed}`);
    console.log(`   ❌ Failed:  ${failed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ⏸️  Pending: ${pending}`);
    console.log(`\n📈 Pass Rate: ${report.summary.passRate}`);

    if (this.failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      for (const test of this.failedTests.slice(0, 5)) {
        console.log(`   - ${test.title}`);
        console.log(`     Error: ${test.error.substring(0, 80)}...`);
      }
      if (this.failedTests.length > 5) {
        console.log(`   ... and ${this.failedTests.length - 5} more`);
      }
    }

    console.log(`\n📁 Full report: ${this.outputPath}`);
    console.log('═'.repeat(60) + '\n');
  }

  private mapStatus(status: TestResult['status']): ChecklistResult['status'] {
    switch (status) {
      case 'passed':
        return 'passed';
      case 'failed':
      case 'timedOut':
        return 'failed';
      case 'skipped':
        return 'skipped';
      case 'interrupted':
        return 'pending';
      default:
        return 'pending';
    }
  }
}

export default ChecklistReporter;
