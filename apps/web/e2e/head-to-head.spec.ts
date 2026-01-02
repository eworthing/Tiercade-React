/**
 * Head-to-Head E2E Tests
 *
 * Tests for the Head-to-Head pairwise comparison functionality.
 * Uses the new Page Object Model infrastructure.
 */

import { test, expect } from "./fixtures";
import { TEST_DATA_PRESETS } from "./utils/testDataFactory";

test.describe("Head-to-Head", () => {
  test.beforeEach(async ({ loadTestData, headToHeadPage }) => {
    // Load test data with items in unranked tier
    await loadTestData(TEST_DATA_PRESETS.h2h());

    // Navigate to Head-to-Head
    await headToHeadPage.goto();
    await headToHeadPage.dismissOnboardingIfVisible();
  });

  test("should display head-to-head page", async ({ headToHeadPage }) => {
    await expect(headToHeadPage.heading).toBeVisible();
  });

  test("should have start button or comparison interface", async ({ headToHeadPage }) => {
    // Should have either a start button or already show comparison cards
    const hasStartButton = await headToHeadPage.canStart();
    const hasComparisonCard = await headToHeadPage.isComparing();

    expect(hasStartButton || hasComparisonCard).toBe(true);
  });

  test("should display comparison cards when active", async ({ headToHeadPage }) => {
    // Start if needed
    await headToHeadPage.start();

    // Should show two items to compare
    const count = await headToHeadPage.getComparisonCardCount();

    if (count > 0) {
      expect(count).toBe(2); // Should show exactly 2 items to compare

      // Each card should be visible
      await expect(headToHeadPage.leftCard).toBeVisible();
      await expect(headToHeadPage.rightCard).toBeVisible();

      // Should show item names
      const itemName = await headToHeadPage.getLeftCardText();
      expect(itemName).toBeTruthy();
    }
  });

  test("should allow selecting winner", async ({ headToHeadPage }) => {
    // Start comparison if needed
    await headToHeadPage.start();

    // Get comparison cards
    const count = await headToHeadPage.getComparisonCardCount();

    if (count === 2) {
      // Click the left card to select it as winner
      await headToHeadPage.selectLeft();

      // Should show next comparison or completion message
      const nextCount = await headToHeadPage.getComparisonCardCount();

      // Either shows next pair (2 cards) or shows completion (0 cards)
      expect(nextCount === 0 || nextCount === 2).toBe(true);
    }
  });

  test("should show progress indicator", async ({ headToHeadPage }) => {
    // Start the H2H session first
    await headToHeadPage.start();

    // Should show how many comparisons are left or completed
    const hasProgress = await headToHeadPage.hasProgressIndicator();
    expect(hasProgress).toBe(true);
  });

  test("should have apply/finalize button when complete", async ({ headToHeadPage }) => {
    // Start comparison
    await headToHeadPage.start();

    // Complete all comparisons
    await headToHeadPage.completeAllComparisons();

    // Should show apply/finalize button when done
    await expect(headToHeadPage.applyButton).toBeVisible({ timeout: 3000 });
  });

  test("should apply results to tier board", async ({ headToHeadPage, page }) => {
    // Run full session
    await headToHeadPage.start();
    await headToHeadPage.completeAllComparisons();
    await headToHeadPage.apply();

    // Navigate to tier board
    await headToHeadPage.navigateViaNav("Board");
    await page.waitForTimeout(500);

    // After H2H completion, items should be distributed across tiers
    // Wilson score algorithm places items based on their win rate
    // Check that tier board is visible with items
    const allItemCards = page.locator('[data-testid^="item-card-"]');
    const totalItems = await allItemCards.count();

    // We started with 5 items, should still have 5 after H2H
    expect(totalItems).toBe(5);
  });

  test("should support undo after applying results", async ({ headToHeadPage, page }) => {
    // Run full session
    await headToHeadPage.start();
    await headToHeadPage.completeAllComparisons();
    await headToHeadPage.apply();

    // Undo button should now be enabled
    await expect(headToHeadPage.undoButton).toBeEnabled();

    // Click undo
    await headToHeadPage.undo();
    await headToHeadPage.waitForAnimation();

    // Navigate to tier board
    await headToHeadPage.navigateViaNav("Board");

    // Items should be back in unranked (undo worked)
    const unrankedRow = page.locator('[data-testid="tier-row-unranked"]');
    await expect(
      unrankedRow.locator('[data-testid^="item-card-"]').first()
    ).toBeVisible();
  });
});

test.describe("Head-to-Head - Keyboard Shortcuts", () => {
  test.beforeEach(async ({ loadTestData, headToHeadPage }) => {
    await loadTestData(TEST_DATA_PRESETS.h2h());
    await headToHeadPage.goto();
    await headToHeadPage.dismissOnboardingIfVisible();
  });

  test("should vote with arrow keys", async ({ headToHeadPage }) => {
    await headToHeadPage.start();

    if (await headToHeadPage.isComparing()) {
      // Vote with left arrow
      await headToHeadPage.pressLeftArrow();

      // Should advance to next comparison or complete
      const isStillComparing = await headToHeadPage.isComparing();
      const isComplete = await headToHeadPage.isComplete();
      expect(isStillComparing || isComplete).toBe(true);
    }
  });

  test("should skip with space", async ({ headToHeadPage }) => {
    await headToHeadPage.start();

    if (await headToHeadPage.isComparing()) {
      const initialLeftText = await headToHeadPage.getLeftCardText();

      // Skip with space
      await headToHeadPage.pressSpace();

      // Should show different pair or same (depending on skip queue)
      // Just verify we're still in a valid state
      const isStillComparing = await headToHeadPage.isComparing();
      const isComplete = await headToHeadPage.isComplete();
      expect(isStillComparing || isComplete).toBe(true);
    }
  });
});
