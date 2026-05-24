/**
 * Tests for persistenceMiddleware, loadPersistedState, hasPersistedState, clearPersistedState.
 *
 * Strategy:
 * - Pass a custom in-memory Storage to each function/factory directly — no
 *   global override via Object.defineProperty. Each test gets its own isolated
 *   storage instance.
 * - Use jest.useFakeTimers to advance the 500ms debounce synchronously.
 * - Build a fresh store per test (not the singleton from store.ts).
 */

import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { configureStore } from "@reduxjs/toolkit";
import { tierReducer, setTiers } from "../src/tierSlice";
import { undoRedoReducer } from "../src/undoRedoSlice";
import { themeReducer } from "../src/themeSlice";
import { onboardingReducer } from "../src/onboardingSlice";
import { presentationReducer } from "../src/presentationSlice";
import { headToHeadReducer } from "../src/headToHeadSlice";
import {
  createPersistenceMiddleware,
  loadPersistedState,
  hasPersistedState,
  clearPersistedState,
} from "../src/persistenceMiddleware";
import { completeOnboarding } from "../src/onboardingSlice";
import type { Items } from "@tiercade/core";

const STORAGE_KEY = "tiercade-state";

/** In-memory localStorage stub — passed directly to factories/functions. */
function makeFakeStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

/** Build a fresh store using the given storage (or a fresh fake). */
function makeStoreWithStorage(storage: Storage) {
  return configureStore({
    reducer: {
      tier: tierReducer,
      undoRedo: undoRedoReducer,
      theme: themeReducer,
      onboarding: onboardingReducer,
      presentation: presentationReducer,
      headToHead: headToHeadReducer,
    },
    middleware: (getDefault) =>
      getDefault({
        serializableCheck: { ignoredActions: ["headToHead/setSkippedPairKeys"] },
      }).concat(createPersistenceMiddleware(storage)),
  });
}

describe("createPersistenceMiddleware (debounce save)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("writes state to storage after debounce expires", () => {
    const fakeStorage = makeFakeStorage();
    const store = makeStoreWithStorage(fakeStorage);
    const spy = jest.spyOn(fakeStorage, "setItem");
    const tiers: Items = { S: [{ id: "s1", name: "S1" }], A: [], unranked: [] };
    store.dispatch(setTiers(tiers));
    // Before timer fires, nothing written
    expect(spy).not.toHaveBeenCalled();
    // Advance 500ms
    jest.advanceTimersByTime(500);
    expect(spy).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    const saved = JSON.parse(fakeStorage.getItem(STORAGE_KEY)!);
    expect(saved.tier.tiers).toEqual(tiers);
    expect(saved.theme).toEqual({ selectedThemeId: null });
  });

  it("debounces — only one write when multiple actions fire rapidly", () => {
    const fakeStorage = makeFakeStorage();
    const store = makeStoreWithStorage(fakeStorage);
    const spy = jest.spyOn(fakeStorage, "setItem");
    const tiersA: Items = { S: [{ id: "s1", name: "S1" }], A: [], unranked: [] };
    const tiersB: Items = { S: [], A: [{ id: "a1", name: "A1" }], unranked: [] };
    store.dispatch(setTiers(tiersA));
    store.dispatch(setTiers(tiersB));
    jest.advanceTimersByTime(500);
    // Single write; most recent state wins
    expect(spy).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(fakeStorage.getItem(STORAGE_KEY)!);
    expect(saved.tier.tiers).toEqual(tiersB);
  });

  it("persists onboarding state — completeOnboarding is reflected in saved JSON", () => {
    const fakeStorage = makeFakeStorage();
    const store = makeStoreWithStorage(fakeStorage);
    store.dispatch(completeOnboarding());
    jest.advanceTimersByTime(500);
    const saved = JSON.parse(fakeStorage.getItem(STORAGE_KEY)!);
    expect(saved.onboarding).toBeDefined();
    expect(saved.onboarding.hasCompletedOnboarding).toBe(true);
  });
});

describe("loadPersistedState", () => {
  it("returns undefined when storage is empty", () => {
    expect(loadPersistedState(makeFakeStorage())).toBeUndefined();
  });

  it("returns parsed state when valid data is present", () => {
    const storage = makeFakeStorage();
    const fixture = {
      tier: { tiers: { S: [], A: [], unranked: [] }, tierOrder: ["S", "A"] },
      theme: { selectedThemeId: "default" },
      savedAt: Date.now(),
      version: 2,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(fixture));
    const result = loadPersistedState(storage);
    expect(result).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).tier.tierOrder).toEqual(["S", "A"]);
  });

  it("returns undefined when stored JSON is malformed", () => {
    const storage = makeFakeStorage();
    storage.setItem(STORAGE_KEY, "not-valid-json{{{");
    expect(loadPersistedState(storage)).toBeUndefined();
  });

  it("returns undefined when stored object lacks required fields", () => {
    const storage = makeFakeStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now() }));
    expect(loadPersistedState(storage)).toBeUndefined();
  });

  it("returns undefined in non-browser environments (undefined storage)", () => {
    // Simulate SSR: pass undefined to represent no localStorage.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(loadPersistedState(undefined as any)).toBeUndefined();
  });
});

describe("hasPersistedState", () => {
  it("returns false when nothing is stored", () => {
    expect(hasPersistedState(makeFakeStorage())).toBe(false);
  });

  it("returns true after something is stored", () => {
    const storage = makeFakeStorage();
    storage.setItem(STORAGE_KEY, "{}");
    expect(hasPersistedState(storage)).toBe(true);
  });

  it("returns false when storage is undefined (no-storage env)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(hasPersistedState(undefined as any)).toBe(false);
  });
});

describe("clearPersistedState", () => {
  it("removes the key so hasPersistedState returns false", () => {
    const storage = makeFakeStorage();
    storage.setItem(STORAGE_KEY, "{}");
    expect(hasPersistedState(storage)).toBe(true);
    clearPersistedState(storage);
    expect(hasPersistedState(storage)).toBe(false);
  });

  it("is a no-op when storage is undefined (no throw)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => clearPersistedState(undefined as any)).not.toThrow();
  });
});
