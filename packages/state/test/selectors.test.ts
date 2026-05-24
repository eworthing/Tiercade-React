/**
 * Tests for selectors.ts — pure-function assertion against constructed RootState.
 *
 * Each selector is tested by dispatching into a real store and asserting the
 * selector output. No thunk middleware involved — selectors are pure functions
 * of state. Tests also confirm the two latent bugs fixed this loop:
 *   - selectLastActionName used `.actionName` (wrong); now uses `.action`
 *   - theme selectors derive the catalog from `@tiercade/theme` rather than
 *     storing static bundled theme data inside Redux state.
 */

import { describe, expect, it } from "@jest/globals";
import { configureStore } from "@reduxjs/toolkit";
import { BUNDLED_THEMES, DEFAULT_THEME_ID } from "@tiercade/theme";
import { tierReducer, setTiers, setSelection } from "../src/tierSlice";
import { undoRedoReducer, pushHistory } from "../src/undoRedoSlice";
import { themeReducer, selectTheme } from "../src/themeSlice";
import { onboardingReducer } from "../src/onboardingSlice";
import { presentationReducer } from "../src/presentationSlice";
import { headToHeadReducer } from "../src/headToHeadSlice";
import {
  selectAllItems,
  selectTotalItemCount,
  selectHasSelection,
  selectSelectionCount,
  selectSelectionSet,
  selectCanUndo,
  selectCanRedo,
  selectLastActionName,
  selectHasActiveFilters,
  selectAvailableThemes,
  selectCurrentTheme,
  selectCurrentThemeId,
} from "../src/selectors";
import type { RootState } from "../src/store";
import type { MediaType } from "@tiercade/core";

/** Build a fresh store (no thunk/persistence middleware needed for selector tests). */
function makeStore() {
  return configureStore({
    reducer: {
      tier: tierReducer,
      undoRedo: undoRedoReducer,
      theme: themeReducer,
      onboarding: onboardingReducer,
      presentation: presentationReducer,
      headToHead: headToHeadReducer,
    },
  });
}

describe("selectAllItems / selectTotalItemCount", () => {
  it("returns empty array and count 0 with default state", () => {
    const state = makeStore().getState() as RootState;
    expect(selectAllItems(state)).toEqual([]);
    expect(selectTotalItemCount(state)).toBe(0);
  });

  it("flattens all tier items into a single array", () => {
    const store = makeStore();
    store.dispatch(setTiers({
      S: [{ id: "s1", name: "S1" }],
      A: [{ id: "a1", name: "A1" }, { id: "a2", name: "A2" }],
      unranked: [],
    }));
    const state = store.getState() as RootState;
    const items = selectAllItems(state);
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.id)).toContain("s1");
    expect(items.map((i) => i.id)).toContain("a2");
    expect(selectTotalItemCount(state)).toBe(3);
  });
});

describe("selectHasSelection / selectSelectionCount / selectSelectionSet", () => {
  it("hasSelection is false and count is 0 with default state", () => {
    const state = makeStore().getState() as RootState;
    expect(selectHasSelection(state)).toBe(false);
    expect(selectSelectionCount(state)).toBe(0);
    expect(selectSelectionSet(state).size).toBe(0);
  });

  it("hasSelection is true when selection is non-empty", () => {
    const store = makeStore();
    store.dispatch(setSelection(["item-1", "item-2"]));
    const state = store.getState() as RootState;
    expect(selectHasSelection(state)).toBe(true);
    expect(selectSelectionCount(state)).toBe(2);
    const set = selectSelectionSet(state);
    expect(set.has("item-1")).toBe(true);
    expect(set.has("item-99")).toBe(false);
  });
});

describe("selectCurrentThemeId", () => {
  it("returns null when no theme is selected (default state)", () => {
    const state = makeStore().getState() as RootState;
    expect(selectCurrentThemeId(state)).toBeNull();
  });

  it("returns the selected theme ID after dispatch", () => {
    const store = makeStore();
    store.dispatch(selectTheme("dark"));
    const state = store.getState() as RootState;
    expect(selectCurrentThemeId(state)).toBe("dark");
  });
});

describe("theme catalog selectors", () => {
  it("selectAvailableThemes returns the bundled theme catalog", () => {
    const state = makeStore().getState() as RootState;
    expect(selectAvailableThemes(state)).toBe(BUNDLED_THEMES);
  });

  it("selectCurrentTheme returns the default bundled theme when none is selected", () => {
    const state = makeStore().getState() as RootState;
    expect(selectCurrentTheme(state)?.id).toBe(DEFAULT_THEME_ID);
  });

  it("selectCurrentTheme resolves the selected bundled theme", () => {
    const store = makeStore();
    const selectedTheme = BUNDLED_THEMES[1] ?? BUNDLED_THEMES[0];
    store.dispatch(selectTheme(selectedTheme.id));
    const state = store.getState() as RootState;
    expect(selectCurrentTheme(state)?.id).toBe(selectedTheme.id);
  });
});

describe("selectCanUndo / selectCanRedo / selectLastActionName", () => {
  it("canUndo is false and canRedo is false with empty history", () => {
    const state = makeStore().getState() as RootState;
    expect(selectCanUndo(state)).toBe(false);
    expect(selectCanRedo(state)).toBe(false);
  });

  it("canUndo is true when past has entries", () => {
    const store = makeStore();
    store.dispatch(pushHistory({ tiers: {}, tierOrder: [], action: "move" }));
    const state = store.getState() as RootState;
    expect(selectCanUndo(state)).toBe(true);
    expect(selectCanRedo(state)).toBe(false);
  });

  it("selectLastActionName returns the action name of the last past entry", () => {
    const store = makeStore();
    store.dispatch(pushHistory({ tiers: {}, tierOrder: [], action: "first" }));
    store.dispatch(pushHistory({ tiers: {}, tierOrder: [], action: "second" }));
    const state = store.getState() as RootState;
    // This test also verifies the bug fix: .actionName → .action in selector source
    expect(selectLastActionName(state)).toBe("second");
  });

  it("selectLastActionName returns null when past is empty", () => {
    const state = makeStore().getState() as RootState;
    expect(selectLastActionName(state)).toBeNull();
  });
});

describe("selectHasActiveFilters", () => {
  it("returns false when filters object is empty (default state)", () => {
    const state = makeStore().getState() as RootState;
    expect(selectHasActiveFilters(state)).toBe(false);
  });
});
