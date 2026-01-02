/**
 * Templates Page Object
 *
 * Page object for the Templates page (/templates).
 * Provides methods for browsing, searching, and using templates.
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class TemplatesPage extends BasePage {
  readonly path = "/templates";

  // ============================================================================
  // Page Elements
  // ============================================================================

  /**
   * Get the page heading
   */
  get heading(): Locator {
    return this.page.locator("h1:has-text('Template')");
  }

  /**
   * Get the page description
   */
  get description(): Locator {
    return this.page.locator("text=Get started quickly");
  }

  // ============================================================================
  // Search and Filter
  // ============================================================================

  /**
   * Get the search input
   */
  get searchInput(): Locator {
    return this.page.locator('input[type="search"], input[placeholder*="Search"]');
  }

  /**
   * Search for templates
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.waitForContentUpdate();
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.waitForContentUpdate();
  }

  /**
   * Get the "All Templates" category button
   */
  get allTemplatesButton(): Locator {
    return this.page.locator('button:has-text("All Templates")');
  }

  /**
   * Get a category filter button by name
   */
  getCategoryButton(category: string): Locator {
    return this.page.locator(`button:has-text("${category}")`);
  }

  /**
   * Select a category filter
   */
  async selectCategory(category: string): Promise<void> {
    await this.getCategoryButton(category).click();
    await this.waitForContentUpdate();
  }

  /**
   * Reset to all templates
   */
  async showAllTemplates(): Promise<void> {
    await this.allTemplatesButton.click();
    await this.waitForContentUpdate();
  }

  // ============================================================================
  // Template Cards
  // ============================================================================

  /**
   * Get all template cards (articles with h3 headers and Preview button)
   */
  get templateCards(): Locator {
    return this.page.locator('article:has(button:has-text("Preview"))');
  }

  /**
   * Get template card at index
   */
  getTemplateCardAt(index: number): Locator {
    return this.templateCards.nth(index);
  }

  /**
   * Get template count
   */
  async getTemplateCount(): Promise<number> {
    return this.templateCards.count();
  }

  /**
   * Get template card by name
   */
  getTemplateByName(name: string): Locator {
    return this.page.locator("article").filter({ hasText: name });
  }

  /**
   * Get the Preview button on a template card
   */
  getPreviewButton(templateCard: Locator): Locator {
    return templateCard.locator('button:has-text("Preview")');
  }

  /**
   * Get the Use Template button on a template card
   */
  getUseButton(templateCard: Locator): Locator {
    return templateCard.locator('button:has-text("Use Template")');
  }

  /**
   * Preview a template at index
   */
  async previewTemplateAt(index: number): Promise<void> {
    const card = this.getTemplateCardAt(index);
    await this.getPreviewButton(card).click();
    await this.waitForAnimation();
  }

  /**
   * Use a template at index
   */
  async useTemplateAt(index: number): Promise<void> {
    const card = this.getTemplateCardAt(index);
    await this.getUseButton(card).click();
    await this.waitForContentUpdate();
  }

  /**
   * Preview a template by name
   */
  async previewTemplateByName(name: string): Promise<void> {
    const card = this.getTemplateByName(name);
    await this.getPreviewButton(card).click();
    await this.waitForAnimation();
  }

  /**
   * Use a template by name
   */
  async useTemplateByName(name: string): Promise<void> {
    const card = this.getTemplateByName(name);
    await this.getUseButton(card).click();
    await this.waitForContentUpdate();
  }

  // ============================================================================
  // Featured Templates
  // ============================================================================

  /**
   * Get featured templates section
   */
  get featuredSection(): Locator {
    return this.page.locator("section").filter({ hasText: "Featured Templates" });
  }

  /**
   * Get featured template cards
   */
  get featuredTemplates(): Locator {
    return this.featuredSection.locator("article");
  }

  /**
   * Check if featured section is visible
   */
  async hasFeaturedSection(): Promise<boolean> {
    return this.isVisible(this.featuredSection);
  }

  // ============================================================================
  // Preview Modal
  // ============================================================================

  /**
   * Get the preview modal
   */
  get previewModal(): Locator {
    return this.page.locator(".fixed").filter({ has: this.page.locator("h2") });
  }

  /**
   * Check if preview modal is open
   */
  async isPreviewOpen(): Promise<boolean> {
    return this.isVisible(this.previewModal);
  }

  /**
   * Get the close button on preview modal
   */
  get previewCloseButton(): Locator {
    return this.previewModal.locator('button:has-text("Cancel")');
  }

  /**
   * Get the "Use This Template" button on preview modal
   */
  get previewUseButton(): Locator {
    return this.previewModal.locator('button:has-text("Use This Template")');
  }

  /**
   * Close the preview modal
   */
  async closePreview(): Promise<void> {
    await this.previewCloseButton.click();
    await this.waitForAnimation();
  }

  /**
   * Use template from preview modal
   */
  async useFromPreview(): Promise<void> {
    await this.previewUseButton.click();
    await this.waitForContentUpdate();
  }

  /**
   * Get tier labels shown in preview
   */
  get previewTierLabels(): Locator {
    return this.previewModal.locator(".rounded-md.text-white");
  }

  /**
   * Get included items shown in preview
   */
  get previewItems(): Locator {
    return this.previewModal.locator(".bg-surface-soft.rounded.text-xs");
  }

  // ============================================================================
  // Empty State
  // ============================================================================

  /**
   * Get empty state / no results message
   */
  get noResultsMessage(): Locator {
    return this.page.locator("text=No templates found");
  }

  /**
   * Get clear filters button
   */
  get clearFiltersButton(): Locator {
    return this.page.locator('button:has-text("Clear filters")');
  }

  /**
   * Check if no results state is shown
   */
  async hasNoResults(): Promise<boolean> {
    return this.isVisible(this.noResultsMessage);
  }

  /**
   * Clear filters from no results state
   */
  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
    await this.waitForContentUpdate();
  }

  // ============================================================================
  // Verification Helpers
  // ============================================================================

  /**
   * Verify template was applied by checking URL changed to /
   */
  async verifyTemplateApplied(): Promise<boolean> {
    await this.page.waitForURL("/");
    return this.page.url().endsWith("/");
  }
}
