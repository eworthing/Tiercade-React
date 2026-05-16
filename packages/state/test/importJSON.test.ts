import { describe, expect, it } from "@jest/globals";
import { store } from "../src/store";
import { importJSON } from "../src/projectThunks";

describe("importJSON", () => {
  it("loads a project JSON with items in the unranked tier", () => {
    const projectData = {
      schemaVersion: 1,
      projectId: "test-import-001",
      title: "Test Import",
      tiers: [
        { id: "S", label: "S", order: 0, itemIds: [] },
        { id: "A", label: "A", order: 1, itemIds: [] },
        { id: "B", label: "B", order: 2, itemIds: [] },
        { id: "C", label: "C", order: 3, itemIds: [] },
        { id: "D", label: "D", order: 4, itemIds: [] },
        { id: "F", label: "F", order: 5, itemIds: [] },
        { id: "unranked", label: "Unranked", order: 6, itemIds: ["h2h-1", "h2h-2", "h2h-3", "h2h-4", "h2h-5"] }
      ],
      items: {
        "h2h-1": { id: "h2h-1", title: "Item Alpha" },
        "h2h-2": { id: "h2h-2", title: "Item Beta" },
        "h2h-3": { id: "h2h-3", title: "Item Gamma" },
        "h2h-4": { id: "h2h-4", title: "Item Delta" },
        "h2h-5": { id: "h2h-5", title: "Item Epsilon" }
      },
      audit: { createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }
    };

    const json = JSON.stringify(projectData);

    store.dispatch(importJSON(json));

    const state = store.getState();
    expect(state.tier.tierOrder).toEqual(["S", "A", "B", "C", "D", "F"]);
    expect(state.tier.tiers.unranked).toBeDefined();
    expect(state.tier.tiers.unranked!.length).toBe(5);
    expect(state.tier.tiers.unranked![0]?.name).toBe("Item Alpha");
  });
});
