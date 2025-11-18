import { test, expect } from "@playwright/test";

test.describe("Themes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/themes");
  });

  test("should display theme picker with bundled themes", async ({ page }) => {
    // Check page title/header
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Check for theme cards (we have 7 bundled themes)
    const themeCards = page.locator('[data-testid^="theme-card-"]');
    const count = await themeCards.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test("should display current theme", async ({ page }) => {
    // Should show which theme is currently selected
    const currentTheme = page.locator('[data-testid="current-theme"]');
    await expect(currentTheme).toBeVisible();
  });

  test("should allow theme selection", async ({ page }) => {
    // Find all theme cards
    const themeCards = page.locator('[data-testid^="theme-card-"]');
    const count = await themeCards.count();

    if (count > 1) {
      // Click on the second theme card
      await themeCards.nth(1).click();

      // Wait for theme to update
      await page.waitForTimeout(300);

      // Verify the theme card shows as selected
      const selectedCard = themeCards.nth(1);
      const classes = await selectedCard.getAttribute("class");
      expect(classes).toContain("ring"); // Selected theme has ring border
    }
  });

  test("should display theme preview colors", async ({ page }) => {
    // Each theme card should have a preview showing tier colors
    const themeCards = page.locator('[data-testid^="theme-card-"]');
    const firstCard = themeCards.first();

    // Look for color preview within the card
    const preview = firstCard.locator('[data-testid="theme-preview"]');
    await expect(preview).toBeVisible();

    // Preview should have multiple colored sections (one per tier)
    const colorBlocks = preview.locator("div[style*='background']");
    const colorCount = await colorBlocks.count();
    expect(colorCount).toBeGreaterThanOrEqual(5); // At least S, A, B, C, D
  });

  test("should persist theme selection across navigation", async ({ page }) => {
    // Select a theme
    const themeCards = page.locator('[data-testid^="theme-card-"]');
    const count = await themeCards.count();

    if (count > 1) {
      // Get theme ID from the second card
      const themeId = await themeCards.nth(1).getAttribute("data-testid");
      await themeCards.nth(1).click();
      await page.waitForTimeout(300);

      // Navigate to tier board
      await page.click('a:has-text("Board")');
      await expect(page).toHaveURL("/");

      // Navigate back to themes
      await page.click('a:has-text("Themes")');
      await expect(page).toHaveURL("/themes");

      // Verify theme is still selected
      const selectedCard = page.locator(`[data-testid="${themeId}"]`);
      const classes = await selectedCard.getAttribute("class");
      expect(classes).toContain("ring");
    }
  });

  test("should apply theme colors to tier board", async ({ page }) => {
    // Select a theme
    const themeCards = page.locator('[data-testid^="theme-card-"]');
    await themeCards.nth(0).click();
    await page.waitForTimeout(300);

    // Navigate to tier board
    await page.click('a:has-text("Board")');

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
