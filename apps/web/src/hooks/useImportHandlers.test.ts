/**
 * Unit tests for useImportHandlers — verifies JSON import, CSV import,
 * unsupported format handling, and empty-content guard.
 *
 * Uses a real RTK configureStore (same pattern as useBatchActions.test.ts)
 * and @testing-library/react's renderHook with a Provider wrapper.
 *
 * FileReader is mocked via jest.spyOn so the tests are synchronous-friendly.
 */

import React from "react";
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
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
} from "@tiercade/state";
import { useImportHandlers } from "./useImportHandlers";
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

// ─── FileReader mock helpers ──────────────────────────────────────────────────

/**
 * Synchronously trigger the FileReader.onload callback with `content`.
 * Patches globalThis.FileReader to avoid real async I/O.
 */
function mockFileReaderWith(content: string | null) {
  const mockReader = {
    onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
    readAsText(_file: File) {
      const event = {
        target: { result: content },
      } as unknown as ProgressEvent<FileReader>;
      if (this.onload) this.onload(event);
    },
  };
  jest
    .spyOn(globalThis, "FileReader" as keyof typeof globalThis)
    .mockImplementation(() => mockReader as unknown as FileReader);
  return mockReader;
}

function makeFile(name: string, content = "{}") {
  return new File([content], name, { type: "text/plain" });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useImportHandlers", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("onImportFile dispatches importJSON and captures snapshot for .json files", () => {
    const store = makeStore();
    // Seed the store with an existing item so we can detect the import cleared it
    act(() => {
      store.dispatch(
        addItemToTier({ tierName: "S", item: { id: "pre-existing", name: "Pre" } })
      );
    });

    // Minimal valid JSON project that @tiercade/state importJSON can parse
    const jsonContent = JSON.stringify({
      schemaVersion: 1,
      projectId: "test-proj",
      title: "Imported",
      tiers: [
        { id: "S", label: "S", color: "#ff0000", order: 0, locked: false, itemIds: ["imported-item"] },
      ],
      items: { "imported-item": { id: "imported-item", title: "Imported Item" } },
      storage: { mode: "local" },
      settings: { theme: "default", showUnranked: true },
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "test",
        updatedBy: "test",
      },
    });

    mockFileReaderWith(jsonContent);

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useImportHandlers(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onImportFile(makeFile("my-list.json", jsonContent));
    });

    // captureSnapshot pushed to undo history
    expect(store.getState().undoRedo.past.length).toBeGreaterThan(0);
    // The imported item should now appear in the store
    const sTier = store.getState().tier.tiers["S"] ?? [];
    const ids = sTier.map((i: { id: string }) => i.id);
    expect(ids).toContain("imported-item");
  });

  it("onImportFile dispatches importCSV and captures snapshot for .csv files", () => {
    const store = makeStore();
    // CSV format: Name, Season, Tier (3 columns; parser skips header row)
    const csvContent = "Name,Season,Tier\nHero,,S\nVillain,,A";

    mockFileReaderWith(csvContent);

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useImportHandlers(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onImportFile(makeFile("rankings.csv", csvContent));
    });

    // captureSnapshot pushed to undo history
    expect(store.getState().undoRedo.past.length).toBeGreaterThan(0);
    // At least one tier should have items (CSV had items in S and A)
    const totalItems = Object.values(store.getState().tier.tiers)
      .flat()
      .length;
    expect(totalItems).toBeGreaterThan(0);
  });

  it("onImportFile does not dispatch when content is empty/null", () => {
    const store = makeStore();
    mockFileReaderWith(null);

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useImportHandlers(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    const beforePast = store.getState().undoRedo.past.length;
    act(() => {
      result.current.onImportFile(makeFile("empty.json", ""));
    });

    // No snapshot captured — nothing was dispatched
    expect(store.getState().undoRedo.past.length).toBe(beforePast);
  });

  it("onImportFile does not dispatch for unsupported file extensions", () => {
    const store = makeStore();
    mockFileReaderWith("<xml>data</xml>");

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useImportHandlers(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    const beforePast = store.getState().undoRedo.past.length;
    act(() => {
      result.current.onImportFile(makeFile("export.xml", "<xml>data</xml>"));
    });

    // No snapshot captured for unsupported format
    expect(store.getState().undoRedo.past.length).toBe(beforePast);
  });

  it("onImportFileSelection delegates to onImportFile and resets input value", () => {
    const store = makeStore();
    const csvContent = "Name,Season,Tier\nHero,,S";

    mockFileReaderWith(csvContent);

    const { result } = renderHook(
      () => {
        const dispatch = useAppDispatch();
        return useImportHandlers(dispatch);
      },
      { wrapper: wrapper(store) }
    );

    const mockFile = makeFile("data.csv", csvContent);
    const mockEvent = {
      target: { files: [mockFile] },
      currentTarget: { value: "some-path" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.onImportFileSelection(mockEvent);
    });

    // Snapshot captured (import ran)
    expect(store.getState().undoRedo.past.length).toBeGreaterThan(0);
    // Input value reset
    expect(mockEvent.currentTarget.value).toBe("");
  });
});
