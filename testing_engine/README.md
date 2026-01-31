# Trackly Home — E2E Testing Engine

A comprehensive End-to-End testing framework built with Playwright, designed to automate testing from markdown checklists.

## 🎯 Features

- **Checklist-Driven Testing**: Automatically parses markdown test checklists and generates test cases
- **Page Object Model**: Clean, maintainable test architecture
- **Multi-Browser Support**: Chrome, Firefox, Safari, Mobile devices
- **Parallel Execution**: Fast test runs with configurable workers
- **Rich Reporting**: HTML, JSON, JUnit reports + custom checklist compliance report
- **CI/CD Ready**: GitHub Actions workflow included
- **Tag-Based Filtering**: Run smoke, critical, regression, or feature-specific tests

## 📁 Project Structure

```
testing_engine/
├── .github/
│   └── workflows/
│       └── e2e-tests.yml       # GitHub Actions workflow
├── config/
│   ├── parsed-tests.json       # Generated from checklist
│   └── storage-state.json      # Auth state (generated)
├── reports/
│   ├── html/                   # Playwright HTML report
│   ├── json/                   # JSON results
│   ├── junit/                  # JUnit XML for CI
│   └── checklist-results.json  # Custom checklist report
├── src/
│   ├── fixtures/
│   │   ├── global-setup.ts     # Pre-test setup
│   │   ├── global-teardown.ts  # Post-test cleanup
│   │   └── test-data.ts        # Test data & utilities
│   ├── pages/
│   │   ├── base.page.ts        # Base page object
│   │   ├── auth.page.ts        # Authentication page
│   │   ├── tasks.page.ts       # Tasks management page
│   │   └── deleted-tasks.page.ts
│   ├── parsers/
│   │   ├── checklist-parser.ts # Markdown parser
│   │   ├── run-parser.ts       # CLI runner
│   │   └── generate-tests.ts   # Test generator
│   ├── specs/
│   │   ├── 01-authentication.spec.ts
│   │   ├── 02-task-crud.spec.ts
│   │   ├── 03-filtering.spec.ts
│   │   ├── 04-sorting.spec.ts
│   │   └── 05-bulk-actions.spec.ts
│   └── utils/
│       ├── checklist-reporter.ts # Custom reporter
│       └── helpers.ts           # Test utilities
├── .env.example                 # Environment template
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

## 🚀 Quick Start

### Installation

```bash
cd testing_engine
npm install
npx playwright install
```

### Configuration

1. Copy environment template:
```bash
cp .env.example .env
```

2. Configure your environment:
```env
BASE_URL=http://localhost:5173
# Or for deployed environments:
# BASE_URL=https://witty-bay-0b4318700.1.azurestaticapps.net
```

### Running Tests

```bash
# Run all tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run specific test suites
npm run test:smoke      # Quick smoke tests
npm run test:critical   # Critical path tests
npm run test:regression # Full regression suite

# Run by browser
npm run test:chrome
npm run test:firefox
npm run test:safari
npm run test:mobile

# Run specific spec file
npx playwright test 02-task-crud.spec.ts

