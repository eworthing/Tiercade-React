/**
 * Page-level tests for ImportExportPage.
 *
 * Asserts:
 *   (1) renders Import / Export heading
 *   (2) empty state: totalItems === 0 shows "Add some items" message
 *   (3) loaded state: export formats CardView renders format cards
 *   (4) showResetConfirm state machine: Reset button opens AlertDialog;
 *       Cancel closes it (useState transition at page level).
 *
 * Mocking strategy:
 *  - @react-spectrum/s2: minimal stubs (AlertDialog, DialogTrigger, Button, etc.)
 *  - @react-spectrum/s2/style macro: returns empty string class.
 *  - useImportHandlers, useExportHandlers, useExport: stub hooks to avoid
 *    FileReader / html2canvas setup in jsdom.
 */

import React from "react";
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
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

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Stub import/export hooks so jsdom doesn't need FileReader or html2canvas.
jest.mock("../hooks/useImportHandlers", () => ({
  useImportHandlers: () => ({
    onImportFile: jest.fn(),
    onImportFileSelection: jest.fn(),
  }),
}));

jest.mock("../hooks/useExportHandlers", () => ({
  useExportHandlers: () => ({
    onExport: jest.fn(),
  }),
}));

jest.mock("../hooks/useExport", () => ({
  useExport: () => ({
    isExporting: false,
    exportAsPNG: jest.fn(),
    copyToClipboard: jest.fn(),
  }),
}));

jest.mock("@react-spectrum/s2", () => {
  const React = require("react");
  const btn = (props: Record<string, unknown>) =>
    React.createElement(
      "button",
      {
        onClick: props.onPress as React.MouseEventHandler,
        "data-testid": props["data-testid"],
        disabled: props.isDisabled as boolean | undefined,
      },
      props.children as React.ReactNode
    );
  return {
    Button: btn,
    Badge: ({ children }: { children: React.ReactNode }) =>
      React.createElement("span", null, children),
    Heading: ({ children }: { children: React.ReactNode }) =>
      React.createElement("h2", null, children),
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement("span", null, children),
    Content: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
    Card: (props: Record<string, unknown>) =>
      React.createElement(
        "div",
        { "data-testid": props["data-testid"] },
        props.children as React.ReactNode
      ),
    CardView: (props: {
      items: unknown[];
      children: (item: unknown) => React.ReactNode;
      [k: string]: unknown;
    }) =>
      React.createElement(
        "div",
        { "data-testid": "card-view" },
        ...props.items.map((item) => props.children(item))
      ),
    DropZone: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "drop-zone" }, children),
    ToastQueue: { positive: jest.fn() },
    // AlertDialog: renders children + Cancel and primaryAction buttons
    AlertDialog: (props: {
      title?: string;
      children?: React.ReactNode;
      primaryActionLabel?: string;
      cancelLabel?: string;
      onPrimaryAction?: () => void;
      onCancel?: () => void;
      [k: string]: unknown;
    }) =>
      React.createElement(
        "div",
        { "data-testid": "alert-dialog" },
        React.createElement("div", { "data-testid": "alert-title" }, props.title),
        props.children,
        React.createElement(
          "button",
          {
            "data-testid": "alert-primary",
            onClick: props.onPrimaryAction as React.MouseEventHandler,
          },
          props.primaryActionLabel
        ),
        React.createElement(
          "button",
          {
            "data-testid": "alert-cancel",
            onClick: props.onCancel as React.MouseEventHandler,
          },
          props.cancelLabel
        )
      ),
    // DialogTrigger: render trigger + dialog only when isOpen=true
    DialogTrigger: (props: {
      isOpen?: boolean;
      children?: React.ReactNode;
      [k: string]: unknown;
    }) => {
      const childArray = React.Children.toArray(props.children);
      return props.isOpen
        ? React.createElement("div", null, ...childArray)
        : React.createElement("div", null, childArray.slice(0, 1));
    },
  };
});

