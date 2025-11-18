/**
 * Tests for formatters matching TiercadeCore formatters behavior
 */

import { ExportFormatter, AnalysisFormatter } from "../src/formatters";
import { Items, TierConfig, Item } from "../src/models";

describe("ExportFormatter", () => {
  const sampleTiers: Items = {
    S: [
      { id: "alpha", name: "Alpha", seasonString: "1" },
      { id: "omega", name: "Omega", seasonString: "Final" },
    ],
    A: [{ id: "beta", name: "Beta", seasonString: "2" }],
    B: [],
    unranked: [{ id: "gamma", name: "Gamma" }],
  };

  const sampleConfig: TierConfig = {
    S: { name: "S", description: "Supreme" },
    A: { name: "A", description: "Excellent" },
    B: { name: "B", description: "Good" },
  };

  describe("generate", () => {
    test("generates plain text export with header and tiers", () => {
      const result = ExportFormatter.generate({
        group: "Test Group",
        date: new Date("2025-01-15"),
        themeName: "Default",
        tiers: sampleTiers,
        tierConfig: sampleConfig,
        locale: "en-US",
      });

      expect(result).toContain("🗝️ My Tier List - Test Group");
      expect(result).toContain("Theme: Default");
      expect(result).toContain("S Tier (Supreme): Alpha, Omega");
      expect(result).toContain("A Tier (Excellent): Beta");
      expect(result).not.toContain("B Tier"); // B is empty
      expect(result).not.toContain("unranked"); // unranked excluded
    });

    test("falls back to tier name when config is missing", () => {
      const customTiers: Items = {
        CUSTOM: [{ id: "item1", name: "Item One" }],
      };

      const result = ExportFormatter.generate({
        group: "Custom",
        date: new Date(),
        themeName: "Custom",
        tiers: customTiers,
        tierConfig: {}, // No config for CUSTOM tier
      });

      expect(result).toContain("CUSTOM Tier (): Item One");
    });
  });

  describe("generateCSV", () => {
    test("generates CSV with header and rows", () => {
      const result = ExportFormatter.generateCSV(sampleTiers, ["S", "A", "B"]);

      expect(result).toContain("Name,Season,Tier");
      expect(result).toContain('"Alpha","1","S"');
      expect(result).toContain('"Omega","Final","S"');
      expect(result).toContain('"Beta","2","A"');
      expect(result).toContain('"Gamma","?","Unranked"'); // unranked items
    });

    test("sanitizes CSV cells to prevent formula injection", () => {
      const dangerousTiers: Items = {
        S: [{ id: "evil", name: "=SUM(A1:A10)", seasonString: "+cmd" }],
      };

      const result = ExportFormatter.generateCSV(dangerousTiers, ["S"], {
        sanitize: true,
      });

      expect(result).toContain("'=SUM(A1:A10)"); // Leading = prefixed
      expect(result).toContain("'+cmd"); // Leading + prefixed
    });
  });

  describe("generateMarkdown", () => {
    test("generates Markdown with headings and lists", () => {
      const result = ExportFormatter.generateMarkdown(
        "Test Group",
        "Default",
        sampleTiers,
        ["S", "A", "B"],
        sampleConfig,
        new Date("2025-01-15"),
        "en-US"
      );

      expect(result).toContain("# My Tier List - Test Group");
      expect(result).toContain("**Theme:** Default");
      expect(result).toContain("## S Tier");
      expect(result).toContain("- **Alpha** (Season 1)");
      expect(result).toContain("- **Omega** (Season Final)");
      expect(result).toContain("## A Tier");
      expect(result).toContain("- **Beta** (Season 2)");
      expect(result).toContain("## Unranked");
      expect(result).toContain("- Gamma (Season ?)");
    });
  });

  describe("sanitizeCSVCell", () => {
    test("prefixes formula-leading characters", () => {
      expect(ExportFormatter.sanitizeCSVCell("=formula")).toBe("'=formula");
      expect(ExportFormatter.sanitizeCSVCell("+cmd")).toBe("'+cmd");
      expect(ExportFormatter.sanitizeCSVCell("-value")).toBe("'-value");
      expect(ExportFormatter.sanitizeCSVCell("@ref")).toBe("'@ref");
    });

    test("does not prefix safe values", () => {
      expect(ExportFormatter.sanitizeCSVCell("Safe Name")).toBe("Safe Name");
      expect(ExportFormatter.sanitizeCSVCell("123")).toBe("123");
    });
  });
});

describe("AnalysisFormatter", () => {
  test("generateTierAnalysis formats tier analysis with item details", () => {
    const items: Item[] = [
      {
        id: "alpha",
        name: "Alpha",
        seasonString: "1",
        status: "Active",
        description: "First item",
      },
      {
        id: "beta",
        name: "Beta",
        seasonNumber: 2,
        status: "Inactive",
      },
    ];

    const result = AnalysisFormatter.generateTierAnalysis(
      "S",
      { name: "S", description: "Supreme tier" },
      items
    );

    expect(result).toContain("S Tier Analysis - Supreme tier");
    expect(result).toContain("You've placed 2 items in this tier:");
    expect(result).toContain("• Alpha (Season 1, Active)");
    expect(result).toContain("  First item"); // Description included
    expect(result).toContain("• Beta (Season 2, Inactive)");
  });

  test("handles singular item count correctly", () => {
    const items: Item[] = [{ id: "solo", name: "Solo Item" }];

    const result = AnalysisFormatter.generateTierAnalysis(
      "A",
      { name: "A" },
      items
    );

    expect(result).toContain("You've placed 1 item in this tier:");
  });
});
