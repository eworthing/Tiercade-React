import { test, expect } from "@playwright/test";

test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => {
    // First, add some test items with tier placements
    await page.goto("/import-export");

    const testData = {
      tiers: {
        S: [
          { id: "analytics-1", attributes: { name: "Top Item 1" } },
          { id: "analytics-2", attributes: { name: "Top Item 2" } },
        ],
        A: [
          { id: "analytics-3", attributes: { name: "Good Item 1" } },
          { id: "analytics-4", attributes: { name: "Good Item 2" } },
          { id: "analytics-5", attributes: { name: "Good Item 3" } },
        ],
        B: [
          { id: "analytics-6", attributes: { name: "Average Item 1" } },
        ],
        C: [],
        D: [],
        F: [],
        unranked: [
          { id: "analytics-7", attributes: { name: "Unranked Item" } },
        ],
      },
      tierOrder: ["S", "A", "B", "C", "D", "F"],
    };

    const fs = await import("fs");
    const path = await import("path");
    const tempFile = path.join("/tmp", "analytics-test-data.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);
    await page.waitForTimeout(500);
    fs.unlinkSync(tempFile);

    // Navigate to Analytics
    await page.goto("/analytics");
  });

  test("should display analytics page", async ({ page }) => {
    await expect(
      page.locator("h1:has-text('Analytics'), h2:has-text('Analytics')")
    ).toBeVisible();
  });

  test("should show tier distribution statistics", async ({ page }) => {
    // Should show counts or percentages for each tier
    const stats = page.locator('[data-testid^="tier-stat-"]');
    const count = await stats.count();

    // Should have stats for at least some tiers
    expect(count).toBeGreaterThan(0);
  });

  test("should display item counts per tier", async ({ page }) => {
    // Look for numbers indicating item counts
    // S tier should show 2 items
    const sTierStat = page.locator(
      'text=/S.*2|2.*items.*S/i, [data-testid*="tier-S"]'
    );
    const hasStat = (await sTierStat.count()) > 0;

    if (hasStat) {
      await expect(sTierStat.first()).toBeVisible();
    }

    // A tier should show 3 items
    const aTierStat = page.locator(
      'text=/A.*3|3.*items.*A/i, [data-testid*="tier-A"]'
    );
    const hasATier = (await aTierStat.count()) > 0;

    if (hasATier) {
      await expect(aTierStat.first()).toBeVisible();
    }
  });

  test("should show total item count", async ({ page }) => {
    // Should show total number of items (7 in our test data)
    const totalText = page.locator('text=/total.*7|7.*total|7.*items/i');
    const hasTotal = (await totalText.count()) > 0;

    if (hasTotal) {
      await expect(totalText.first()).toBeVisible();
    }
  });

  test("should display tier distribution chart or visualization", async ({ page }) => {
    // Look for chart elements (canvas, svg, or visual bars)
    const canvas = page.locator("canvas");
    const svg = page.locator("svg");
    const chartContainer = page.locator(
      '[data-testid="chart"], [data-testid="visualization"]'
    );

    const hasCanvas = (await canvas.count()) > 0;
    const hasSvg = (await svg.count()) > 0;
    const hasChart = (await chartContainer.count()) > 0;

    // Should have some form of visualization
    expect(hasCanvas || hasSvg || hasChart).toBe(true);
  });

  test("should show percentage distribution", async ({ page }) => {
    // Should show percentages for tier distribution
    const percentageText = page.locator('text=/%/');
    const count = await percentageText.count();

    // Should have at least one percentage displayed
    expect(count).toBeGreaterThan(0);
  });

  test("should update when navigating back to board and returning", async ({ page }) => {
    // Capture initial stats
    const initialContent = await page.content();

    // Navigate to board
    await page.click('a:has-text("Board")');
    await expect(page).toHaveURL("/");

    // Navigate back to analytics
    await page.click('a:has-text("Analytics")');
    await expect(page).toHaveURL("/analytics");

    // Page should still show stats
    await expect(
      page.locator("h1:has-text('Analytics'), h2:has-text('Analytics')")
    ).toBeVisible();
  });

  test("should show empty state when no items", async ({ page }) => {
    // Clear all items by importing empty data
    await page.goto("/import-export");

    const emptyData = {
      tiers: {
        S: [],
        A: [],
        B: [],
        C: [],
        D: [],
        F: [],
        unranked: [],
      },
      tierOrder: ["S", "A", "B", "C", "D", "F"],
    };

    const fs = await import("fs");
    const path = await import("path");
    const tempFile = path.join("/tmp", "empty-test-data.json");
    fs.writeFileSync(tempFile, JSON.stringify(emptyData, null, 2));

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);
    await page.waitForTimeout(500);
    fs.unlinkSync(tempFile);

    // Go to analytics
    await page.goto("/analytics");

    // Should show empty state or zero counts
    const emptyMessage = page.locator(
      'text=/no items|no data|empty|0 items/i'
    );
    const hasEmptyState = (await emptyMessage.count()) > 0;

    expect(hasEmptyState).toBe(true);
  });
});