jest.mock("@react-spectrum/s2/style", () => ({
  style: () => "",
}));

// ─── Store factory ────────────────────────────────────────────────────────────

type TierPreload = {
  tiers: Record<string, { id: string; name: string }[]>;
  tierOrder: string[];
  selection: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string>;
  projectName: string;
  sortMode: { type: "custom" };
  filters: Record<string, unknown>;
};

function makeStore(tierOverride?: Partial<TierPreload>) {
  const defaultTier: TierPreload = {
    tiers: { S: [], A: [], B: [], unranked: [] },
    tierOrder: ["S", "A", "B"],
    selection: [],
    tierLabels: { S: "S", A: "A", B: "B" },
    tierColors: { S: "#f00", A: "#0f0", B: "#00f" },
    projectName: "Test",
    sortMode: { type: "custom" as const },
    filters: {},
  };
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
      tier: { ...defaultTier, ...tierOverride },
    },
  });
}

const emptyTierOverride: Partial<TierPreload> = {
  tiers: { S: [], A: [], B: [], unranked: [] },
  projectName: "Empty",
};

const loadedTierOverride: Partial<TierPreload> = {
  tiers: {
    S: [{ id: "i1", name: "Alpha" }],
    A: [{ id: "i2", name: "Beta" }],
    B: [],
    unranked: [],
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

import { ImportExportPage } from "./ImportExportPage";

describe("ImportExportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Import / Export page heading", () => {
    const store = makeStore();
    render(
      React.createElement(Provider, { store },
        React.createElement(ImportExportPage)
      )
    );
    expect(screen.getByText("Import / Export")).toBeTruthy();
  });

  it("shows 'Add some items' message when no items in tiers (empty state)", () => {
    const store = makeStore(emptyTierOverride);
    render(
      React.createElement(Provider, { store },
        React.createElement(ImportExportPage)
      )
    );
    expect(
      screen.getByText(/Add some items to your tier list first/i)
    ).toBeTruthy();
  });

  it("renders export format cards when items are present", () => {
    const store = makeStore(loadedTierOverride);
    render(
      React.createElement(Provider, { store },
        React.createElement(ImportExportPage)
      )
    );
    // Export section heading
    expect(screen.getByText("Export")).toBeTruthy();
    // Export format cards: Share link, PNG, JSON, CSV, Markdown
    expect(
      document.querySelector("[data-testid='export-format-link']")
    ).toBeTruthy();
    expect(
      document.querySelector("[data-testid='export-format-json']")
    ).toBeTruthy();
  });

  it("opens AlertDialog when Reset button is pressed (showResetConfirm state machine)", () => {
    const store = makeStore(loadedTierOverride);
    render(
      React.createElement(Provider, { store },
        React.createElement(ImportExportPage)
      )
    );
    // AlertDialog should not be visible initially
    expect(screen.queryByTestId("alert-dialog")).toBeNull();

    // Press the Reset button to trigger showResetConfirm = true
    const resetButton = screen.getByText("Reset");
    fireEvent.click(resetButton);

    // AlertDialog should now be visible
    expect(screen.getByTestId("alert-dialog")).toBeTruthy();
    expect(screen.getByTestId("alert-title")).toBeTruthy();
  });

  it("closes AlertDialog when Cancel is pressed (showResetConfirm state machine)", () => {
    const store = makeStore(loadedTierOverride);
    render(
      React.createElement(Provider, { store },
        React.createElement(ImportExportPage)
      )
    );

    // Open the dialog
    const resetButton = screen.getByText("Reset");
    fireEvent.click(resetButton);
    expect(screen.getByTestId("alert-dialog")).toBeTruthy();

    // Close via Cancel
    const cancelButton = screen.getByTestId("alert-cancel");
    fireEvent.click(cancelButton);

    // AlertDialog should be gone
    expect(screen.queryByTestId("alert-dialog")).toBeNull();
  });
});
