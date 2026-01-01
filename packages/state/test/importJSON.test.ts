import { describe, expect, it } from "@jest/globals";
import { store } from "../src/store";
import { importJSON } from "../src/projectThunks";

describe("importJSON", () => {
  it("loads legacy tiers JSON with tiers/tierOrder shape", () => {
    const legacyData = {
      tiers: {
        S: [],
        A: [],
        B: [],
        C: [],
        D: [],
        F: [],
        unranked: [
          { id: "h2h-1", attributes: { name: "Item Alpha" } },
          { id: "h2h-2", attributes: { name: "Item Beta" } },
          { id: "h2h-3", attributes: { name: "Item Gamma" } },
          { id: "h2h-4", attributes: { name: "Item Delta" } },
          { id: "h2h-5", attributes: { name: "Item Epsilon" } }
        ]
      },
      tierOrder: ["S", "A", "B", "C", "D", "F"]
    };

    const json = JSON.stringify(legacyData);

    store.dispatch(importJSON(json));

    const state = store.getState();
    expect(state.tier.tierOrder).toEqual(legacyData.tierOrder);
    expect(state.tier.tiers.unranked).toBeDefined();
    expect(state.tier.tiers.unranked!.length).toBe(5);
    expect(state.tier.tiers.unranked![0]?.name).toBe("Item Alpha");
  });
});
