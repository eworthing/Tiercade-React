/**
 * Tier Board Page Object
 *
 * Page object for the main tier board page (/).
 * Provides methods for interacting with tier list, items, and modals.
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class TierBoardPage extends BasePage {
  readonly path = "/";

  // ============================================================================
  // Tier Elements
  // ============================================================================

  /**
   * Get a specific tier row by tier ID
   */
  getTierRow(tierId: string): Locator {
    return this.getByTestId(`tier-row-${tierId}`);
  }

  /**
   * Get all tier rows
   */
  get allTierRows(): Locator {
    return this.getByTestIdPrefix("tier-row-");
  }

  /**
   * Get standard tier rows (S, A, B, C, D, F)
   */
  get standardTiers(): string[] {
    return ["S", "A", "B", "C", "D", "F"];
  }

  /**
   * Check if all standard tiers are visible
   */
  async areAllTiersVisible(): Promise<boolean> {
    for (const tier of [...this.standardTiers, "unranked"]) {
      const visible = await this.isVisible(this.getTierRow(tier));
      if (!visible) return false;
    }
    return true;
  }

  // ============================================================================
  // Item Elements
  // ============================================================================

  /**
   * Get an item card by item ID
   */
  getItemCard(itemId: string): Locator {
    return this.getByTestId(`item-card-${itemId}`);
  }

  /**
   * Get all item cards
   */
  get allItemCards(): Locator {
    return this.getByTestIdPrefix("item-card-");
  }

  /**
   * Get items within a specific tier
   */
  getItemsInTier(tierId: string): Locator {
    return this.getTierRow(tierId).locator('[data-testid^="item-card-"]');
  }

  /**
   * Get count of items in a tier
   */
  async getItemCountInTier(tierId: string): Promise<number> {
    return this.getItemsInTier(tierId).count();
  }

  /**
   * Get total item count
   */
  async getTotalItemCount(): Promise<number> {
    return this.allItemCards.count();
  }

  /**
   * Click on an item card
   */
  async clickItem(itemId: string): Promise<void> {
    await this.getItemCard(itemId).click();
  }

  /**
   * Double-click on an item card to edit
   */
  async doubleClickItem(itemId: string): Promise<void> {
    await this.getItemCard(itemId).dblclick();
  }

  // ============================================================================
  // Toolbar Actions
  // ============================================================================

  /**
   * Get the Add Item button
   */
  get addItemButton(): Locator {
    return this.page.locator('button:has-text("Add Item")');
  }

  /**
   * Get the Tiers settings button
   */
  get tiersButton(): Locator {
    return this.page.locator('button:has-text("Tiers")');
  }

  /**
   * Get the Share button
   */
  get shareButton(): Locator {
    return this.page.locator('button:has-text("Share")');
  }

  /**
   * Get the Stream button
   */
  get streamButton(): Locator {
    return this.page.locator('button:has-text("Stream"), button:has-text("Live")');
  }

  /**
   * Click Add Item button
   */
  async clickAddItem(): Promise<void> {
    await this.addItemButton.click();
  }

  /**
   * Click Tiers settings button
   */
  async clickTierSettings(): Promise<void> {
    await this.tiersButton.click();
  }

  /**
   * Get the item count display
   */
  get itemCountDisplay(): Locator {
    return this.page.locator('text=/\\d+ items/');
  }

  /**
   * Get selection count display
   */
  get selectionCountDisplay(): Locator {
    return this.page.locator('text=/\\d+ selected/');
  }

  /**
   * Get clear selection button
   */
  get clearSelectionButton(): Locator {
    return this.page.locator('button:has-text("Clear")');
  }

  // ============================================================================
  // Add Item Modal
  // ============================================================================

  /**
   * Get the Add Item modal
   */
  get addItemModal(): Locator {
    return this.page.locator('[role="dialog"]').filter({ hasText: /Add.*Item/i });
  }

  /**
   * Get item name input in modal
   */
  get itemNameInput(): Locator {
    return this.page.locator('input[placeholder*="name" i], input[aria-label*="name" i]');
  }

  /**
   * Get tier select dropdown in modal
   */
  get tierSelectDropdown(): Locator {
    return this.page.locator('select, [role="listbox"]');
  }

  /**
   * Get save/add button in modal (scoped to dialog)
   */
  get modalSaveButton(): Locator {
    return this.page.locator('[role="dialog"] button:has-text("Add Item"), [role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("Create")');
  }

  /**
   * Get cancel button in modal (scoped to dialog)
   */
  get modalCancelButton(): Locator {
    return this.page.locator('[role="dialog"] button:has-text("Cancel")');
  }

  /**
   * Add a new item using the modal
   */
  async addItem(name: string, tier = "unranked"): Promise<void> {
    await this.clickAddItem();
    await this.waitForAnimation();

    // Fill in name
    await this.itemNameInput.fill(name);

    // Select tier if not unranked
    if (tier !== "unranked") {
      const tierSelect = this.tierSelectDropdown;
      if ((await tierSelect.count()) > 0) {
        await tierSelect.selectOption(tier);
      }
    }

    await this.modalSaveButton.click();
    await this.waitForContentUpdate();
  }

  // ============================================================================
  // Edit Item Modal
  // ============================================================================

  /**
   * Get the Edit Item modal
   */
  get editItemModal(): Locator {
    return this.page.locator('[role="dialog"]').filter({ hasText: /Edit.*Item/i });
  }

  /**
   * Edit an existing item
   */
  async editItem(itemId: string, newName: string): Promise<void> {
    await this.doubleClickItem(itemId);
    await this.waitForAnimation();

    await this.itemNameInput.fill(newName);
    await this.modalSaveButton.click();
    await this.waitForContentUpdate();
  }

  // ============================================================================
  // Selection and Batch Actions
  // ============================================================================

  /**
   * Select an item
   */
  async selectItem(itemId: string): Promise<void> {
    await this.clickItem(itemId);
  }

  /**
   * Select multiple items
   */
  async selectItems(itemIds: string[]): Promise<void> {
    for (const id of itemIds) {
      await this.selectItem(id);
    }
  }

  /**
   * Clear current selection
   */
  async clearSelection(): Promise<void> {
    const clearBtn = this.clearSelectionButton;
    if ((await clearBtn.count()) > 0) {
      await clearBtn.click();
    }
  }

  /**
   * Get the Batch Action Bar
   */
  get batchActionBar(): Locator {
    return this.page.locator('[data-testid="batch-action-bar"]');
  }

  /**
   * Get batch delete button
   */
  get batchDeleteButton(): Locator {
    return this.page.locator('button:has-text("Delete")');
  }

  /**
   * Delete selected items via batch action
   */
  async deleteSelected(): Promise<void> {
    await this.batchDeleteButton.click();
    await this.waitForContentUpdate();
  }

  // ============================================================================
  // Sort and Filter
  // ============================================================================

  /**
   * Get the sort/filter bar
   */
  get sortFilterBar(): Locator {
    return this.page.locator('[data-testid="sort-filter-bar"]');
  }

  /**
   * Get search input
   */
  get searchInput(): Locator {
    return this.page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  /**
   * Search for items
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

  // ============================================================================
  // Drag and Drop (experimental)
  // ============================================================================

  /**
   * Drag an item to a different tier
   * Note: Drag-and-drop can be flaky in E2E tests
   */
  async dragItemToTier(itemId: string, targetTierId: string): Promise<void> {
    const item = this.getItemCard(itemId);
    const targetTier = this.getTierRow(targetTierId);

    await item.dragTo(targetTier);
    await this.waitForContentUpdate();
  }

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  /**
   * Press Cmd+N to add new item
   */
  async pressAddItemShortcut(): Promise<void> {
    await this.pressCommand("n");
  }

  /**
   * Press Escape to deselect all
   */
  async pressEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
  }

  /**
   * Press Delete to delete selected
   */
  async pressDelete(): Promise<void> {
    await this.page.keyboard.press("Delete");
  }

  /**
   * Press Cmd+A to select all
   */
  async pressSelectAll(): Promise<void> {
    await this.pressCommand("a");
  }

  /**
   * Press ? to show keyboard shortcuts
   */
  async pressShowShortcuts(): Promise<void> {
    await this.page.keyboard.press("?");
  }
}
