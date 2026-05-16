/**
 * Tests for persistenceMiddleware, loadPersistedState, hasPersistedState, clearPersistedState.
 *
 * Strategy:
 * - Use jest.spyOn on a mock localStorage object injected into global to intercept
 *   storage calls without hitting the real storage.
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
  persistenceMiddleware,
  loadPersistedState,
  hasPersistedState,
  clearPersistedState,
} from "../src/persistenceMiddleware";
import type { Items } from "@tiercade/core";

const STORAGE_KEY = "tiercade-state";

/** Build a fresh store with persistenceMiddleware for each test. */
function makeStoreWithPersistence() {
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
      }).concat(persistenceMiddleware),
  });
}

/** In-memory localStorage mock. */
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

describe("persistenceMiddleware (debounce save)", () => {
  let fakeStorage: Storage;

  beforeEach(() => {
    jest.useFakeTimers();
    fakeStorage = makeFakeStorage();
    // Install mock localStorage globally (guards check `typeof localStorage`)
    Object.defineProperty(global, "localStorage", {
      value: fakeStorage,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    // Remove mock so other tests see undefined (node env)
    Object.defineProperty(global, "localStorage", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it("writes state to localStorage after debounce expires", () => {
    const store = makeStoreWithPersistence();
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
  });

  it("debounces — only one write when multiple actions fire rapidly", () => {
    const store = makeStoreWithPersistence();
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
});

describe("loadPersistedState", () => {
  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: makeFakeStorage(),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it("returns undefined when storage is empty", () => {
    expect(loadPersistedState()).toBeUndefined();
  });

  it("returns undefined in non-browser environments (localStorage undefined)", () => {
    Object.defineProperty(global, "localStorage", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(loadPersistedState()).toBeUndefined();
  });

  it("returns parsed state when valid data is present", () => {
    const fixture = {
      tier: { tiers: { S: [], A: [], unranked: [] }, tierOrder: ["S", "A"] },
      theme: { selectedThemeId: "default" },
      savedAt: Date.now(),
      version: 2,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fixture));
    const result = loadPersistedState();
    expect(result).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).tier.tierOrder).toEqual(["S", "A"]);
  });

  it("returns undefined when stored JSON is malformed", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    expect(loadPersistedState()).toBeUndefined();
  });

  it("returns undefined when stored object lacks required fields", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now() }));
    expect(loadPersistedState()).toBeUndefined();
  });
});

describe("hasPersistedState", () => {
  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: makeFakeStorage(),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it("returns false when nothing is stored", () => {
    expect(hasPersistedState()).toBe(false);
  });

  it("returns true after something is stored", () => {
    localStorage.setItem(STORAGE_KEY, "{}");
    expect(hasPersistedState()).toBe(true);
  });

  it("returns false in non-browser environments", () => {
    Object.defineProperty(global, "localStorage", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(hasPersistedState()).toBe(false);
  });
});

describe("clearPersistedState", () => {
  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: makeFakeStorage(),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it("removes the key so hasPersistedState returns false", () => {
    localStorage.setItem(STORAGE_KEY, "{}");
    expect(hasPersistedState()).toBe(true);
    clearPersistedState();
    expect(hasPersistedState()).toBe(false);
  });

  it("is a no-op in non-browser environments (no throw)", () => {
    Object.defineProperty(global, "localStorage", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(() => clearPersistedState()).not.toThrow();
  });
});
