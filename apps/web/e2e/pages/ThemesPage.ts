/**
 * Themes Page Object
 *
 * Page object for the Themes page (/themes).
 * Provides methods for selecting and verifying themes.
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ThemesPage extends BasePage {
  readonly path = "/themes";

  // ============================================================================
  // Theme Cards
  // ============================================================================

  /**
   * Get all theme cards
   */
  get themeCards(): Locator {
    return this.getByTestIdPrefix("theme-card-");
  }

  /**
   * Get a specific theme card by theme ID
   */
  getThemeCard(themeId: string): Locator {
    return this.getByTestId(`theme-card-${themeId}`);
  }

  /**
   * Get theme card at index
   */
  getThemeCardAt(index: number): Locator {
    return this.themeCards.nth(index);
  }

  /**
   * Get count of available themes
   */
  async getThemeCount(): Promise<number> {
    return this.themeCards.count();
  }

  /**
   * Select a theme by clicking its card
   */
  async selectTheme(themeId: string): Promise<void> {
    await this.getThemeCard(themeId).click();
    await this.waitForAnimation();
  }

  /**
   * Select theme at index
   */
  async selectThemeAt(index: number): Promise<void> {
    await this.getThemeCardAt(index).click();
    await this.waitForAnimation();
  }

  /**
   * Get the testid of the currently selected theme card
   */
  async getCurrentThemeId(): Promise<string | null> {
    const cards = this.themeCards;
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const selected = await card.getAttribute("aria-selected");
      if (selected === "true") {
        return card.getAttribute("data-testid");
      }
    }
    return null;
  }

  /**
   * Check if a theme is selected
   */
  async isThemeSelected(themeId: string): Promise<boolean> {
    const card = this.getThemeCard(themeId);
    const selected = await card.getAttribute("aria-selected");
    return selected === "true";
  }

  // ============================================================================
  // Theme Preview
  // ============================================================================

  /**
   * Get theme preview element within a card
   */
  getThemePreview(themeId: string): Locator {
    return this.getThemeCard(themeId).locator('[data-testid="theme-preview"]');
  }

  /**
   * Get color blocks within a theme preview
   */
  getThemeColorBlocks(themeId: string): Locator {
    return this.getThemePreview(themeId).locator("div[style*='background']");
  }

  /**
   * Get count of color blocks in preview
   */
  async getColorBlockCount(themeId: string): Promise<number> {
    return this.getThemeColorBlocks(themeId).count();
  }

  // ============================================================================
  // Theme Application Verification
  // ============================================================================

  /**
   * Navigate to tier board and verify theme is applied
   * Returns the border color of the S tier
   */
  async verifyThemeAppliedToBoard(): Promise<string> {
    await this.navigateViaNav("Board");

    const tierRow = this.page.locator('[data-testid="tier-row-S"]');
    await tierRow.waitFor({ state: "visible" });

    const borderColor = await tierRow.evaluate((el) =>
      window.getComputedStyle(el).borderLeftColor
    );

    return borderColor;
  }
}
