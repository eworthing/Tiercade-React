/**
 * Head-to-Head Page Object
 *
 * Page object for the Head-to-Head comparison page (/head-to-head).
 * Provides methods for interacting with the comparison workflow.
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HeadToHeadPage extends BasePage {
  readonly path = "/head-to-head";

  // ============================================================================
  // Page State Elements
  // ============================================================================

  /**
   * Get the page heading
   */
  get heading(): Locator {
    return this.page.locator(
      '[data-testid="h2h-heading"], h1:has-text("Head-to-Head"), h2:has-text("Head-to-Head")'
    );
  }

  /**
   * Get the Start/Begin button
   */
  get startButton(): Locator {
    return this.page.locator(
      '[data-testid="h2h-start"], button:has-text("Start Comparing"), button:has-text("Start"), button:has-text("Begin")'
    );
  }

  /**
   * Check if H2H session can be started
   */
  async canStart(): Promise<boolean> {
    const button = this.startButton.first();
    if (!(await button.isVisible())) return false;
    return button.isEnabled();
  }

  /**
   * Start the H2H session
   */
  async start(): Promise<void> {
    if (await this.canStart()) {
      await this.startButton.first().click();
      await this.waitForContentUpdate();
    }
  }

  // ============================================================================
  // Comparison Cards
  // ============================================================================

  /**
   * Get all comparison cards (clickable buttons in the comparison grid)
   */
  get comparisonCards(): Locator {
    return this.page.locator(
      '[data-testid="h2h-card-left"], [data-testid="h2h-card-right"]'
    );
  }

  /**
   * Get the left comparison card
   */
  get leftCard(): Locator {
    return this.getByTestId("h2h-card-left");
  }

  /**
   * Get the right comparison card
   */
  get rightCard(): Locator {
    return this.getByTestId("h2h-card-right");
  }

  /**
   * Get count of visible comparison cards
   */
  async getComparisonCardCount(): Promise<number> {
    return this.comparisonCards.count();
  }

  /**
   * Check if comparison is active (2 cards visible)
   */
  async isComparing(): Promise<boolean> {
    return (await this.getComparisonCardCount()) === 2;
  }

  /**
   * Select the left item as winner
   */
  async selectLeft(): Promise<void> {
    await this.leftCard.click();
    await this.waitForAnimation();
  }

  /**
   * Select the right item as winner
   */
  async selectRight(): Promise<void> {
    await this.rightCard.click();
    await this.waitForAnimation();
  }

  /**
   * Get the name displayed on left card
   */
  async getLeftCardText(): Promise<string | null> {
    return this.leftCard.textContent();
  }

  /**
   * Get the name displayed on right card
   */
  async getRightCardText(): Promise<string | null> {
    return this.rightCard.textContent();
  }

  // ============================================================================
  // Progress Tracking
  // ============================================================================

  /**
   * Get progress indicator text (e.g., "5 remaining", "skipped")
   */
  get progressText(): Locator {
    return this.page.locator(
      '[data-testid="h2h-remaining-count"], [data-testid="h2h-skipped-count"], [data-testid="h2h-phase"], [data-testid="h2h-reviewing-skipped"]'
    );
  }

  /**
   * Get progress bar (the visual bar showing completion)
   */
  get progressBar(): Locator {
    return this.getByTestId("h2h-progress-bar");
  }

  /**
   * Check if progress is shown
   */
  async hasProgressIndicator(): Promise<boolean> {
    const hasText = (await this.progressText.count()) > 0;
    const hasBar = (await this.progressBar.count()) > 0;
    return hasText || hasBar;
  }

  // ============================================================================
  // Skip Functionality
  // ============================================================================

  /**
   * Get the Skip button
   */
  get skipButton(): Locator {
    return this.page.locator(
      '[data-testid="h2h-skip"], button:has-text("Skip this pair"), button:has-text("Skip")'
    );
  }

  /**
   * Skip the current comparison
   */
  async skip(): Promise<void> {
    await this.skipButton.click();
    await this.waitForAnimation();
  }

  /**
   * Check if skip is available
   */
  async canSkip(): Promise<boolean> {
    const button = this.skipButton.first();
    if (!(await button.isVisible())) return false;
    return button.isEnabled();
  }

  // ============================================================================
  // Completion and Apply
  // ============================================================================

  /**
   * Get the Apply/Finalize/Done button
   */
  get applyButton(): Locator {
    return this.page.locator(
      '[data-testid="h2h-apply"], button:has-text("Apply Results"), button:has-text("End & Apply"), button:has-text("Apply"), button:has-text("Finalize"), button:has-text("Done")'
    );
  }

  /**
   * Check if session is complete (apply button visible)
   */
  async isComplete(): Promise<boolean> {
    return this.isVisible(this.applyButton);
  }

  /**
   * Apply the H2H results
   */
  async apply(): Promise<void> {
    await this.applyButton.click({ timeout: 3000 });
    await this.waitForContentUpdate();
  }

  // ============================================================================
  // Complete Session Helpers
  // ============================================================================

  /**
   * Complete all comparisons by always selecting the left item
   * @param maxIterations Maximum number of iterations to prevent infinite loops
   */
  async completeAllComparisons(maxIterations = 30): Promise<void> {
    for (let i = 0; i < maxIterations; i++) {
      const cardCount = await this.getComparisonCardCount();

      if (cardCount === 0) {
        break; // No more comparisons
      }

      if (cardCount === 2) {
        await this.selectLeft();
        await this.page.waitForTimeout(200);
      }
    }
  }

  /**
   * Run a full H2H session: start, complete all comparisons, and apply
   */
  async runFullSession(): Promise<void> {
    await this.start();
    await this.completeAllComparisons();
    await this.apply();
  }

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  /**
   * Vote for left using keyboard
   */
  async pressLeftArrow(): Promise<void> {
    await this.page.keyboard.press("ArrowLeft");
    await this.waitForAnimation();
  }

  /**
   * Vote for right using keyboard
   */
  async pressRightArrow(): Promise<void> {
    await this.page.keyboard.press("ArrowRight");
    await this.waitForAnimation();
  }

  /**
   * Vote using number keys
   */
  async pressNumber(num: 1 | 2): Promise<void> {
    await this.page.keyboard.press(num.toString());
    await this.waitForAnimation();
  }

  /**
   * Skip using spacebar
   */
  async pressSpace(): Promise<void> {
    await this.page.keyboard.press("Space");
    await this.waitForAnimation();
  }

  /**
   * Finish and apply using Escape
   */
  async pressEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await this.waitForAnimation();
  }
}
