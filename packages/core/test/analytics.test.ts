/**
 * Tests for analytics helpers
 */

import {
  analyzeTierDistribution,
  analyzeSeasonDistribution,
  generateAnalyticsSummary,
  isTierListBalanced,
  getTierBalanceScore,
} from "../src/analytics";
import type { Items } from "../src/models";

describe("Analytics", () => {
  const sampleTiers: Items = {
    S: [
      { id: "alpha", name: "Alpha", seasonString: "1" },
      { id: "omega", name: "Omega", seasonString: "Final" },
    ],
    A: [
      { id: "beta", name: "Beta", seasonString: "1" },
      { id: "sigma", name: "Sigma", seasonString: "1" },
    ],
    B: [{ id: "gamma", name: "Gamma", seasonString: "2" }],
    C: [],
    unranked: [{ id: "delta", name: "Delta", seasonString: "3" }],
  };

  describe("analyzeTierDistribution", () => {
    test("calculates tier distribution correctly", () => {
      const analytics = analyzeTierDistribution(sampleTiers, ["S", "A", "B", "C"]);

      expect(analytics.totalItems).toBe(6); // Including unranked
      expect(analytics.totalTiers).toBe(4);
      expect(analytics.distribution).toHaveLength(5); // 4 tiers + unranked

      const sTier = analytics.distribution.find((d) => d.tierName === "S");
      expect(sTier?.itemCount).toBe(2);
      expect(sTier?.percentage).toBeCloseTo(33.33, 1);

      const cTier = analytics.distribution.find((d) => d.tierName === "C");
      expect(cTier?.itemCount).toBe(0);
      expect(cTier?.percentage).toBe(0);
    });

    test("identifies largest and smallest tiers", () => {
      const analytics = analyzeTierDistribution(sampleTiers, ["S", "A", "B", "C"]);

      expect(analytics.largestTier.name).toBe("A");
      expect(analytics.largestTier.count).toBe(2);

      expect(analytics.smallestTier.name).toBe("B");
      expect(analytics.smallestTier.count).toBe(1);
    });

    test("identifies empty tiers", () => {
      const analytics = analyzeTierDistribution(sampleTiers, ["S", "A", "B", "C"]);

      expect(analytics.emptyTiers).toEqual(["C"]);
    });

    test("calculates average items per tier", () => {
      const analytics = analyzeTierDistribution(sampleTiers, ["S", "A", "B", "C"]);

      // Total items (excluding unranked) / total tiers = (2+2+1+0) / 4 = 1.25
      expect(analytics.averageItemsPerTier).toBeCloseTo(1.25, 2);
    });
  });

  describe("analyzeSeasonDistribution", () => {
    test("identifies unique seasons", () => {
      const stats = analyzeSeasonDistribution(sampleTiers);

      expect(stats.totalSeasons).toBe(3); // "1", "2", "3", "Final"
      expect(stats.seasonsRepresented).toContain("1");
      expect(stats.seasonsRepresented).toContain("2");
      expect(stats.seasonsRepresented).toContain("3");
    });

    test("finds most common season", () => {
      const stats = analyzeSeasonDistribution(sampleTiers);

      expect(stats.mostCommonSeason).toBe("1"); // Appears 3 times
    });

    test("counts season distribution", () => {
      const stats = analyzeSeasonDistribution(sampleTiers);

      expect(stats.seasonDistribution["1"]).toBe(3);
      expect(stats.seasonDistribution["2"]).toBe(1);
      expect(stats.seasonDistribution["3"]).toBe(1);
    });
  });

  describe("generateAnalyticsSummary", () => {
    test("generates text summary", () => {
      const analytics = analyzeTierDistribution(sampleTiers, ["S", "A", "B", "C"]);
      const summary = generateAnalyticsSummary(analytics);

      expect(summary).toContain("Total Items: 6");
      expect(summary).toContain("Total Tiers: 4");
      expect(summary).toContain("S: 2 items");
      expect(summary).toContain("Empty Tiers: C");
      expect(summary).toContain("Largest Tier: A");
      expect(summary).toContain("Smallest Tier: B");
    });
  });

  describe("isTierListBalanced", () => {
    test("returns true for balanced tier list", () => {
      const balancedTiers: Items = {
        S: [{ id: "a" }, { id: "b" }],
        A: [{ id: "c" }, { id: "d" }],
        B: [{ id: "e" }, { id: "f" }],
      };

      const analytics = analyzeTierDistribution(balancedTiers, ["S", "A", "B"]);
      expect(isTierListBalanced(analytics)).toBe(true);
    });

    test("returns false for unbalanced tier list", () => {
      const unbalancedTiers: Items = {
        S: [{ id: "a" }],
        A: Array.from({ length: 10 }, (_, i) => ({ id: `item${i}` })),
        B: [{ id: "z" }],
      };

      const analytics = analyzeTierDistribution(unbalancedTiers, ["S", "A", "B"]);
      expect(isTierListBalanced(analytics)).toBe(false);
    });
  });

  describe("getTierBalanceScore", () => {
    test("returns 100 for perfectly balanced list", () => {
      const perfectTiers: Items = {
        S: [{ id: "a" }, { id: "b" }],
        A: [{ id: "c" }, { id: "d" }],
        B: [{ id: "e" }, { id: "f" }],
      };

      const analytics = analyzeTierDistribution(perfectTiers, ["S", "A", "B"]);
      expect(getTierBalanceScore(analytics)).toBe(100);
    });

    test("returns lower score for unbalanced list", () => {
      const unbalancedTiers: Items = {
        S: [{ id: "a" }],
        A: Array.from({ length: 10 }, (_, i) => ({ id: `item${i}` })),
        B: [{ id: "z" }],
      };

      const analytics = analyzeTierDistribution(unbalancedTiers, ["S", "A", "B"]);
      const score = getTierBalanceScore(analytics);
      expect(score).toBeLessThan(50);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test("returns 100 for empty tier list", () => {
      const emptyTiers: Items = { S: [], A: [], B: [] };
      const analytics = analyzeTierDistribution(emptyTiers, ["S", "A", "B"]);
      expect(getTierBalanceScore(analytics)).toBe(100);
    });
  });
});
