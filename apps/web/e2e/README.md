# Tiercade Web App E2E Tests

End-to-end tests for the Tiercade web application using Playwright.

## Test Coverage

- **tier-board.spec.ts** - Tier board display, navigation, undo/redo functionality
- **themes.spec.ts** - Theme selection, preview, and persistence
- **import-export.spec.ts** - Import/export in JSON, CSV, Markdown, Text formats
- **head-to-head.spec.ts** - Head-to-Head comparison workflow and tier application
- **analytics.spec.ts** - Analytics page statistics and visualizations

## Running Tests

### Prerequisites

```bash
# Install dependencies (from apps/web directory)
npm install

# Install Playwright browsers
npx playwright install
```

### Run Tests

```bash
# Run all tests headless
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Run specific test file
npx playwright test tier-board.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View Test Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Test Structure

Each test file follows this pattern:

1. **Setup** (`beforeEach`) - Navigate to page, optionally load test data
2. **Test cases** - Verify UI elements, interactions, and state changes
3. **Assertions** - Check visibility, values, navigation, etc.

## Test Data

Tests use temporary JSON/CSV files for import testing. Files are:
- Created in `/tmp` directory
- Automatically cleaned up after tests

## Debugging Tests

```bash
# Run in debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test tier-board.spec.ts --debug

# Generate trace for failed tests
npx playwright test --trace on
```

## CI/CD

The configuration (`playwright.config.ts`) is optimized for CI:
- Retries failed tests 2 times in CI
- Uses single worker in CI
- Captures screenshots on failure
- Generates trace on first retry

## Adding New Tests

1. Create new `.spec.ts` file in `e2e/` directory
2. Import `test` and `expect` from `@playwright/test`
3. Add `data-testid` attributes to components for reliable selectors
4. Follow existing patterns for consistency

## Test ID Conventions

Components use `data-testid` attributes:
- Tier rows: `tier-row-{tierId}` (e.g., `tier-row-S`)
- Item cards: `item-card-{itemId}` (e.g., `item-card-123`)
- Theme cards: `theme-card-{themeId}` (e.g., `theme-card-smash-classic`)
- Current theme: `current-theme`
- Theme preview: `theme-preview`
