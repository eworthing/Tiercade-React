/**
 * Interface tests for createAppStore factory.
 *
 * Tests the factory's Interface contract:
 *   1. Returns a fresh, functional store on every call.
 *   2. preloadedState option is honoured — store starts with caller-supplied state.
 *   3. Multiple stores are fully isolated (no shared state).
 *   4. persistenceMiddleware option is honoured — custom middleware receives actions.
 *
 * Avoids touching globalThis.localStorage. Uses createPersistenceMiddleware
 * with a fake Storage to test the middleware wiring path in isolation.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { createAppStore } from "../src/store";
import { createPersistenceMiddleware } from "../src/persistenceMiddleware";
import { setTiers, setTierOrder } from "../src/tierSlice";
import type { Items } from "@tiercade/core";

function makeSampleTiers(): Items {
  return {
    S: [{ id: "s1", name: "S-tier item" }],
    A: [],
    B: [],
    C: [],
    D: [],
    F: [],
    unranked: [{ id: "u1", name: "Unranked item" }],
  };
}

function makeFakeStorage(): Storage {
  const db: Record<string, string> = {};
  return {
    getItem: (key: string) => db[key] ?? null,
    setItem: (key: string, value: string) => { db[key] = value; },
    removeItem: (key: string) => { delete db[key]; },
    clear: () => { Object.keys(db).forEach((k) => delete db[k]); },
    key: (i: number) => Object.keys(db)[i] ?? null,
    get length() { return Object.keys(db).length; },
  };
}

describe("createAppStore — store factory Interface", () => {
  it("returns a functional store with dispatch and getState", () => {
    const testStore = createAppStore({ preloadedState: {} });

    expect(testStore).toBeDefined();
    expect(typeof testStore.dispatch).toBe("function");
    expect(typeof testStore.getState).toBe("function");

    const state = testStore.getState();
    expect(state).toHaveProperty("tier");
    expect(state).toHaveProperty("theme");
    expect(state).toHaveProperty("undoRedo");
  });

  it("honours preloadedState — store starts with caller-supplied tier data", () => {
    const tiers = makeSampleTiers();
    const testStore = createAppStore({
      preloadedState: {
        tier: {
          tiers,
          tierOrder: ["S", "A", "B", "C", "D", "F"],
          projectName: "Test Project",
          selection: [],
          tierLabels: {},
          tierColors: {},
          sortMode: { type: "custom" as const },
          filters: {},
        },
      },
    });

    const { tier } = testStore.getState();
    expect(tier.tiers["S"]).toHaveLength(1);
    expect(tier.tiers["S"]?.[0]?.id).toBe("s1");
    expect(tier.projectName).toBe("Test Project");
  });

  it("multiple stores do not share state — mutations in one do not affect the other", () => {
    const storeA = createAppStore({ preloadedState: {} });
    const storeB = createAppStore({ preloadedState: {} });

    const tiers = makeSampleTiers();
    storeA.dispatch(setTiers(tiers));
    storeA.dispatch(setTierOrder(["S", "A", "B", "C", "D", "F"]));

    // storeA should have the dispatched tiers
    expect(storeA.getState().tier.tiers["S"]).toHaveLength(1);
    expect(storeA.getState().tier.tierOrder).toEqual(["S", "A", "B", "C", "D", "F"]);

    // storeB must be unaffected — still has the empty initial state
    expect(storeB.getState().tier.tiers).toEqual({});
    expect(storeB.getState().tier.tierOrder).toEqual([]);
  });

  it("honours persistenceMiddleware option — custom middleware receives dispatched actions", () => {
    jest.useFakeTimers();
    const fakeStorage = makeFakeStorage();
    const customMiddleware = createPersistenceMiddleware(fakeStorage);

    const testStore = createAppStore({ preloadedState: {}, persistenceMiddleware: customMiddleware });

    const tiers = makeSampleTiers();
    testStore.dispatch(setTiers(tiers));

    // Advance past the 500ms debounce
    jest.runAllTimers();

    const saved = fakeStorage.getItem("tiercade-state");
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.tier.tiers["S"]).toHaveLength(1);

    jest.useRealTimers();
  });
});
