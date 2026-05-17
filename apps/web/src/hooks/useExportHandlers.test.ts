/**
 * Unit tests for useExportHandlers — verifies JSON, CSV, and Markdown export
 * dispatch the correct file download, and that onExport routes to each format.
 *
 * Uses a real RTK configureStore (same pattern as other hook tests)
 * and @testing-library/react's renderHook with a Provider wrapper.
 *
 * downloadFile creates a DOM anchor and calls click(); we spy on
 * URL.createObjectURL and document.createElement to intercept without
 * triggering actual downloads.
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
} from "@tiercade/state";
import { useExportHandlers } from "./useExportHandlers";

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
        tiers: {
          S: [{ id: "item-1", name: "Alpha" }],
          A: [],
          B: [],
          unranked: [],
        },
        tierOrder: ["S", "A", "B"],
        selection: [],
        tierLabels: { S: "S-Tier", A: "A-Tier" },
        tierColors: { S: "#ff0000", A: "#00ff00" },
        projectName: "My Project",
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

// ─── DOM mocks ────────────────────────────────────────────────────────────────

/**
 * jsdom does not implement URL.createObjectURL / revokeObjectURL.
 * Install stubs via Object.defineProperty so spy infrastructure can work.
 */
function installURLStubs() {
  if (!URL.createObjectURL) {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      configurable: true,
      value: () => "blob:mock-url",
    });
  }
  if (!URL.revokeObjectURL) {
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      configurable: true,
      value: () => {},
    });
  }
}

/** Track which filename was passed to the anchor download attribute. */
function mockDownloadCapture() {
  installURLStubs();

  const calls: { filename: string }[] = [];

  // Replace createObjectURL so we control the URL value
  URL.createObjectURL = jest.fn().mockReturnValue("blob:mock-url");
  URL.revokeObjectURL = jest.fn();

  const originalCreateElement = document.createElement.bind(document);
  jest
    .spyOn(document, "createElement")
    .mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        // Intercept download trigger
        jest.spyOn(el as HTMLAnchorElement, "click").mockImplementation(() => {
          calls.push({ filename: (el as HTMLAnchorElement).download });
        });
      }
      return el;
    });

  jest.spyOn(document.body, "appendChild").mockImplementation((node) => node);
  jest.spyOn(document.body, "removeChild").mockImplementation((node) => node);

  return calls;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useExportHandlers", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("onExportJSON triggers a download with .json filename", () => {
    const store = makeStore();
    const downloadCalls = mockDownloadCapture();
    const exportAsPNG = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useExportHandlers(exportAsPNG),
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onExportJSON();
    });

    expect(downloadCalls.length).toBe(1);
    expect(downloadCalls[0].filename).toMatch(/\.json$/);
  });

  it("onExportCSV triggers a download with .csv filename", () => {
    const store = makeStore();
    const downloadCalls = mockDownloadCapture();
    const exportAsPNG = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useExportHandlers(exportAsPNG),
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onExportCSV();
    });

    expect(downloadCalls.length).toBe(1);
    expect(downloadCalls[0].filename).toMatch(/\.csv$/);
  });

  it("onExportMarkdown triggers a download with .md filename", () => {
    const store = makeStore();
    const downloadCalls = mockDownloadCapture();
    const exportAsPNG = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useExportHandlers(exportAsPNG),
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onExportMarkdown();
    });

    expect(downloadCalls.length).toBe(1);
    expect(downloadCalls[0].filename).toMatch(/\.md$/);
  });

  it("onExport routes 'json' format to JSON download", () => {
    const store = makeStore();
    const downloadCalls = mockDownloadCapture();
    const exportAsPNG = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useExportHandlers(exportAsPNG),
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onExport("json");
    });

    expect(downloadCalls.length).toBe(1);
    expect(downloadCalls[0].filename).toMatch(/\.json$/);
  });

  it("onExport routes 'png' format to exportAsPNG callback", async () => {
    const store = makeStore();
    const exportAsPNG = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useExportHandlers(exportAsPNG),
      { wrapper: wrapper(store) }
    );

    act(() => {
      result.current.onExport("png");
    });

    // Give the void promise a tick to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(exportAsPNG).toHaveBeenCalledTimes(1);
  });
});
