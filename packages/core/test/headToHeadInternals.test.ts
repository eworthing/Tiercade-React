import { describe, expect, it } from "@jest/globals";
import type { Item } from "../src/models";
import {
  HeadToHeadMetrics,
  dropCuts,
  tierMapForCuts,
  churnFraction,
  selectRefinedCuts,
  type RefinementCutContext
} from "../src/headToHead";

function makeItem(id: string, name?: string): Item {
  return {
    id,
    name,
    seasonString: undefined,
    seasonNumber: undefined,
    status: undefined,
    description: undefined,
    imageUrl: undefined,
    videoUrl: undefined
  };
}

describe("HeadToHead internals", () => {
  it("dropCuts produces gaps when Wilson intervals separate tiers", () => {
    const items: Item[] = [
      makeItem("alpha"),
      makeItem("beta"),
      makeItem("gamma")
    ];

    const metrics: Record<string, HeadToHeadMetrics> = {
      alpha: {
        wins: 10,
        comparisons: 12,
        winRate: 0.8,
        wilsonLB: 0.7,
        wilsonUB: 0.9,
        nameKey: "alpha",
        id: "alpha"
      },
      beta: {
        wins: 4,
        comparisons: 10,
        winRate: 0.4,
        wilsonLB: 0.35,
        wilsonUB: 0.55,
        nameKey: "beta",
        id: "beta"
      },
      gamma: {
        wins: 1,
        comparisons: 5,
        winRate: 0.2,
        wilsonLB: 0.1,
        wilsonUB: 0.4,
        nameKey: "gamma",
        id: "gamma"
      }
    };

    const cuts = dropCuts(items, metrics, 3, 0.01);

    expect(cuts.length).toBeGreaterThan(0);
    expect(cuts.every((c) => c > 0 && c < items.length)).toBe(true);
  });

  it("selectRefinedCuts honors churn guardrails", () => {
    const context: RefinementCutContext = {
      quantCuts: [1, 2],
      refinedCuts: [1, 2],
      primaryCuts: [1, 2],
      totalComparisons: 20,
      requiredComparisons: 10,
      churn: 0.05,
      itemCount: 6
    };
    const refined = selectRefinedCuts(context);
    expect(refined).toEqual([1, 2]);

    const highChurn: RefinementCutContext = {
      quantCuts: [1, 2],
      refinedCuts: [1, 2],
      primaryCuts: [1, 2],
      totalComparisons: 5,
      requiredComparisons: 10,
      churn: 0.5,
      itemCount: 6
    };
    const fallback = selectRefinedCuts(highChurn);
    expect(fallback).toEqual([1, 2]);
  });

  it("tierMapForCuts assigns tier indices across cuts", () => {
    const items: Item[] = [
      makeItem("a"),
      makeItem("b"),
      makeItem("c"),
      makeItem("d")
    ];
    const cuts = [1, 3];
    const map = tierMapForCuts(items, cuts, 3);

    expect(map["a"]).toBe(1);
    expect(map["b"]).toBe(2);
    expect(map["c"]).toBe(2);
    expect(map["d"]).toBe(3);
  });

  it("churnFraction computes moved share correctly", () => {
    const items: Item[] = [makeItem("a"), makeItem("b"), makeItem("c")];
    const oldMap = { a: 1, b: 1, c: 2 };
    const newMap = { a: 1, b: 2, c: 2 };
    const churn = churnFraction(oldMap, newMap, items);

    // Only 'b' changes tier => 1/3
    expect(churn).toBeCloseTo(1 / 3);
  });
});

