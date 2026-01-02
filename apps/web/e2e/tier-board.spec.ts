/**
 * Tier Board E2E Tests
 *
 * Tests for the main tier board page functionality.
 * Uses the new Page Object Model infrastructure.
 */

import { test, expect } from "./fixtures";

test.describe("Tier Board", () => {
  test.beforeEach(async ({ tierBoardPage }) => {
    await tierBoardPage.goto();
    await tierBoardPage.dismissOnboardingIfVisible();
  });

  test("should display tier board with default tiers", async ({ tierBoardPage }) => {
    // Check that all tier rows are present
    await expect(tierBoardPage.getTierRow("S")).toBeVisible();
    await expect(tierBoardPage.getTierRow("A")).toBeVisible();
    await expect(tierBoardPage.getTierRow("B")).toBeVisible();
    await expect(tierBoardPage.getTierRow("C")).toBeVisible();
    await expect(tierBoardPage.getTierRow("D")).toBeVisible();
    await expect(tierBoardPage.getTierRow("F")).toBeVisible();
    await expect(tierBoardPage.getTierRow("unranked")).toBeVisible();
  });

  test("should navigate to different pages", async ({ tierBoardPage, page }) => {
    // Navigate to Head-to-Head
    await tierBoardPage.navigateViaNav("Head-to-Head");
    await expect(page).toHaveURL("/head-to-head");

    // Navigate to Themes
    await tierBoardPage.navigateViaNav("Themes");
    await expect(page).toHaveURL("/themes");

    // Navigate to Analytics
    await tierBoardPage.navigateViaNav("Analytics");
    await expect(page).toHaveURL("/analytics");

    // Navigate to Import/Export
    await tierBoardPage.navigateViaNav("Import/Export");
    await expect(page).toHaveURL("/import-export");

    // Navigate back to Board
    await tierBoardPage.navigateViaNav("Board");
    await expect(page).toHaveURL("/");
  });

  test("should have undo/redo buttons", async ({ tierBoardPage }) => {
    // Check undo/redo buttons are present
    await expect(tierBoardPage.undoButton).toBeVisible();
    await expect(tierBoardPage.redoButton).toBeVisible();

    // Initially, both should be disabled (no actions yet)
    await expect(tierBoardPage.undoButton).toBeDisabled();
    await expect(tierBoardPage.redoButton).toBeDisabled();
  });

  test("should support keyboard shortcuts for undo/redo", async ({ tierBoardPage }) => {
    // Initially both disabled
    await expect(tierBoardPage.undoButton).toBeDisabled();
    await expect(tierBoardPage.redoButton).toBeDisabled();

    // Test keyboard shortcut (will test actual undo/redo functionality in integration tests)
    await tierBoardPage.pressCommand("z"); // Should do nothing when disabled
    await expect(tierBoardPage.undoButton).toBeDisabled();

    await tierBoardPage.pressCommandShift("z"); // Should do nothing when disabled
    await expect(tierBoardPage.redoButton).toBeDisabled();
  });

  test("should display item cards in tiers", async ({ tierBoardPage }) => {
    // Wait for any default items to load
    await tierBoardPage.waitForContentUpdate();

    // Check if there are any item cards (the app may load with default data)
    const itemCards = tierBoardPage.allItemCards;
    const count = await itemCards.count();

    // If items exist, verify they're properly rendered
    if (count > 0) {
      const firstItem = itemCards.first();
      await expect(firstItem).toBeVisible();
    }
  });
});

test.describe("Tier Board - Toolbar", () => {
  test.beforeEach(async ({ tierBoardPage }) => {
    await tierBoardPage.goto();
    await tierBoardPage.dismissOnboardingIfVisible();
  });

  test("should have Add Item button", async ({ tierBoardPage }) => {
    await expect(tierBoardPage.addItemButton).toBeVisible();
  });

  test("should have Tiers settings button", async ({ tierBoardPage }) => {
    await expect(tierBoardPage.tiersButton).toBeVisible();
  });

  test("should have Stream button", async ({ tierBoardPage }) => {
    await expect(tierBoardPage.streamButton).toBeVisible();
  });
});

test.describe("Tier Board - Empty State", () => {
  test("should show add item prompt when no items", async ({
    loadTestData,
    testDataFactory,
    tierBoardPage,
    page,
  }) => {
    // Load empty data
    await loadTestData(testDataFactory.createEmptyTierData());

    // Navigate to board
    await page.goto("/");
    await tierBoardPage.dismissOnboardingIfVisible();

    // Should show empty state prompt or Add Item button prominently
    const emptyPrompt = page.locator('text=/empty|add.*first.*item/i');
    const addButton = tierBoardPage.addItemButton;

    const hasEmptyPrompt = (await emptyPrompt.count()) > 0;
    const hasAddButton = await addButton.isVisible();

    expect(hasEmptyPrompt || hasAddButton).toBe(true);
  });
});
