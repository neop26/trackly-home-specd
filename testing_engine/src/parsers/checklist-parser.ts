/**
 * Checklist Parser
 * 
 * Parses markdown testing checklists and extracts test cases
 * with metadata for automated test generation and tracking.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TestCase {
  id: string;
  section: string;
  subsection: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  automatable: boolean;
  lineNumber: number;
}

export interface TestSection {
  id: string;
  title: string;
  subsections: TestSubsection[];
  testCount: number;
}

export interface TestSubsection {
  id: string;
  title: string;
  tests: TestCase[];
}

export interface ParsedChecklist {
  title: string;
  version: string;
  date: string;
  sections: TestSection[];
  totalTests: number;
  metadata: Record<string, string>;
}

/**
 * Parse a markdown checklist file into structured test cases
 */
export function parseChecklist(filePath: string): ParsedChecklist {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const result: ParsedChecklist = {
    title: '',
    version: '1.0',
    date: new Date().toISOString().split('T')[0],
    sections: [],
    totalTests: 0,
    metadata: {},
  };

  let currentSection: TestSection | null = null;
  let currentSubsection: TestSubsection | null = null;
  let sectionCounter = 0;
  let subsectionCounter = 0;
  let testCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Parse title (# heading)
    if (line.startsWith('# ') && !result.title) {
      result.title = line.replace('# ', '').trim();
      continue;
    }

    // Parse metadata from frontmatter-style content
    const metadataMatch = line.match(/^\*\*([^:]+):\*\*\s*(.+)$/);
    if (metadataMatch) {
      const [, key, value] = metadataMatch;
      result.metadata[key.toLowerCase().replace(/\s+/g, '_')] = value.trim();
      if (key.toLowerCase() === 'document version') {
        result.version = value.trim();
      }
      if (key.toLowerCase() === 'date') {
        result.date = value.trim();
      }
      continue;
    }

    // Parse section (## heading)
    const sectionMatch = line.match(/^## (\d+)\.\s+(.+)$/);
    if (sectionMatch) {
      sectionCounter++;
      subsectionCounter = 0;
      currentSection = {
        id: `section-${sectionCounter}`,
        title: sectionMatch[2].trim(),
        subsections: [],
        testCount: 0,
      };
      result.sections.push(currentSection);
      currentSubsection = null;
      continue;
    }

    // Parse subsection (### heading)
    const subsectionMatch = line.match(/^### (\d+\.\d+)\s+(.+)$/);
    if (subsectionMatch && currentSection) {
      subsectionCounter++;
      currentSubsection = {
        id: `subsection-${sectionCounter}-${subsectionCounter}`,
        title: subsectionMatch[2].trim(),
        tests: [],
      };
      currentSection.subsections.push(currentSubsection);
      continue;
    }

    // Parse test case (- [ ] checkbox)
    const testMatch = line.match(/^- \[([ x])\]\s+(.+)$/);
    if (testMatch && currentSubsection) {
      testCounter++;
      const description = testMatch[2].trim();
      const isChecked = testMatch[1] === 'x';

      const testCase: TestCase = {
        id: `TC-${String(testCounter).padStart(4, '0')}`,
        section: currentSection?.title || 'Unknown',
        subsection: currentSubsection.title,
        description,
        priority: determinePriority(description, currentSubsection.title),
        tags: extractTags(description, currentSection?.title || '', currentSubsection.title),
        status: isChecked ? 'passed' : 'pending',
        automatable: isAutomatable(description),
        lineNumber,
      };

      currentSubsection.tests.push(testCase);
      if (currentSection) {
        currentSection.testCount++;
      }
      result.totalTests++;
    }
  }

  return result;
}

/**
 * Determine test priority based on description and context
 */
function determinePriority(description: string, subsection: string): TestCase['priority'] {
  const desc = description.toLowerCase();
  const sub = subsection.toLowerCase();

  // Critical: Authentication, data persistence, core CRUD
  if (
    desc.includes('sign in') ||
    desc.includes('sign out') ||
    desc.includes('cannot') ||
    desc.includes('persist') ||
    desc.includes('save') ||
    desc.includes('create') && sub.includes('create') ||
    desc.includes('delete') && sub.includes('delete')
  ) {
    return 'critical';
  }

  // High: Core functionality
  if (
    desc.includes('filter') ||
    desc.includes('sort') ||
    desc.includes('display') ||
    desc.includes('update') ||
    desc.includes('edit')
  ) {
    return 'high';
  }

  // Medium: UI/UX, secondary features
  if (
    desc.includes('visual') ||
    desc.includes('button') ||
    desc.includes('dropdown') ||
    desc.includes('modal')
  ) {
    return 'medium';
  }

  // Low: Edge cases, accessibility
  return 'low';
}

/**
 * Extract tags from test description and context
 */
function extractTags(description: string, section: string, subsection: string): string[] {
  const tags: string[] = [];
  const desc = description.toLowerCase();
  const sec = section.toLowerCase();
  const sub = subsection.toLowerCase();

  // Feature tags
  if (sec.includes('authentication')) tags.push('auth');
  if (sec.includes('task management') || sec.includes('task')) tags.push('tasks');
  if (sec.includes('filter')) tags.push('filters');
  if (sec.includes('sort')) tags.push('sorting');
  if (sec.includes('bulk')) tags.push('bulk-actions');
  if (sec.includes('deleted')) tags.push('deleted-tasks');
  if (sec.includes('notes')) tags.push('notes');
  if (sec.includes('ui/ux') || sec.includes('accessibility')) tags.push('ui');
  if (sec.includes('performance')) tags.push('performance');
  if (sec.includes('member') || sec.includes('role')) tags.push('roles');

  // Test type tags
  if (desc.includes('error') || desc.includes('fail') || desc.includes('invalid')) {
    tags.push('negative');
  }
  if (desc.includes('mobile') || desc.includes('tablet')) {
    tags.push('responsive');
  }
  if (desc.includes('keyboard') || desc.includes('screen reader') || desc.includes('aria')) {
    tags.push('accessibility');
  }

  // Priority tags
  if (sub.includes('basic') || sub.includes('core')) tags.push('smoke');
  if (desc.includes('persist') || desc.includes('save')) tags.push('critical');

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Determine if a test case can be automated
 */
function isAutomatable(description: string): boolean {
  const desc = description.toLowerCase();

  // Manual-only tests
  const manualKeywords = [
    'visually',
    'look and feel',
    'intuitive',
    'user experience',
    'screen reader',
    'color contrast',
    'accessibility standards',
    'memory leak',
    'real-time',
    'concurrent user',
  ];

  return !manualKeywords.some(keyword => desc.includes(keyword));
}

/**
 * Export parsed checklist to JSON
 */
export function exportToJson(checklist: ParsedChecklist, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(checklist, null, 2));
}

/**
 * Generate test statistics
 */
export function getStatistics(checklist: ParsedChecklist): {
  totalTests: number;
  automatableTests: number;
  manualTests: number;
  byPriority: Record<string, number>;
  bySection: Record<string, number>;
  byTag: Record<string, number>;
} {
  const stats = {
    totalTests: checklist.totalTests,
    automatableTests: 0,
    manualTests: 0,
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
    bySection: {} as Record<string, number>,
    byTag: {} as Record<string, number>,
  };

  for (const section of checklist.sections) {
    stats.bySection[section.title] = section.testCount;

    for (const subsection of section.subsections) {
      for (const test of subsection.tests) {
        if (test.automatable) {
          stats.automatableTests++;
        } else {
          stats.manualTests++;
        }

        stats.byPriority[test.priority]++;

        for (const tag of test.tags) {
          stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
        }
      }
    }
  }

  return stats;
}

/**
 * Filter tests by criteria
 */
export function filterTests(
  checklist: ParsedChecklist,
  criteria: {
    priority?: TestCase['priority'][];
    tags?: string[];
    automatable?: boolean;
    section?: string;
  }
): TestCase[] {
  const results: TestCase[] = [];

  for (const section of checklist.sections) {
    if (criteria.section && !section.title.toLowerCase().includes(criteria.section.toLowerCase())) {
      continue;
    }

    for (const subsection of section.subsections) {
      for (const test of subsection.tests) {
        let matches = true;

        if (criteria.priority && !criteria.priority.includes(test.priority)) {
          matches = false;
        }

        if (criteria.tags && !criteria.tags.some(tag => test.tags.includes(tag))) {
          matches = false;
        }

        if (criteria.automatable !== undefined && test.automatable !== criteria.automatable) {
          matches = false;
        }

        if (matches) {
          results.push(test);
        }
      }
    }
  }

  return results;
}
