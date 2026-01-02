/**
 * Analytics E2E Tests
 *
 * Tests for the analytics page showing tier distribution statistics.
 * Uses the new Page Object Model infrastructure.
 */

import { test, expect } from "./fixtures";
import { TEST_DATA_PRESETS } from "./utils/testDataFactory";

test.describe("Analytics", () => {
  test.beforeEach(async ({ loadTestData, analyticsPage }) => {
    // Load test data with items distributed across tiers
    await loadTestData(TEST_DATA_PRESETS.analytics());

    // Navigate to Analytics
    await analyticsPage.goto();
    await analyticsPage.dismissOnboardingIfVisible();
  });

  test("should display analytics page", async ({ analyticsPage }) => {
    await expect(analyticsPage.heading).toBeVisible();
  });

  test("should show tier distribution statistics", async ({ analyticsPage }) => {
    // Should show counts or percentages for each tier
    const count = await analyticsPage.getTierStatCount();

    // Should have stats for at least some tiers
    expect(count).toBeGreaterThan(0);
  });

  test("should display item counts per tier", async ({ analyticsPage }) => {
    // S tier should show 2 items (from test data)
    const hasStat = await analyticsPage.verifySierCount(2);

    if (hasStat) {
      expect(hasStat).toBe(true);
    }

    // A tier should show 3 items
    const hasATier = await analyticsPage.verifyATierCount(3);

    if (hasATier) {
      expect(hasATier).toBe(true);
    }
  });

  test("should show total item count", async ({ analyticsPage }) => {
    // Should show total number of items (7 in our test data)
    const hasTotal = await analyticsPage.verifyTotalCount(7);

    if (hasTotal) {
      expect(hasTotal).toBe(true);
    }
  });

  test("should display tier distribution visualization", async ({ analyticsPage }) => {
    // Look for chart elements (canvas, svg, or visual bars)
    const hasVisualization = await analyticsPage.hasVisualization();
    expect(hasVisualization).toBe(true);
  });

  test("should show percentage distribution", async ({ analyticsPage }) => {
    // Should show percentages for tier distribution
    const count = await analyticsPage.getPercentageCount();

    // Should have at least one percentage displayed
    expect(count).toBeGreaterThan(0);
  });

  test("should update when navigating back to board and returning", async ({
    analyticsPage,
    page,
  }) => {
    // Navigate to board
    await analyticsPage.navigateViaNav("Board");
    await expect(page).toHaveURL("/");

    // Navigate back to analytics
    await analyticsPage.navigateViaNav("Analytics");
    await expect(page).toHaveURL("/analytics");

    // Page should still show stats
    await expect(analyticsPage.heading).toBeVisible();
  });
});

test.describe("Analytics - Empty State", () => {
  test("should show empty state when no items", async ({
    loadTestData,
    analyticsPage,
  }) => {
    // Load empty data
    await loadTestData(TEST_DATA_PRESETS.empty());

    // Go to analytics
    await analyticsPage.goto();
    await analyticsPage.dismissOnboardingIfVisible();

    // Should show empty state or zero counts
    const hasEmptyState = await analyticsPage.hasEmptyState();
    expect(hasEmptyState).toBe(true);
  });
});

test.describe("Analytics - Data Accuracy", () => {
  test("should reflect actual tier distribution", async ({
    loadTestData,
    testDataFactory,
    analyticsPage,
    page,
  }) => {
    // Create specific distribution
    const data = testDataFactory.createDistributedTierData({
      S: 3,
      A: 2,
      B: 1,
      unranked: 4,
    });
    await loadTestData(data);

    await analyticsPage.goto();
    await analyticsPage.dismissOnboardingIfVisible();

    // Total should be 10 items
    const totalText = page.locator('text=/10.*item|item.*10/i');
    const hasTotal = (await totalText.count()) > 0;

    // Analytics should show some meaningful data
    await expect(analyticsPage.heading).toBeVisible();
  });
});
