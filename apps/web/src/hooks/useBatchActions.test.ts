/**
 * Unit tests for useBatchActions — verifies batch-move and batch-delete
 * dispatch their guards (empty selection) and actual effects correctly.
 *
 * Uses a real RTK configureStore (same pattern as useTierFilter.test.ts)
 * and @testing-library/react's renderHook with a Provider wrapper.
 */

import React from "react";
import { describe, expect, it } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  tierReducer,
  headToHeadReducer,
  themeReducer,
  undoRedoReducer,
  onboardingReducer,
  presentationReducer,
  addItemToTier,
  toggleSelection,
} from "@tiercade/state";
import { useBatchActions } from "./useBatchActions";
import { useAppDispatch } from "./useAppDispatch";

// ─── Store factory ────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({
    reducer: {
      tier: tierReducer,
      headToHead: headToHeadReducer,
      theme: themeReducer,
      undoRedo: undoRedoReducer,
      onboarding: onboardingReducer,
      presentation: presentationReducer,
    },
    preloadedState: {
      tier: {
        tiers: { S: [], A: [], B: [], unranked: [] },
        tierOrder: ["S", "A", "B"],
        selection: [],
        tierLabels: {},
        tierColors: {},
        projectName: "Test",
        sortMode: { type: "custom" as const },
        filters: {},
      },
    },
  });
}

function wrapper(store: ReturnType<typeof makeStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useBatchActions", () => {
  it("onBatchMoveToTier does nothing when selection is empty", () => {
    const store = makeStore();
    act(() => {
      store.dispatch(addItemToTier({ tierName: "S", item: { id: "item1", name: "Item 1" } }));
    });

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useBatchActions(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    const beforeA = store.getState().tier.tiers["A"].length;
    act(() => {
      result.current.onBatchMoveToTier("A");
    });
    // Nothing moved — selection was empty
    expect(store.getState().tier.tiers["A"].length).toBe(beforeA);
  });

  it("onBatchMoveToTier moves selected items to target tier", () => {
    const store = makeStore();
    act(() => {
      store.dispatch(addItemToTier({ tierName: "S", item: { id: "item1", name: "Item 1" } }));
      store.dispatch(addItemToTier({ tierName: "S", item: { id: "item2", name: "Item 2" } }));
      store.dispatch(toggleSelection("item1"));
      store.dispatch(toggleSelection("item2"));
    });

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useBatchActions(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onBatchMoveToTier("B");
    });

    const bTier = store.getState().tier.tiers["B"];
    const ids = bTier.map((i: { id: string }) => i.id);
    expect(ids).toContain("item1");
    expect(ids).toContain("item2");
  });

  it("onBatchDelete does nothing when selection is empty", () => {
    const store = makeStore();
    act(() => {
      store.dispatch(addItemToTier({ tierName: "S", item: { id: "item1", name: "Item 1" } }));
    });

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useBatchActions(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    const before = store.getState().tier.tiers["S"].length;
    act(() => {
      result.current.onBatchDelete();
    });
    expect(store.getState().tier.tiers["S"].length).toBe(before);
  });

  it("onBatchDelete removes all selected items", () => {
    const store = makeStore();
    act(() => {
      store.dispatch(addItemToTier({ tierName: "S", item: { id: "item1", name: "Item 1" } }));
      store.dispatch(addItemToTier({ tierName: "S", item: { id: "item2", name: "Item 2" } }));
      store.dispatch(toggleSelection("item1"));
    });

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useBatchActions(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onBatchDelete();
    });

    const sTier = store.getState().tier.tiers["S"];
    const ids = sTier.map((i: { id: string }) => i.id);
    expect(ids).not.toContain("item1");
    expect(ids).toContain("item2");
  });

  it("onBatchMoveToTier captures a snapshot (undo history non-empty)", () => {
    const store = makeStore();
    act(() => {
      store.dispatch(addItemToTier({ tierName: "S", item: { id: "item1", name: "Item 1" } }));
      store.dispatch(toggleSelection("item1"));
    });

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useBatchActions(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onBatchMoveToTier("A");
    });

    // captureSnapshot should have pushed to undoRedo.past
    expect(store.getState().undoRedo.past.length).toBeGreaterThan(0);
  });

  it("onBatchDelete captures a snapshot (undo history non-empty)", () => {
    const store = makeStore();
    act(() => {
      store.dispatch(addItemToTier({ tierName: "S", item: { id: "item1", name: "Item 1" } }));
      store.dispatch(toggleSelection("item1"));
    });

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useBatchActions(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onBatchDelete();
    });

    expect(store.getState().undoRedo.past.length).toBeGreaterThan(0);
  });
});
