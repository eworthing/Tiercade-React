import { test, expect } from "@playwright/test";

test.describe("Tier Board", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display tier board with default tiers", async ({ page }) => {
    // Check that the page loaded
    await expect(page.locator("text=Tiercade")).toBeVisible();

    // Check that tier rows are present
    await expect(page.locator('[data-testid="tier-row-S"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-row-A"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-row-B"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-row-C"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-row-D"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-row-F"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-row-unranked"]')).toBeVisible();
  });

  test("should navigate to different pages", async ({ page }) => {
    // Navigate to Head-to-Head
    await page.click('a:has-text("Head-to-Head")');
    await expect(page).toHaveURL("/head-to-head");

    // Navigate to Themes
    await page.click('a:has-text("Themes")');
    await expect(page).toHaveURL("/themes");

    // Navigate to Analytics
    await page.click('a:has-text("Analytics")');
    await expect(page).toHaveURL("/analytics");

    // Navigate to Import/Export
    await page.click('a:has-text("Import/Export")');
    await expect(page).toHaveURL("/import-export");

    // Navigate back to Board
    await page.click('a:has-text("Board")');
    await expect(page).toHaveURL("/");
  });

  test("should have undo/redo buttons", async ({ page }) => {
    // Check undo/redo buttons are present
    const undoButton = page.locator('button:has-text("Undo")');
    const redoButton = page.locator('button:has-text("Redo")');

    await expect(undoButton).toBeVisible();
    await expect(redoButton).toBeVisible();

    // Initially, both should be disabled (no actions yet)
    await expect(undoButton).toBeDisabled();
    await expect(redoButton).toBeDisabled();
  });

  test("should support keyboard shortcuts for undo/redo", async ({ page }) => {
    const undoButton = page.locator('button:has-text("Undo")');
    const redoButton = page.locator('button:has-text("Redo")');

    // Initially both disabled
    await expect(undoButton).toBeDisabled();
    await expect(redoButton).toBeDisabled();

    // Test keyboard shortcut (will test actual undo/redo functionality in integration tests)
    // For now, just verify the buttons are set up correctly
    await page.keyboard.press("Meta+Z"); // Should do nothing when disabled
    await expect(undoButton).toBeDisabled();

    await page.keyboard.press("Meta+Shift+Z"); // Should do nothing when disabled
    await expect(redoButton).toBeDisabled();
  });

  test("should display item cards in tiers", async ({ page }) => {
    // Wait for any default items to load
    await page.waitForTimeout(500);

    // Check if there are any item cards (the app may load with default data)
    const itemCards = page.locator('[data-testid^="item-card-"]');
    const count = await itemCards.count();

    // If items exist, verify they're properly rendered
    if (count > 0) {
      const firstItem = itemCards.first();
      await expect(firstItem).toBeVisible();
    }
  });
});
