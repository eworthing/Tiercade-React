/**
 * Tests for ModelResolver matching Swift behavior
 */

import { ModelResolver, ModelResolverError, FileTooLargeError } from "../src/modelResolver";
import { Project } from "../src/project";

describe("ModelResolver", () => {
  const sampleProject: Project = {
    schemaVersion: 1,
    projectId: "test-project",
    title: "Test Tier List",
    tiers: [
      {
        id: "S",
        label: "S Tier",
        color: "#ff0000",
        order: 0,
        locked: false,
        itemIds: ["item1", "item2"],
      },
      {
        id: "A",
        label: "A Tier",
        order: 1,
        locked: false,
        itemIds: ["item3"],
      },
      {
        id: "unranked",
        label: "Unranked",
        order: 2,
        locked: false,
        itemIds: [],
      },
    ],
    items: {
      item1: { id: "item1", title: "Alpha", subtitle: "Season 1" },
      item2: { id: "item2", title: "Beta", subtitle: "Season 2" },
      item3: { id: "item3", title: "Gamma", subtitle: "Season 3" },
    },
    storage: { mode: "local" },
    settings: { theme: "default", showUnranked: true },
    audit: {
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-15"),
      createdBy: "user1",
      updatedBy: "user1",
    },
  };

  describe("decodeProject", () => {
    test("decodes valid JSON string", () => {
      const json = JSON.stringify(sampleProject);
      const decoded = ModelResolver.decodeProject(json);

      expect(decoded.projectId).toBe("test-project");
      expect(decoded.title).toBe("Test Tier List");
      expect(decoded.tiers).toHaveLength(3);
    });

    test("throws on invalid JSON", () => {
      expect(() => {
        ModelResolver.decodeProject("{ invalid json");
      }).toThrow(ModelResolverError);
    });

    test("throws on missing required fields", () => {
      const invalid = JSON.stringify({ schemaVersion: 1 }); // Missing projectId, tiers, items

      expect(() => {
        ModelResolver.decodeProject(invalid);
      }).toThrow(ModelResolverError);
    });

    test("throws on unsupported schema version", () => {
      const unsupported = { ...sampleProject, schemaVersion: 2 };
      const json = JSON.stringify(unsupported);

      expect(() => {
        ModelResolver.decodeProject(json);
      }).toThrow(ModelResolverError);
    });

    test("throws FileTooLargeError for oversized files", () => {
      // Create a huge string
      const huge = "x".repeat(ModelResolver.MAX_FILE_SIZE_BYTES + 1);

      expect(() => {
        ModelResolver.decodeProject(huge);
      }).toThrow(FileTooLargeError);
    });
  });

  describe("resolveTiers", () => {
    test("resolves tiers and items", () => {
      const resolved = ModelResolver.resolveTiers(sampleProject);

      expect(resolved).toHaveLength(3);

      const sTier = resolved.find((t) => t.id === "S");
      expect(sTier).toBeDefined();
      expect(sTier!.label).toBe("S Tier");
      expect(sTier!.items).toHaveLength(2);
      expect(sTier!.items[0].title).toBe("Alpha");
      expect(sTier!.items[1].title).toBe("Beta");

      const aTier = resolved.find((t) => t.id === "A");
      expect(aTier!.items).toHaveLength(1);
      expect(aTier!.items[0].title).toBe("Gamma");
    });

    test("applies item overrides", () => {
      const projectWithOverrides: Project = {
        ...sampleProject,
        overrides: {
          item1: {
            displayTitle: "Alpha Override",
            notes: "Custom notes",
            rating: 5,
          },
        },
      };

      const resolved = ModelResolver.resolveTiers(projectWithOverrides);
      const sTier = resolved.find((t) => t.id === "S");

      expect(sTier!.items[0].title).toBe("Alpha Override");
      expect(sTier!.items[0].description).toBe("Custom notes");
    });

    test("skips missing items gracefully", () => {
      const projectWithMissing: Project = {
        ...sampleProject,
        tiers: [
          {
            id: "S",
            label: "S",
            order: 0,
            locked: false,
            itemIds: ["item1", "missing-item", "item2"],
          },
        ],
      };

      const resolved = ModelResolver.resolveTiers(projectWithMissing);
      expect(resolved[0].items).toHaveLength(2); // missing-item skipped
    });
  });

  describe("resolvedTierState", () => {
    test("converts project to tier state with order, labels, colors", () => {
      const state = ModelResolver.resolvedTierState(sampleProject);

      expect(state.order).toEqual(["S", "A"]);
      expect(state.labels.S).toBe("S Tier");
      expect(state.labels.A).toBe("A Tier");
      expect(state.colors.S).toBe("#ff0000");
      expect(state.locked.size).toBe(0);

      expect(state.items.S).toHaveLength(2);
      expect(state.items.A).toHaveLength(1);
      expect(state.items.S[0].name).toBe("Alpha");
    });
  });

  describe("parseCSV", () => {
    const csvInput = `Name,Season,Tier
"Alpha","1","S"
"Beta","2","A"
"Gamma","3","S"
"Delta","?","Unranked"`;

    test("parses CSV and builds Items dictionary", () => {
      const { items, discoveredTiers } = ModelResolver.parseCSV(csvInput, ["S", "A"]);

      expect(items.S).toHaveLength(2);
      expect(items.A).toHaveLength(1);
      expect(items.unranked).toHaveLength(1);

      expect(items.S[0].name).toBe("Alpha");
      expect(items.S[0].seasonString).toBe("1");
      expect(items.S[1].name).toBe("Gamma");
      expect(items.A[0].name).toBe("Beta");
      expect(items.unranked[0].name).toBe("Delta");

      expect(discoveredTiers).toEqual([]); // All tiers were known
    });

    test("discovers new tier names not in currentTierOrder", () => {
      const csvWithNewTier = `Name,Season,Tier
"Alpha","1","S"
"Beta","2","CUSTOM"`;

      const { items, discoveredTiers } = ModelResolver.parseCSV(csvWithNewTier, ["S"]);

      expect(discoveredTiers).toEqual(["CUSTOM"]);
      expect(items.CUSTOM).toHaveLength(1);
      expect(items.CUSTOM[0].name).toBe("Beta");
    });

    test("ensures unique IDs for duplicate names", () => {
      const csvWithDupes = `Name,Season,Tier
"Alpha","1","S"
"Alpha","2","A"
"Alpha","3","S"`;

      const { items } = ModelResolver.parseCSV(csvWithDupes, ["S", "A"]);

      const allItems = [...items.S, ...items.A];
      const ids = allItems.map((item) => item.id);

      expect(ids).toEqual(["alpha", "alpha_2", "alpha_3"]);
    });

    test("throws on empty CSV", () => {
      expect(() => {
        ModelResolver.parseCSV("", []);
      }).toThrow(ModelResolverError);
    });
  });
});
