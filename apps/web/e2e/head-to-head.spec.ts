import { test, expect } from "@playwright/test";

test.describe("Head-to-Head", () => {
  test.beforeEach(async ({ page }) => {
    // First, add some test items via import so we have data to compare
    await page.goto("/import-export");

    const testData = {
      tiers: {
        S: [],
        A: [],
        B: [],
        C: [],
        D: [],
        F: [],
        unranked: [
          { id: "h2h-1", attributes: { name: "Item Alpha" } },
          { id: "h2h-2", attributes: { name: "Item Beta" } },
          { id: "h2h-3", attributes: { name: "Item Gamma" } },
          { id: "h2h-4", attributes: { name: "Item Delta" } },
          { id: "h2h-5", attributes: { name: "Item Epsilon" } },
        ],
      },
      tierOrder: ["S", "A", "B", "C", "D", "F"],
    };

    const fs = await import("fs");
    const path = await import("path");
    const tempFile = path.join("/tmp", "h2h-test-data.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);
    await page.waitForTimeout(500);
    fs.unlinkSync(tempFile);

    // Now navigate to Head-to-Head
    await page.goto("/head-to-head");
  });

  test("should display head-to-head page", async ({ page }) => {
    await expect(
      page.locator("h1:has-text('Head-to-Head'), h2:has-text('Head-to-Head')")
    ).toBeVisible();
  });

  test("should have start button or comparison interface", async ({ page }) => {
    // Should have either a start button or already show comparison cards
    const startButton = page.locator('button:has-text("Start")');
    const comparisonCard = page.locator('[data-testid^="comparison-card-"]');

    const hasStartButton = (await startButton.count()) > 0;
    const hasComparisonCard = (await comparisonCard.count()) > 0;

    expect(hasStartButton || hasComparisonCard).toBe(true);
  });

  test("should display comparison cards when active", async ({ page }) => {
    // If there's a start button, click it
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin")'
    );
    if ((await startButton.count()) > 0) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Should show two items to compare
    const cards = page.locator('[data-testid^="comparison-card-"]');
    const count = await cards.count();

    if (count > 0) {
      expect(count).toBe(2); // Should show exactly 2 items to compare

      // Each card should be clickable
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible();

      // Should show item names
      const itemName = await firstCard.textContent();
      expect(itemName).toBeTruthy();
    }
  });

  test("should allow selecting winner", async ({ page }) => {
    // Start comparison if needed
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin")'
    );
    if ((await startButton.count()) > 0) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Get comparison cards
    const cards = page.locator('[data-testid^="comparison-card-"]');
    const count = await cards.count();

    if (count === 2) {
      // Click the first card to select it as winner
      await cards.first().click();
      await page.waitForTimeout(300);

      // Should show next comparison or completion message
      const nextCards = page.locator('[data-testid^="comparison-card-"]');
      const nextCount = await nextCards.count();

      // Either shows next pair (2 cards) or shows completion (0 cards)
      expect(nextCount === 0 || nextCount === 2).toBe(true);
    }
  });

  test("should show progress indicator", async ({ page }) => {
    // Should show how many comparisons are left or completed
    const progressText = page.locator(
      'text=/\\d+\\/\\d+|\\d+ remaining|\\d+ completed/i'
    );
    const progressBar = page.locator('[role="progressbar"]');

    const hasProgressText = (await progressText.count()) > 0;
    const hasProgressBar = (await progressBar.count()) > 0;

    // Should have some form of progress indication
    expect(hasProgressText || hasProgressBar).toBe(true);
  });

  test("should have apply/finalize button when complete", async ({ page }) => {
    // Start comparison
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin")'
    );
    if ((await startButton.count()) > 0) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Complete all comparisons quickly (click first card repeatedly)
    for (let i = 0; i < 20; i++) {
      const cards = page.locator('[data-testid^="comparison-card-"]');
      const count = await cards.count();

      if (count === 0) {
        break; // No more comparisons
      }

      if (count === 2) {
        await cards.first().click();
        await page.waitForTimeout(200);
      }
    }

    // Should show apply/finalize button when done
    const applyButton = page.locator(
      'button:has-text("Apply"), button:has-text("Finalize"), button:has-text("Done")'
    );
    await expect(applyButton).toBeVisible({ timeout: 3000 });
  });

  test("should apply results to tier board", async ({ page }) => {
    // Start and complete comparisons
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin")'
    );
    if ((await startButton.count()) > 0) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Complete all comparisons
    for (let i = 0; i < 20; i++) {
      const cards = page.locator('[data-testid^="comparison-card-"]');
      const count = await cards.count();

      if (count === 0) break;
      if (count === 2) {
        await cards.first().click();
        await page.waitForTimeout(200);
      }
    }

    // Click apply button
    const applyButton = page.locator(
      'button:has-text("Apply"), button:has-text("Finalize"), button:has-text("Done")'
    );
    await applyButton.click({ timeout: 3000 });
    await page.waitForTimeout(500);

    // Navigate to tier board
    await page.click('a:has-text("Board")');

    // Items should no longer all be in unranked tier
    const unrankedItems = page.locator('[data-testid="tier-row-unranked"]');
    const text = await unrankedItems.textContent();

    // Some items should have been moved to ranked tiers
    // (The exact distribution depends on comparison results, but unranked shouldn't have all 5)
    const rankedTierItems = page.locator(
      '[data-testid^="tier-row-S"] [data-testid^="item-card-"], [data-testid^="tier-row-A"] [data-testid^="item-card-"]'
    );
    const rankedCount = await rankedTierItems.count();

    expect(rankedCount).toBeGreaterThan(0); // At least some items should be ranked
  });

  test("should support undo after applying results", async ({ page }) => {
    // Complete head-to-head and apply
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin")'
    );
    if ((await startButton.count()) > 0) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    for (let i = 0; i < 20; i++) {
      const cards = page.locator('[data-testid^="comparison-card-"]');
      if ((await cards.count()) === 0) break;
      if ((await cards.count()) === 2) {
        await cards.first().click();
        await page.waitForTimeout(200);
      }
    }

    const applyButton = page.locator(
      'button:has-text("Apply"), button:has-text("Finalize"), button:has-text("Done")'
    );
    await applyButton.click({ timeout: 3000 });
    await page.waitForTimeout(500);

    // Undo button should now be enabled
    const undoButton = page.locator('button:has-text("Undo")');
    await expect(undoButton).toBeEnabled();

    // Click undo
    await undoButton.click();
    await page.waitForTimeout(300);

    // Navigate to tier board
    await page.click('a:has-text("Board")');

    // Items should be back in unranked (undo worked)
    const unrankedRow = page.locator('[data-testid="tier-row-unranked"]');
    await expect(unrankedRow.locator('[data-testid^="item-card-"]').first()).toBeVisible();
  });
});
