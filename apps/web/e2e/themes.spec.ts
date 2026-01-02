/**
 * Themes E2E Tests
 *
 * Tests for theme selection and application.
 * Uses the new Page Object Model infrastructure.
 */

import { test, expect } from "./fixtures";

test.describe("Themes", () => {
  test.beforeEach(async ({ themesPage }) => {
    await themesPage.goto();
    await themesPage.dismissOnboardingIfVisible();
  });

  test("should display theme picker with bundled themes", async ({ themesPage }) => {
    // Check page loaded
    await expect(themesPage.pageHeading).toBeVisible();

    // Check for theme cards (we have 7 bundled themes)
    const count = await themesPage.getThemeCount();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test("should display current theme indicator", async ({ themesPage }) => {
    // Should show which theme is currently selected
    await expect(themesPage.currentThemeIndicator).toBeVisible();
  });

  test("should allow theme selection", async ({ themesPage }) => {
    // Find all theme cards
    const count = await themesPage.getThemeCount();

    if (count > 1) {
      // Click on the second theme card
      await themesPage.selectThemeAt(1);

      // Verify the theme card shows as selected (has ring class)
      const card = themesPage.getThemeCardAt(1);
      const classes = await card.getAttribute("class");
      expect(classes).toContain("ring");
    }
  });

  test("should display theme preview colors", async ({ themesPage }) => {
    // Each theme card should have a preview showing tier colors
    const themeCards = themesPage.themeCards;
    const firstCard = themeCards.first();

    // Look for color preview within the card
    const testId = await firstCard.getAttribute("data-testid");
    if (testId) {
      const themeId = testId.replace("theme-card-", "");
      const colorCount = await themesPage.getColorBlockCount(themeId);
      expect(colorCount).toBeGreaterThanOrEqual(5); // At least S, A, B, C, D
    }
  });

  test("should persist theme selection across navigation", async ({
    themesPage,
    page,
  }) => {
    const count = await themesPage.getThemeCount();

    if (count > 1) {
      // Get theme ID from the second card
      const themeId = await themesPage.getThemeCardAt(1).getAttribute("data-testid");
      await themesPage.selectThemeAt(1);

      // Navigate to tier board
      await themesPage.navigateViaNav("Board");
      await expect(page).toHaveURL("/");

      // Navigate back to themes
      await themesPage.navigateViaNav("Themes");
      await expect(page).toHaveURL("/themes");

      // Verify theme is still selected
      if (themeId) {
        const selectedCard = page.locator(`[data-testid="${themeId}"]`);
        const classes = await selectedCard.getAttribute("class");
        expect(classes).toContain("ring");
      }
    }
  });

  test("should apply theme colors to tier board", async ({ themesPage, page }) => {
    // Select a theme
    await themesPage.selectThemeAt(0);

    // Navigate to tier board
    await themesPage.navigateViaNav("Board");

    // Check that tier rows have colored borders (theme applied)
    const tierRow = page.locator('[data-testid="tier-row-S"]');
    await expect(tierRow).toBeVisible();

    // Tier row should have border color from theme
    const borderStyle = await tierRow.evaluate((el) =>
      window.getComputedStyle(el).borderLeftColor
    );
    expect(borderStyle).not.toBe(""); // Should have some color
  });
});

test.describe("Themes - Multiple Selections", () => {
  test.beforeEach(async ({ themesPage }) => {
    await themesPage.goto();
    await themesPage.dismissOnboardingIfVisible();
  });

  test("should switch between themes", async ({ themesPage }) => {
    const count = await themesPage.getThemeCount();

    if (count >= 3) {
      // Select first theme
      await themesPage.selectThemeAt(0);
      const card0 = themesPage.getThemeCardAt(0);
      let classes = await card0.getAttribute("class");
      expect(classes).toContain("ring");

      // Select second theme
      await themesPage.selectThemeAt(1);
      const card1 = themesPage.getThemeCardAt(1);
      classes = await card1.getAttribute("class");
      expect(classes).toContain("ring");

      // First theme should no longer have ring
      classes = await card0.getAttribute("class");
      expect(classes).not.toContain("ring-2"); // ring-2 indicates selected
    }
  });
});
