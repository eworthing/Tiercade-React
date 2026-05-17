/**
 * Page-level tests for TierBoardPage.
 *
 * Asserts the page renders with tier data present and that the "Add item"
 * button triggers the ItemModal open path. Tests live at the page Interface —
 * the surface callers (AppShell) interact with.
 *
 * Mocking strategy:
 *  - @tiercade/ui heavy components (TierBoard, SortFilterBar, etc.) → minimal
 *    stubs so the page renders without drag-drop complexity.
 *  - @react-spectrum/s2 components → passthrough stubs (render children / handle
 *    onPress) so Button clicks fire correctly without Spectrum internals.
 *  - useExport → stub (html2canvas not available in jsdom).
 *  - urlSharing → stub (window.location not relevant to these page assertions).
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

// ─── Stubs ────────────────────────────────────────────────────────────────────

// Stub @tiercade/ui: render minimal wrappers that carry data-testid so
// assertions can confirm the board and filter bar are mounted.
jest.mock("@tiercade/ui", () => ({
  TierBoard: (props: Record<string, unknown>) =>
    React.createElement("div", { "data-testid": "tier-board" }, String(props.tierOrder ?? "")),
  SortFilterBar: () => React.createElement("div", { "data-testid": "sort-filter-bar" }),
  PresentationControls: () => React.createElement("div", null),
  StreamingOverlay: () => React.createElement("div", null),
}));

// Stub @react-spectrum/s2: provide thin pass-through components so onPress
// / onClick works, and Dialog-family renders children.
jest.mock("@react-spectrum/s2", () => {
  const React = require("react");
  const btn = (props: Record<string, unknown>) =>
    React.createElement("button", { onClick: props.onPress as React.MouseEventHandler }, props.children as React.ReactNode);
  return {
    Button: btn,
    ButtonGroup: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    Dialog: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    DialogTrigger: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    Heading: ({ children }: { children: React.ReactNode }) => React.createElement("h2", null, children),
    Content: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    IllustratedMessage: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    Link: ({ children }: { children: React.ReactNode }) => React.createElement("a", null, children),
    Text: ({ children }: { children: React.ReactNode }) => React.createElement("span", null, children),
    Badge: ({ children }: { children: React.ReactNode }) => React.createElement("span", null, children),
    ToastQueue: { positive: jest.fn(), negative: jest.fn() },
    Menu: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    MenuItem: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    MenuTrigger: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    TextField: () => React.createElement("input", { type: "text" }),
    Form: ({ children }: { children: React.ReactNode }) => React.createElement("form", null, children),
    Divider: () => React.createElement("hr", null),
    ToggleButton: (props: Record<string, unknown>) =>
      React.createElement("button", { onClick: props.onChange as React.MouseEventHandler }, props.children as React.ReactNode),
    Switch: () => React.createElement("input", { type: "checkbox" }),
    Slider: () => React.createElement("input", { type: "range" }),
    Picker: () => React.createElement("select", null),
    Item: ({ children }: { children: React.ReactNode }) => React.createElement("option", null, children),
    Well: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    ActionButton: (props: Record<string, unknown>) =>
      React.createElement("button", { onClick: props.onPress as React.MouseEventHandler }, props.children as React.ReactNode),
    ActionGroup: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    SearchField: () => React.createElement("input", { type: "search" }),
    CheckboxGroup: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    Checkbox: () => React.createElement("input", { type: "checkbox" }),
  };
});

// Stub S2 illustrations used directly in TierBoardPage
jest.mock("@react-spectrum/s2/illustrations/linear/Addproject", () => ({ default: () => null, __esModule: true }));

// Stub heavy components in components/ to avoid deep render trees.
jest.mock("../components/ItemModal", () => ({
  ItemModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open
      ? React.createElement("div", { "data-testid": "item-modal" },
          React.createElement("button", { onClick: onClose }, "Close modal")
        )
      : null,
}));

jest.mock("../components/TierSettingsModal", () => ({
  TierSettingsModal: () => null,
}));

jest.mock("../components/BatchActionBar", () => ({
  BatchActionBar: () => null,
}));

jest.mock("../components/TierBoardToolbar", () => ({
  TierBoardToolbar: ({
    totalItems,
    onAddItem,
  }: {
    totalItems: number;
    onAddItem: () => void;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "tier-board-toolbar" },
      React.createElement(
        "button",
        { "data-testid": "add-item-btn", onClick: onAddItem },
        `Add item (${totalItems})`
      )
    ),
}));

jest.mock("../components/CelebrationEffect", () => ({
  CelebrationEffect: () => null,
}));

// Stub useExport — html2canvas is not available in jsdom.
jest.mock("../hooks/useExport", () => ({
  TIER_BOARD_SELECTOR: "[data-tier-board]",
  useExport: () => ({
    isExporting: false,
    exportAsPNG: jest.fn(),
    copyToClipboard: jest.fn(),
  }),
}));

// Stub urlSharing — window.location reads not relevant here.
jest.mock("../utils/urlSharing", () => ({
  generateShareUrl: jest.fn(() => "https://example.com/share"),
  copyToClipboard: jest.fn().mockResolvedValue(true),
  getShareDataFromUrl: jest.fn(() => null),
  clearShareDataFromUrl: jest.fn(),
  encodeShareUrl: jest.fn(() => "encoded"),
  decodeShareUrl: jest.fn(() => null),
}));

// ─── Store factory ────────────────────────────────────────────────────────────

function makeStore(withTierData = true) {
  return configureStore({
    reducer: {
      tier: tierReducer,
      headToHead: headToHeadReducer,
      theme: themeReducer,
      undoRedo: undoRedoReducer,
      onboarding: onboardingReducer,
      presentation: presentationReducer,
    },
    preloadedState: withTierData
      ? {
          tier: {
            tiers: {
              S: [{ id: "item-1", name: "Alpha" }],
              A: [],
              B: [],
              unranked: [{ id: "item-2", name: "Beta" }],
            },
            tierOrder: ["S", "A", "B"],
            selection: [],
            tierLabels: { S: "S", A: "A", B: "B" },
            tierColors: { S: "#ff0000", A: "#00ff00", B: "#0000ff" },
            projectName: "Test Project",
            sortMode: { type: "custom" as const },
            filters: {},
          },
        }
      : undefined,
  });
}

function Wrapper({ store }: { store: ReturnType<typeof makeStore> }) {
  return function ({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

import { TierBoardPage } from "./TierBoardPage";

describe("TierBoardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the toolbar when tier data is present", () => {
    const store = makeStore(true);
    const { wrapper } = { wrapper: Wrapper({ store }) };
    render(
      React.createElement(Provider, { store },
        React.createElement(TierBoardPage)
      )
    );

    const toolbar = screen.queryByTestId("tier-board-toolbar");
    expect(toolbar).not.toBeNull();
  });

  it("renders the tier board with tier data", () => {
    const store = makeStore(true);
    render(
      React.createElement(Provider, { store },
        React.createElement(TierBoardPage)
      )
    );

    const board = screen.queryByTestId("tier-board");
    expect(board).not.toBeNull();
  });

  it("opens ItemModal when add-item button is pressed", () => {
    const store = makeStore(true);
    render(
      React.createElement(Provider, { store },
        React.createElement(TierBoardPage)
      )
    );

    // Modal is closed initially
    expect(screen.queryByTestId("item-modal")).toBeNull();

    // Press the add-item button
    const addBtn = screen.getByTestId("add-item-btn");
    fireEvent.click(addBtn);

    // Modal should now be open
    const modal = screen.queryByTestId("item-modal");
    expect(modal).not.toBeNull();
  });

  it("closes ItemModal when close is triggered", () => {
    const store = makeStore(true);
    render(
      React.createElement(Provider, { store },
        React.createElement(TierBoardPage)
      )
    );

    // Open the modal
    fireEvent.click(screen.getByTestId("add-item-btn"));
    expect(screen.queryByTestId("item-modal")).not.toBeNull();

    // Close it
    fireEvent.click(screen.getByText("Close modal"));
    expect(screen.queryByTestId("item-modal")).toBeNull();
  });
});
