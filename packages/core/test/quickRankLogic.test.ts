import { describe, expect, it } from "@jest/globals";
import type { Item, Items } from "../src/models";
import { assign } from "../src/quickRankLogic";

function makeItem(id: string, name: string): Item {
  return { id, name };
}

function makeSampleTiers(): Items {
  return {
    S: [makeItem("sigma", "Sigma")],
    A: [makeItem("alpha", "Alpha"), makeItem("beta", "Beta")],
    unranked: []
  };
}

describe("QuickRankLogic.assign", () => {
  it("moves item into desired tier", () => {
    const tiers = makeSampleTiers();
    const updated = assign(tiers, "beta", "S");

    expect(updated["S"]?.map((i) => i.id)).toEqual(["sigma", "beta"]);
    expect(updated["A"]?.map((i) => i.id)).toEqual(["alpha"]);
  });

  it("is a no-op when item is missing", () => {
    const tiers = makeSampleTiers();
    const updated = assign(tiers, "missing", "S");
    expect(updated).toEqual(tiers);
  });

  it("is a no-op when assigning to current tier", () => {
    const tiers = makeSampleTiers();
    const updated = assign(tiers, "alpha", "A");
    expect(updated).toEqual(tiers);
  });
});

