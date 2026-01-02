/**
 * Templates Page E2E Tests
 *
 * Tests for the template library functionality including:
 * - Template display and filtering
 * - Category navigation
 * - Search functionality
 * - Template preview
 * - Template usage/application
 */

import { test, expect } from "./fixtures";

test.describe("Templates Page", () => {
  test.beforeEach(async ({ templatesPage }) => {
    await templatesPage.goto();
    // Dismiss onboarding wizard if it appears
    await templatesPage.dismissOnboardingIfVisible();
  });

  test("should display templates page with header", async ({ templatesPage }) => {
    await expect(templatesPage.heading).toBeVisible();
  });

  test("should display template cards", async ({ templatesPage }) => {
    const count = await templatesPage.getTemplateCount();
    expect(count).toBeGreaterThan(0);
  });

  test("should display featured templates section on initial load", async ({
    templatesPage,
  }) => {
    // Featured section is shown when no filters are active
    const hasFeatured = await templatesPage.hasFeaturedSection();
    expect(hasFeatured).toBe(true);
  });

  test("should filter templates by category", async ({ templatesPage }) => {
    // Get initial count
    const initialCount = await templatesPage.getTemplateCount();
    expect(initialCount).toBeGreaterThan(0);

    // Select a category using actual category name from TEMPLATE_CATEGORIES
    await templatesPage.selectCategory("Entertainment");
    await templatesPage.waitForContentUpdate();

    // Featured section should be hidden when filter is active
    const hasFeatured = await templatesPage.hasFeaturedSection();
    expect(hasFeatured).toBe(false);

    // Reset to all
    await templatesPage.showAllTemplates();
    await templatesPage.waitForContentUpdate();

    const resetCount = await templatesPage.getTemplateCount();
    expect(resetCount).toBe(initialCount);
  });

  test("should search templates", async ({ templatesPage }) => {
    // Search for something specific
    await templatesPage.search("movie");
    await templatesPage.waitForContentUpdate();

    const count = await templatesPage.getTemplateCount();
    // Should find at least one movie-related template
    expect(count).toBeGreaterThan(0);
  });

  test("should show no results for non-existent search", async ({
    templatesPage,
  }) => {
    const initialCount = await templatesPage.getTemplateCount();
    expect(initialCount).toBeGreaterThan(0);

    await templatesPage.search("xyz123nonexistent");
    await templatesPage.waitForContentUpdate();

    const hasNoResults = await templatesPage.hasNoResults();
    expect(hasNoResults).toBe(true);
  });

  test("should clear search and restore templates", async ({ templatesPage }) => {
    const initialCount = await templatesPage.getTemplateCount();

    // Search and then clear
    await templatesPage.search("movie");
    await templatesPage.waitForContentUpdate();

    await templatesPage.clearSearch();
    await templatesPage.waitForContentUpdate();

    const resetCount = await templatesPage.getTemplateCount();
    expect(resetCount).toBe(initialCount);
  });

  test("should open template preview modal", async ({ templatesPage }) => {
    // Wait for templates to load
    await expect(templatesPage.templateCards.first()).toBeVisible();

    // Preview the first template
    await templatesPage.previewTemplateAt(0);

    const isOpen = await templatesPage.isPreviewOpen();
    expect(isOpen).toBe(true);
  });

  test("should display tier structure in preview", async ({ templatesPage }) => {
    await expect(templatesPage.templateCards.first()).toBeVisible();
    await templatesPage.previewTemplateAt(0);

    // Preview should show tier labels
    const tierLabels = templatesPage.previewTierLabels;
    const count = await tierLabels.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("should close preview modal", async ({ templatesPage }) => {
    await expect(templatesPage.templateCards.first()).toBeVisible();
    await templatesPage.previewTemplateAt(0);
    expect(await templatesPage.isPreviewOpen()).toBe(true);

    await templatesPage.closePreview();
    await templatesPage.waitForAnimation();

    expect(await templatesPage.isPreviewOpen()).toBe(false);
  });

  test("should use template and navigate to board", async ({
    templatesPage,
    page,
  }) => {
    await expect(templatesPage.templateCards.first()).toBeVisible();

    // Use the first template
    await templatesPage.useTemplateAt(0);

    // Should navigate to the tier board
    await page.waitForURL("/", { timeout: 5000 });

    // Tier board should be visible
    await expect(page.locator('[data-testid="tier-row-S"]')).toBeVisible();
  });

  test("should use template from preview modal", async ({
    templatesPage,
    page,
  }) => {
    await expect(templatesPage.templateCards.first()).toBeVisible();

    // Open preview
    await templatesPage.previewTemplateAt(0);
    expect(await templatesPage.isPreviewOpen()).toBe(true);

    // Use from preview
    await templatesPage.useFromPreview();

    // Should navigate to board
    await page.waitForURL("/", { timeout: 5000 });
  });

  test("should show items in unranked after using template", async ({
    templatesPage,
    page,
  }) => {
    // Search for a known template with items
    await templatesPage.search("Movie Genres");
    await templatesPage.waitForContentUpdate();

    await expect(templatesPage.templateCards.first()).toBeVisible();

    // Use the Movie Genres template
    await templatesPage.useTemplateAt(0);

    // Navigate check
    await page.waitForURL("/", { timeout: 5000 });

    // Wait for tier board to fully load
    await page.waitForTimeout(500);

    // Items should be in unranked (templates put items in unranked by default)
    const unrankedRow = page.locator('[data-testid="tier-row-unranked"]');
    await expect(unrankedRow).toBeVisible();

    const unrankedItems = unrankedRow.locator('[data-testid^="item-card-"]');
    const count = await unrankedItems.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Templates - Navigation", () => {
  test("should be accessible from main navigation", async ({ tierBoardPage, page }) => {
    await tierBoardPage.goto();
    await tierBoardPage.dismissOnboardingIfVisible();

    // Wait for page to be fully interactive
    await page.waitForLoadState("domcontentloaded");

    // Click templates link with force to bypass any animation issues
    const templatesLink = page.locator('a:has-text("Templates")').first();
    await expect(templatesLink).toBeVisible();
    await templatesLink.click({ force: true });

    await expect(page).toHaveURL("/templates");
  });

  test("should navigate back to board after using template", async ({
    templatesPage,
    page,
  }) => {
    await templatesPage.goto();
    await templatesPage.dismissOnboardingIfVisible();
    await expect(templatesPage.templateCards.first()).toBeVisible();

    await templatesPage.useTemplateAt(0);

    // Should be on tier board
    await page.waitForURL("/", { timeout: 5000 });
    await expect(page.locator('[data-testid^="tier-row-"]').first()).toBeVisible();
  });
});

test.describe("Templates - Category Filters", () => {
  test.beforeEach(async ({ templatesPage }) => {
    await templatesPage.goto();
    await templatesPage.dismissOnboardingIfVisible();
  });

  const categories = [
    "Entertainment",
    "Gaming",
    "Sports",
    "Food & Drink",
    "Music",
    "Technology",
    "Lifestyle",
    "Education",
  ];

  for (const category of categories.slice(0, 3)) {
    test(`should filter by ${category} category`, async ({ templatesPage }) => {
      await templatesPage.selectCategory(category);
      await templatesPage.waitForContentUpdate();

      // Featured section should be hidden when filter is active
      const hasFeatured = await templatesPage.hasFeaturedSection();
      expect(hasFeatured).toBe(false);

      // Should show category header
      const heading = templatesPage.page.locator(`h2:has-text("${category}")`);
      await expect(heading).toBeVisible();
    });
  }
});
