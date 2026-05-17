/**
 * Tests for undoRedoThunks — multi-slice undo/redo round-trip behavior.
 *
 * Each test uses a real configureStore instance (not the singleton store.ts
 * which calls loadPersistedState() at module load). This exercises the actual
 * cross-slice coordination: captureSnapshot → performUndo → performRedo.
 */

import { describe, expect, it } from "@jest/globals";
import { configureStore } from "@reduxjs/toolkit";
import { tierReducer, setTiers } from "../src/tierSlice";
import { undoRedoReducer } from "../src/undoRedoSlice";
import { headToHeadReducer } from "../src/headToHeadSlice";
import { themeReducer } from "../src/themeSlice";
import { onboardingReducer } from "../src/onboardingSlice";
import { presentationReducer } from "../src/presentationSlice";
import {
  captureSnapshot,
  performUndo,
  performRedo,
  moveItemBetweenTiersWithUndo,
} from "../src/undoRedoThunks";
import type { Items } from "@tiercade/core";

/**
 * Build a fresh store with thunk middleware (getDefaultMiddleware includes thunk).
 * Includes all slices so RootState shape matches what undoRedoThunks reads.
 */
function makeStore(preloadedTiers?: Items) {
  const store = configureStore({
    reducer: {
      tier: tierReducer,
      undoRedo: undoRedoReducer,
      headToHead: headToHeadReducer,
      theme: themeReducer,
      onboarding: onboardingReducer,
      presentation: presentationReducer,
    },
    preloadedState: preloadedTiers
      ? {
          tier: {
            tiers: preloadedTiers,
            tierOrder: ["S", "A"],
            selection: [],
            tierLabels: {},
            tierColors: {},
            projectName: "Test",
            sortMode: { type: "custom" as const },
            filters: {},
          },
        }
      : undefined,
  });
  // AppDispatch inferred from store includes ThunkDispatch
  return store;
}

type StoreType = ReturnType<typeof makeStore>;
type AppDispatch = StoreType["dispatch"];

const tiersA: Items = { S: [{ id: "s1", name: "S1" }], A: [], unranked: [] };
const tiersB: Items = { S: [{ id: "s1", name: "S1" }, { id: "a1", name: "A1" }], A: [], unranked: [] };

describe("captureSnapshot", () => {
  it("pushes current tier state onto the past stack", () => {
    const store = makeStore(tiersA);
    const dispatch = store.dispatch as AppDispatch;
    dispatch(captureSnapshot("test action"));
    const { past } = store.getState().undoRedo;
    expect(past).toHaveLength(1);
    expect(past[0].tiers).toEqual(tiersA);
    expect(past[0].action).toBe("test action");
  });

  it("accumulates multiple snapshots in order", () => {
    const store = makeStore(tiersA);
    const dispatch = store.dispatch as AppDispatch;
    dispatch(captureSnapshot("first"));
    store.dispatch(setTiers(tiersB));
    dispatch(captureSnapshot("second"));
    const { past } = store.getState().undoRedo;
    expect(past).toHaveLength(2);
    expect(past[0].action).toBe("first");
    expect(past[1].action).toBe("second");
  });
});

describe("performUndo", () => {
  it("is a no-op when past stack is empty", () => {
    const store = makeStore(tiersA);
    const dispatch = store.dispatch as AppDispatch;
    dispatch(performUndo());
    expect(store.getState().tier.tiers).toEqual(tiersA);
    expect(store.getState().undoRedo.past).toHaveLength(0);
  });

  it("restores previous tier state and moves snapshot to future", () => {
    const store = makeStore(tiersA);
    const dispatch = store.dispatch as AppDispatch;
    // Capture the before state, then change tiers
    dispatch(captureSnapshot("move"));
    store.dispatch(setTiers(tiersB));
    expect(store.getState().tier.tiers).toEqual(tiersB);
    // Undo — should restore tiersA
    dispatch(performUndo());
    expect(store.getState().tier.tiers).toEqual(tiersA);
    expect(store.getState().undoRedo.past).toHaveLength(0);
    expect(store.getState().undoRedo.future).toHaveLength(1);
  });
});

describe("performRedo", () => {
  it("is a no-op when future stack is empty", () => {
    const store = makeStore(tiersA);
    const dispatch = store.dispatch as AppDispatch;
    dispatch(performRedo());
    expect(store.getState().tier.tiers).toEqual(tiersA);
  });

  it("restores the undone state and moves snapshot back to past", () => {
    const store = makeStore(tiersA);
    const dispatch = store.dispatch as AppDispatch;
    dispatch(captureSnapshot("move"));
    store.dispatch(setTiers(tiersB));
    dispatch(performUndo());
    // State is back to tiersA; future has one entry
    dispatch(performRedo());
    // The redo restores the snapshot that was in future (tiersA) back to tiers
    // and moves it to past — so past has length 1, future is empty
    expect(store.getState().undoRedo.past).toHaveLength(1);
    expect(store.getState().undoRedo.future).toHaveLength(0);
  });
});

describe("moveItemBetweenTiersWithUndo", () => {
  it("captures snapshot then moves item — snapshot is recoverable via undo", () => {
    const initialTiers: Items = {
      S: [{ id: "x", name: "X" }],
      A: [],
      unranked: [],
    };
    const store = makeStore(initialTiers);
    const dispatch = store.dispatch as AppDispatch;
    // Move item x from S to A
    dispatch(moveItemBetweenTiersWithUndo("x", "A"));
    // After move: x should be in A, not in S
    const afterMove = store.getState().tier.tiers;
    expect(afterMove["A"]?.some((i) => i.id === "x")).toBe(true);
    expect(afterMove["S"]?.some((i) => i.id === "x")).toBe(false);
    // A snapshot was captured before the move
    expect(store.getState().undoRedo.past).toHaveLength(1);
    // Undo — should restore x to S
    dispatch(performUndo());
    const afterUndo = store.getState().tier.tiers;
    expect(afterUndo["S"]?.some((i) => i.id === "x")).toBe(true);
  });
});