# Run with debug mode
npm run test:debug
```

## 📋 Checklist Integration

### Parse Testing Checklist

The engine can parse your markdown testing checklist and extract test cases:

```bash
npm run parse:checklist
```

This reads `docs/TESTING_CHECKLIST.md` and outputs:
- Parsed test cases to `config/parsed-tests.json`
- Statistics on total tests, priorities, tags
- Automation coverage analysis

### Generate Test Skeletons

Auto-generate Playwright test files from the checklist:

```bash
npm run generate:tests
npm run generate:tests -- --overwrite  # Overwrite existing
npm run generate:tests -- --include-manual  # Include manual tests
```

## 🏷️ Test Tags

Tests use tags for filtering:

| Tag | Description |
|-----|-------------|
| `@smoke` | Quick sanity tests (~2 min) |
| `@critical` | Critical path tests (~10 min) |
| `@regression` | Full regression (~30 min) |
| `@auth` | Authentication tests |
| `@tasks` | Task management tests |
| `@filters` | Filter functionality |
| `@bulk-actions` | Bulk operations |
| `@ui` | UI/UX tests |
| `@manual` | Requires human verification |

Run by tag:
```bash
npx playwright test --grep @smoke
npx playwright test --grep "@critical|@smoke"
npx playwright test --grep-invert @manual
```

## 🔑 Authentication

This testing engine solves the magic link authentication challenge using Supabase Admin API:

### How It Works

1. **No Passwords Required**: Trackly uses magic link authentication only
2. **Admin API Bypass**: Uses Supabase's `auth.admin.generateLink()` to create auth links
3. **Automatic Session**: Saves browser storage state for all subsequent tests

### Required Environment Variables

```env
SUPABASE_URL=http://localhost:54321  # or your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TEST_USER_EMAIL=e2e-test@trackly.local
```

### How to Get Credentials

**Local (Docker Supabase):**
```bash
cd supabase
cat .env  # Contains service_role_key
```

**Hosted Supabase:**
1. Go to your project settings
2. Navigate to API section
3. Copy the `service_role` key (keep this secret!)

## 📊 Reports

### View HTML Report

After running tests:
```bash
npm run report
# Or manually open:
npx playwright show-report
```

This opens an interactive HTML report showing:
- Test pass/fail status
- Test duration
- Screenshots of failures
- Video recordings (on failure)
- Trace files for debugging

### View Test Traces

For failed tests with traces:
```bash
npx playwright show-trace reports/test-results/path-to-trace/trace.zip
```

### Checklist Compliance Report

After each run, `reports/checklist-results.json` contains:
- Test ID mapping to checklist items
- Pass/fail status per item
- Overall compliance percentage
- Failed test details

## 🔄 CI/CD Integration

### GitHub Actions

The workflow (`.github/workflows/e2e-tests.yml`) supports:

**Manual Trigger:**
- Select environment (local, dev, production)
- Select test suite (smoke, critical, regression, all)
- Select browser (chromium, firefox, webkit, all)

**Automatic Triggers:**
- PR to main/dev: Smoke tests
- Push to dev: Full smoke suite

### Running in CI

```yaml
- name: Run E2E tests
  working-directory: testing_engine
  run: npx playwright test --grep @smoke
  env:
    BASE_URL: ${{ secrets.DEV_URL }}
    CI: true
```

## 🧪 Writing Tests

### Page Object Pattern

```typescript
// Use existing page objects
import { TasksPage } from '../pages/tasks.page';

test('should create a task', async ({ page }) => {
  const tasksPage = new TasksPage(page);
  await tasksPage.navigateToTasks();
  await tasksPage.createTask({ title: 'New Task' });
  await tasksPage.assertTaskVisible('New Task');
});
```

### Test Data

```typescript
import { testData, testUsers } from '../fixtures/test-data';

// Generate unique test data
const taskTitle = testData.uniqueTaskTitle('My Test');
const dueDate = testData.futureDate(7);

// Use test users
const owner = testUsers.owner;
```

### Tags in Tests

```typescript
test('should work @smoke @critical', async ({ page }) => {
  // This test runs in both smoke and critical suites
});

test('manual visual check @manual', async ({ page }) => {
  test.skip(true, 'Manual test - requires human verification');
});
```

## 🔧 Configuration

### playwright.config.ts

Key settings:
- `timeout`: 60 seconds per test
- `retries`: 2 on CI, 0 locally
- `workers`: 2 on CI, auto locally
- `reporter`: HTML, JSON, JUnit, Custom checklist

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application URL | `http://localhost:5173` |
| `CI` | CI environment flag | `false` |
| `START_SERVER` | Start dev server | `false` |
| `HEADLESS` | Run headless | `true` |
| `TEST_USER_EMAIL` | Test user email | - |
| `TEST_AUTH_TOKEN` | Pre-authenticated token | - |

## 📈 Best Practices

1. **Use Page Objects**: Don't put selectors in tests
2. **Tag Tests Appropriately**: Use @smoke, @critical consistently
3. **Keep Tests Independent**: Each test should setup its own data
4. **Clean Up**: Delete test data after tests complete
5. **Use Meaningful Names**: Test names should describe the behavior
6. **Avoid Flaky Tests**: Use proper waits, not arbitrary delays

## 🐛 Debugging

```bash
# Debug mode with Playwright Inspector
npm run test:debug

# Run single test with trace
npx playwright test "task creation" --trace on

# View trace
npx playwright show-trace reports/test-results/trace.zip
```

## 📝 Checklist Source Format

The parser expects this markdown format:

```markdown
## 1. Section Name

### 1.1 Subsection Name
- [ ] Test case description @tag
- [x] Completed test case
```

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-31  
**Playwright Version:** 1.50.0

## 🔐 GitHub Actions Secrets

For CI/CD, add these secrets to your repository:

| Secret | Description |
|--------|-------------|
| `DEV_SUPABASE_URL` | Dev environment Supabase URL |
| `DEV_SUPABASE_SERVICE_ROLE_KEY` | Dev Supabase service role key |
| `E2E_TEST_USER_EMAIL` | Email for test user (optional, defaults to `e2e-test@trackly.dev`) |

### Adding Secrets

1. Go to your repository Settings
2. Navigate to Secrets and Variables → Actions
3. Add each secret with the appropriate value
