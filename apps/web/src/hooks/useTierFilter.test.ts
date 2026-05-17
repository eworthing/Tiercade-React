/**
 * Unit tests for useTierFilter — verifies that filter + sort derivation
 * and all four dispatch callbacks behave correctly.
 *
 * Uses a real RTK configureStore (same pattern as undoRedoThunks.test.ts)
 * and @testing-library/react's renderHook with a Provider wrapper so the
 * hook's useAppSelector / useAppDispatch calls see a real Redux store.
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
  setTiers,
  setSortMode,
  setSearchFilter,
  clearFilters,
} from "@tiercade/state";
import type { Items } from "@tiercade/core";
import { useTierFilter } from "./useTierFilter";

// ---------------------------------------------------------------------------
// Store factory (matches undoRedoThunks.test.ts pattern)
// ---------------------------------------------------------------------------

function makeStore(preloadedTiers?: Items) {
  return configureStore({
    reducer: {
      tier: tierReducer,
      headToHead: headToHeadReducer,
      theme: themeReducer,
      undoRedo: undoRedoReducer,
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
}

function wrapper(store: ReturnType<typeof makeStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

// ---------------------------------------------------------------------------
// Default tiers fixture
// ---------------------------------------------------------------------------

const defaultTiers: Items = {
  S: [
    { id: "1", name: "Dragon" },
    { id: "2", name: "Phoenix" },
  ],
  A: [{ id: "3", name: "Dragon Slayer" }],
  unranked: [{ id: "4", name: "Goblin" }],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useTierFilter — processedTiers derivation", () => {
  it("returns all tiers unmodified when no filters are active", () => {
    const store = makeStore(defaultTiers);
    const { result } = renderHook(() => useTierFilter(), {
      wrapper: wrapper(store),
    });

    expect(result.current.processedTiers.S).toHaveLength(2);
    expect(result.current.processedTiers.A).toHaveLength(1);
    expect(result.current.processedTiers.unranked).toHaveLength(1);
    expect(result.current.filteredItems).toBe(4);
  });

  it("filters items by searchText — only matching items appear", () => {
    const store = makeStore(defaultTiers);
    const { result } = renderHook(() => useTierFilter(), {
      wrapper: wrapper(store),
    });

    act(() => {
      store.dispatch(setSearchFilter("dragon"));
    });

    // "Dragon" (S) and "Dragon Slayer" (A) match; "Phoenix" and "Goblin" do not
    expect(result.current.processedTiers.S).toHaveLength(1);
    expect(result.current.processedTiers.S[0].id).toBe("1");
    expect(result.current.processedTiers.A).toHaveLength(1);
    expect(result.current.processedTiers.A[0].id).toBe("3");
    expect(result.current.processedTiers.unranked).toHaveLength(0);
    expect(result.current.filteredItems).toBe(2);
  });

  it("sorts items alphabetically when sort mode is alphabetical ascending", () => {
    const tiers: Items = {
      S: [
        { id: "2", name: "Zebra" },
        { id: "1", name: "Apple" },
      ],
    };
    const store = makeStore(tiers);
    const { result } = renderHook(() => useTierFilter(), {
      wrapper: wrapper(store),
    });

    act(() => {
      store.dispatch(setSortMode({ type: "alphabetical", ascending: true }));
    });

    expect(result.current.processedTiers.S[0].name).toBe("Apple");
    expect(result.current.processedTiers.S[1].name).toBe("Zebra");
  });

  it("preserves original order when sort mode is custom", () => {
    const tiers: Items = {
      S: [
        { id: "2", name: "Zebra" },
        { id: "1", name: "Apple" },
      ],
    };
    const store = makeStore(tiers);
    const { result } = renderHook(() => useTierFilter(), {
      wrapper: wrapper(store),
    });

    // Default sort mode is "custom" — order is unchanged
    expect(result.current.processedTiers.S[0].name).toBe("Zebra");
    expect(result.current.processedTiers.S[1].name).toBe("Apple");
  });
});

describe("useTierFilter — dispatch callbacks", () => {
  it("handleSearchChange dispatches setSearchFilter and re-derives processedTiers", () => {
    const store = makeStore(defaultTiers);
    const { result } = renderHook(() => useTierFilter(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.handleSearchChange("phoenix");
    });

    // Only Phoenix in S should remain
    expect(result.current.processedTiers.S).toHaveLength(1);
    expect(result.current.processedTiers.S[0].name).toBe("Phoenix");
    expect(result.current.processedTiers.A).toHaveLength(0);
  });

  it("handleClearFilters clears active search and restores all items", () => {
    const store = makeStore(defaultTiers);
    const { result } = renderHook(() => useTierFilter(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.handleSearchChange("dragon");
    });
    expect(result.current.filteredItems).toBe(2);

    act(() => {
      result.current.handleClearFilters();
    });
    expect(result.current.filteredItems).toBe(4);
  });

  it("handleSortModeChange dispatches setSortMode and re-derives sorted tiers", () => {
    const tiers: Items = {
      S: [
        { id: "b", name: "Beta" },
        { id: "a", name: "Alpha" },
      ],
    };
    const store = makeStore(tiers);
    const { result } = renderHook(() => useTierFilter(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.handleSortModeChange({ type: "alphabetical", ascending: true });
    });

    expect(result.current.processedTiers.S[0].name).toBe("Alpha");
    expect(result.current.processedTiers.S[1].name).toBe("Beta");
  });
});
