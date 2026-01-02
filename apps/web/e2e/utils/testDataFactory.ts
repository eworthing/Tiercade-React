/**
 * Test Data Factory
 *
 * Provides utilities for generating and managing test data.
 * Centralizes test data creation to ensure consistency across tests.
 *
 * Generates data in the Project format expected by ModelResolver.
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Types - Match @tiercade/core Project format
// ============================================================================

export interface TestProjectItem {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
}

export interface TestProjectTier {
  id: string;
  label: string;
  color?: string;
  order: number;
  locked?: boolean;
  itemIds: string[];
}

export interface TestAudit {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Project format expected by ModelResolver.decodeProject
 */
export interface TestTierData {
  schemaVersion: number;
  projectId: string;
  title?: string;
  description?: string;
  tiers: TestProjectTier[];
  items: Record<string, TestProjectItem>;
  audit: TestAudit;
  storage?: { mode: string };
  settings?: { theme?: string; showUnranked?: boolean };
}

// Legacy type for compatibility
export interface TestItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

// ============================================================================
// Test Data Factory
// ============================================================================

// Default tier colors matching the app
const DEFAULT_TIER_COLORS: Record<string, string> = {
  S: "#ff7f7f",
  A: "#ffbf7f",
  B: "#ffdf7f",
  C: "#ffff7f",
  D: "#bfff7f",
  F: "#7fbfff",
};

export class TestDataFactory {
  private tempFiles: string[] = [];
  private counter = 0;

  /**
   * Generate a unique ID for test items
   */
  private generateId(prefix = "test"): string {
    return `${prefix}-${Date.now()}-${++this.counter}`;
  }

  /**
   * Create audit info for a project
   */
  private createAudit(): TestAudit {
    const now = new Date().toISOString();
    return {
      createdAt: now,
      updatedAt: now,
      createdBy: "test",
      updatedBy: "test",
    };
  }

  /**
   * Create a project with the given items distributed by tier
   */
  createProject(
    itemsByTier: Record<string, TestItem[]>,
    options: { projectId?: string; title?: string } = {}
  ): TestTierData {
    const projectId = options.projectId ?? this.generateId("project");
    const tierOrder = ["S", "A", "B", "C", "D", "F"];

    // Build items dictionary and tier configs
    const items: Record<string, TestProjectItem> = {};
    const tiers: TestProjectTier[] = [];

    // Create tier configs in order
    for (let i = 0; i < tierOrder.length; i++) {
      const tierId = tierOrder[i];
      const tierItems = itemsByTier[tierId] ?? [];
      const itemIds: string[] = [];

      for (const item of tierItems) {
        items[item.id] = {
          id: item.id,
          title: item.name,
          summary: item.description,
        };
        itemIds.push(item.id);
      }

      tiers.push({
        id: tierId,
        label: `${tierId} Tier`,
        color: DEFAULT_TIER_COLORS[tierId],
        order: i,
        locked: false,
        itemIds,
      });
    }

    // Handle unranked tier
    const unrankedItems = itemsByTier.unranked ?? [];
    const unrankedItemIds: string[] = [];
    for (const item of unrankedItems) {
      items[item.id] = {
        id: item.id,
        title: item.name,
        summary: item.description,
      };
      unrankedItemIds.push(item.id);
    }
    tiers.push({
      id: "unranked",
      label: "Unranked",
      order: tierOrder.length,
      locked: false,
      itemIds: unrankedItemIds,
    });

    return {
      schemaVersion: 1,
      projectId,
      title: options.title ?? "Test Tier List",
      description: "Generated test data",
      tiers,
      items,
      audit: this.createAudit(),
      storage: { mode: "local" },
      settings: { theme: "default", showUnranked: true },
    };
  }

  /**
   * Create a single test item
   */
  createItem(
    options: Partial<{
      id: string;
      name: string;
      description: string;
    }> = {}
  ): TestItem {
    const id = options.id ?? this.generateId("item");
    return {
      id,
      name: options.name ?? `Item ${this.counter}`,
      description: options.description,
    };
  }

  /**
   * Create multiple test items with optional prefix
   */
  createItems(count: number, prefix = "Item"): TestItem[] {
    return Array.from({ length: count }, (_, i) =>
      this.createItem({ name: `${prefix} ${i + 1}` })
    );
  }

  /**
   * Create a standard tier data structure with items in unranked
   */
  createStandardTierData(items: TestItem[] = []): TestTierData {
    return this.createProject({ unranked: items });
  }

  /**
   * Create tier data with items distributed across tiers
   */
  createDistributedTierData(itemsPerTier: Record<string, number>): TestTierData {
    const itemsByTier: Record<string, TestItem[]> = {};

    for (const [tier, count] of Object.entries(itemsPerTier)) {
      if (count > 0) {
        itemsByTier[tier] = this.createItems(count, `${tier} Item`);
      }
    }

    return this.createProject(itemsByTier);
  }

  /**
   * Create tier data for Head-to-Head testing (items in unranked)
   */
  createH2HTestData(itemCount = 5): TestTierData {
    const items = Array.from({ length: itemCount }, (_, i) =>
      this.createItem({
        id: `h2h-${i + 1}`,
        name: this.getGreekLetter(i),
      })
    );

    return this.createStandardTierData(items);
  }

