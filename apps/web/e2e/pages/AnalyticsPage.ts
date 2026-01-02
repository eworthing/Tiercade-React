/**
 * Analytics Page Object
 *
 * Page object for the Analytics page (/analytics).
 * Provides methods for verifying analytics data and visualizations.
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class AnalyticsPage extends BasePage {
  readonly path = "/analytics";

  // ============================================================================
  // Page Elements
  // ============================================================================

  /**
   * Get the page heading
   */
  get heading(): Locator {
    return this.page.locator("h1:has-text('Analytics'), h2:has-text('Analytics')");
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get all tier stat elements (each tier row in the distribution)
   * The analytics page shows "S" tier, "A" tier etc with item counts
   */
  get tierStats(): Locator {
    // Look for elements containing "items" and percentage in the tier distribution section
    return this.page.locator('text=/\\d+ items \\(\\d+.*%\\)/');
  }

  /**
   * Get stat for a specific tier
   */
  getTierStat(tierId: string): Locator {
    return this.page.locator(`text=${tierId}`).first();
  }

  /**
   * Get count of visible tier stats
   */
  async getTierStatCount(): Promise<number> {
    return this.tierStats.count();
  }

  /**
   * Get total items text
   */
  get totalItemsText(): Locator {
    return this.page.locator('text=/total.*\\d+|\\d+.*total|\\d+.*items/i');
  }

  // ============================================================================
  // Visualizations
  // ============================================================================

  /**
   * Get canvas elements (for chart.js charts)
   */
  get canvasElements(): Locator {
    return this.page.locator("canvas");
  }

  /**
   * Get SVG elements (for SVG-based charts)
   */
  get svgElements(): Locator {
    return this.page.locator("svg");
  }

  /**
   * Get chart container
   */
  get chartContainer(): Locator {
    return this.page.locator('[data-testid="chart"], [data-testid="visualization"]');
  }

  /**
   * Check if any visualization is present
   */
  async hasVisualization(): Promise<boolean> {
    const hasCanvas = (await this.canvasElements.count()) > 0;
    const hasSvg = (await this.svgElements.count()) > 0;
    const hasChart = (await this.chartContainer.count()) > 0;
    return hasCanvas || hasSvg || hasChart;
  }

  // ============================================================================
  // Percentages and Distribution
  // ============================================================================

  /**
   * Get all percentage displays
   */
  get percentageDisplays(): Locator {
    return this.page.locator('text=/%/');
  }

  /**
   * Get count of percentage displays
   */
  async getPercentageCount(): Promise<number> {
    return this.percentageDisplays.count();
  }

  // ============================================================================
  // Balance Score
  // ============================================================================

  /**
   * Get balance score element
   */
  get balanceScore(): Locator {
    return this.page.locator('text=/balance.*score|score.*balance/i');
  }

  /**
   * Get balance score progress bar
   */
  get balanceScoreBar(): Locator {
    return this.page.locator('[data-testid="balance-score"] [role="progressbar"]');
  }

  // ============================================================================
  // Empty State
  // ============================================================================

  /**
   * Get empty state message
   */
  get emptyStateMessage(): Locator {
    return this.page.locator('text=/no items|no data|empty|0 items/i');
  }

  /**
   * Check if empty state is shown
   */
  async hasEmptyState(): Promise<boolean> {
    return (await this.emptyStateMessage.count()) > 0;
  }

  // ============================================================================
  // Stat Cards
  // ============================================================================

  /**
   * Get all stat cards
   */
  get statCards(): Locator {
    return this.page.locator('[data-testid^="stat-"], .stat-card');
  }

  /**
   * Get specific stat by label
   */
  getStatByLabel(label: string): Locator {
    return this.page.locator(`text=${label}`).locator("..");
  }

  // ============================================================================
  // Data Verification Helpers
  // ============================================================================

  /**
   * Verify S tier count matches expected
   */
  async verifySierCount(expected: number): Promise<boolean> {
    const sTierStat = this.page.locator(
      `text=/S.*${expected}|${expected}.*items.*S/i`
    );
    return (await sTierStat.count()) > 0;
  }

  /**
   * Verify A tier count matches expected
   */
  async verifyATierCount(expected: number): Promise<boolean> {
    const aTierStat = this.page.locator(
      `text=/A.*${expected}|${expected}.*items.*A/i`
    );
    return (await aTierStat.count()) > 0;
  }

  /**
   * Verify total count is shown
   */
  async verifyTotalCount(expected: number): Promise<boolean> {
    const totalText = this.page.locator(
      `text=/total.*${expected}|${expected}.*total|${expected}.*items/i`
    );
    return (await totalText.count()) > 0;
  }
}
