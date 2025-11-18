import { describe, expect, it } from "@jest/globals";
import type { Item, Items } from "@tiercade/core";
import {
  tierReducer,
  setTiers,
  setTierOrder,
  setSelection,
  toggleSelection,
  clearSelection,
  addItemToUnranked,
  moveItemBetweenTiers
} from "../src/tierSlice";

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

describe("tierSlice", () => {
  it("sets tiers and tier order", () => {
    const tiers = makeSampleTiers();
    const next = tierReducer(
      undefined,
      setTiers(tiers)
    );
    const withOrder = tierReducer(
      next,
      setTierOrder(["S", "A"])
    );
    expect(withOrder.tiers).toEqual(tiers);
    expect(withOrder.tierOrder).toEqual(["S", "A"]);
  });

  it("manages selection and toggle behavior", () => {
    const base = tierReducer(undefined, setSelection(["alpha"]));
    const toggledOff = tierReducer(base, toggleSelection("alpha"));
    expect(toggledOff.selection).toEqual([]);
    const toggledOn = tierReducer(toggledOff, toggleSelection("beta"));
    expect(toggledOn.selection).toEqual(["beta"]);
    const cleared = tierReducer(toggledOn, clearSelection());
    expect(cleared.selection).toEqual([]);
  });

  it("adds items to unranked", () => {
    const item = makeItem("new", "New");
    const next = tierReducer(undefined, addItemToUnranked(item));
    expect(next.tiers["unranked"]?.some((i) => i.id === "new")).toBe(true);
  });

  it("moves items between tiers via core logic", () => {
    const tiers = makeSampleTiers();
    const start = tierReducer(undefined, setTiers(tiers));
    const moved = tierReducer(
      start,
      moveItemBetweenTiers({ itemId: "beta", targetTierName: "S" })
    );

    expect(moved.tiers["A"]?.map((i) => i.id)).toEqual(["alpha"]);
    expect(moved.tiers["S"]?.some((i) => i.id === "beta")).toBe(true);
  });
});