  /**
   * Create tier data for analytics testing (items distributed)
   */
  createAnalyticsTestData(): TestTierData {
    return this.createDistributedTierData({
      S: 2,
      A: 3,
      B: 1,
      C: 0,
      D: 0,
      F: 0,
      unranked: 1,
    });
  }

  /**
   * Create empty tier data
   */
  createEmptyTierData(): TestTierData {
    return this.createProject({});
  }

  /**
   * Create a temporary JSON file with test data
   */
  createTempJsonFile(data: TestTierData): string {
    const filename = `test-data-${Date.now()}-${this.counter++}.json`;
    const filepath = path.join("/tmp", filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    this.tempFiles.push(filepath);
    return filepath;
  }

  /**
   * Create a temporary CSV file with test data
   */
  createTempCsvFile(items: Array<{ tier: string; name: string }>): string {
    const filename = `test-data-${Date.now()}-${this.counter++}.csv`;
    const filepath = path.join("/tmp", filename);
    const header = "name,season,tier";
    const rows = items.map((item) => `${item.name},,${item.tier}`);
    fs.writeFileSync(filepath, [header, ...rows].join("\n"));
    this.tempFiles.push(filepath);
    return filepath;
  }

  /**
   * Clean up all temporary files created by this factory
   */
  cleanup(): void {
    for (const filepath of this.tempFiles) {
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    this.tempFiles = [];
  }

  /**
   * Get Greek letter name for item naming
   */
  private getGreekLetter(index: number): string {
    const letters = [
      "Alpha",
      "Beta",
      "Gamma",
      "Delta",
      "Epsilon",
      "Zeta",
      "Eta",
      "Theta",
      "Iota",
      "Kappa",
    ];
    return `Item ${letters[index % letters.length]}`;
  }
}

// ============================================================================
// Preset Test Data
// ============================================================================

/**
 * Helper to create a project with preset items
 */
function createPresetProject(
  itemsByTier: Record<string, Array<{ id: string; name: string }>>,
  projectId: string
): TestTierData {
  const tierOrder = ["S", "A", "B", "C", "D", "F"];
  const items: Record<string, TestProjectItem> = {};
  const tiers: TestProjectTier[] = [];

  // Create tier configs
  for (let i = 0; i < tierOrder.length; i++) {
    const tierId = tierOrder[i];
    const tierItems = itemsByTier[tierId] ?? [];
    const itemIds: string[] = [];

    for (const item of tierItems) {
      items[item.id] = { id: item.id, title: item.name };
      itemIds.push(item.id);
    }

    tiers.push({
      id: tierId,
      label: `${tierId} Tier`,
      color: DEFAULT_TIER_COLORS[tierId],
      order: i,
      locked: false,
      itemIds,
    });
  }

  // Handle unranked tier
  const unrankedItems = itemsByTier.unranked ?? [];
  const unrankedItemIds: string[] = [];
  for (const item of unrankedItems) {
    items[item.id] = { id: item.id, title: item.name };
    unrankedItemIds.push(item.id);
  }
  tiers.push({
    id: "unranked",
    label: "Unranked",
    order: tierOrder.length,
    locked: false,
    itemIds: unrankedItemIds,
  });

  return {
    schemaVersion: 1,
    projectId,
    title: "Test Tier List",
    description: "Generated test data",
    tiers,
    items,
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "test",
      updatedBy: "test",
    },
    storage: { mode: "local" },
    settings: { theme: "default", showUnranked: true },
  };
}

/**
 * Common test data presets for quick access
 */
export const TEST_DATA_PRESETS = {
  /** 5 items for H2H testing */
  h2h: (): TestTierData =>
    createPresetProject(
      {
        unranked: [
          { id: "h2h-1", name: "Item Alpha" },
          { id: "h2h-2", name: "Item Beta" },
          { id: "h2h-3", name: "Item Gamma" },
          { id: "h2h-4", name: "Item Delta" },
          { id: "h2h-5", name: "Item Epsilon" },
        ],
      },
      "h2h-test"
    ),

  /** Distributed items for analytics testing */
  analytics: (): TestTierData =>
    createPresetProject(
      {
        S: [
          { id: "analytics-1", name: "Top Item 1" },
          { id: "analytics-2", name: "Top Item 2" },
        ],
        A: [
          { id: "analytics-3", name: "Good Item 1" },
          { id: "analytics-4", name: "Good Item 2" },
          { id: "analytics-5", name: "Good Item 3" },
        ],
        B: [{ id: "analytics-6", name: "Average Item 1" }],
        unranked: [{ id: "analytics-7", name: "Unranked Item" }],
      },
      "analytics-test"
    ),

  /** Basic import test data */
  importTest: (): TestTierData =>
    createPresetProject(
      {
        S: [
          { id: "test-1", name: "Test Item 1" },
          { id: "test-2", name: "Test Item 2" },
        ],
      },
      "import-test"
    ),

  /** Empty tier list */
  empty: (): TestTierData => createPresetProject({}, "empty-test"),

  /** Single item for simple tests */
  singleItem: (): TestTierData =>
    createPresetProject(
      {
        unranked: [{ id: "single-1", name: "Single Test Item" }],
      },
      "single-test"
    ),
} as const;
