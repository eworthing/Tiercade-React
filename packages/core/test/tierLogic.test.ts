import { describe, expect, it } from "@jest/globals";
import type { Items, Item } from "../src/models";
import { moveItem, reorderWithin } from "../src/tierLogic";

function makeItem(id: string, name: string): Item {
  return { id, name };
}

function makeSampleTiers(): Items {
  return {
    S: [makeItem("sigma", "Sigma")],
    A: [makeItem("alpha", "Alpha"), makeItem("beta", "Beta")],
    unranked: [makeItem("omega", "Omega")]
  };
}

describe("TierLogic", () => {
  it("Move item between tiers updates source and target", () => {
    const tiers = makeSampleTiers();
    const moved = moveItem(tiers, "beta", "S");

    expect(moved["A"]?.map((i) => i.id)).toEqual(["alpha"]);
    expect(moved["S"]?.some((i) => i.id === "beta")).toBe(true);
    expect(moved["S"]?.length).toBe(2);
  });

  it("Moving within same tier is a no-op", () => {
    const tiers = makeSampleTiers();
    const moved = moveItem(tiers, "alpha", "A");
    expect(moved).toEqual(tiers);
  });

  it("Reorder within tier shifts items to the specified index", () => {
    const tiers: Items = {
      ...makeSampleTiers(),
      S: [
        makeItem("s1", "First"),
        makeItem("s2", "Second"),
        makeItem("s3", "Third")
      ]
    };

    const reordered = reorderWithin(tiers, "S", 0, 2);
    expect(reordered["S"]?.map((i) => i.id)).toEqual(["s2", "s3", "s1"]);
  });

  it("Reorder ignores out-of-bounds input", () => {
    const tiers = makeSampleTiers();
    const reordered = reorderWithin(tiers, "S", 1, 5);
    expect(reordered).toEqual(tiers);
  });
});

