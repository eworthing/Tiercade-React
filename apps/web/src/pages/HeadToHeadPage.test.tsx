/**
 * Page-level tests for HeadToHeadPage.
 *
 * Asserts the four render branches:
 *   (1) empty state — totalItems < 2, "Need more items" shown
 *   (2) idle state — not active, "Start comparing" button present
 *   (3) active state — currentPair present, comparison cards shown
 *   (4) completed state — active but no currentPair, "Apply Results" button present
 *
 * Also asserts the showEndConfirm state machine:
 *   pressing "End & Apply Results" opens the AlertDialog.
 *
 * Mocking strategy:
 *  - react-router-dom: mock useNavigate (page calls navigate via useHeadToHeadHandlers)
 *  - useHeadToHeadHandlers: mock the handler hook; provides stable callbacks so
 *    tests control what the page receives without setting up the full H2H engine
 *  - @react-spectrum/s2: thin pass-through stubs so onPress/onClick works
 *  - react-aria-components: AriaButton stub for ComparisonCard
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

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useHeadToHeadHandlers to isolate page-level state machine from hook
// dispatch logic. The page's showEndConfirm useState is the target concern;
// we supply a stable onStart so "Start comparing" button can be asserted.
const mockHandlers = {
  onStart: jest.fn(),
  onVoteLeft: jest.fn(),
  onVoteRight: jest.fn(),
  onSkip: jest.fn(),
  onFinish: jest.fn(),
  onGoHome: jest.fn(),
};
jest.mock("../hooks/useHeadToHeadHandlers", () => ({
  useHeadToHeadHandlers: (_onOpenEndConfirm: () => void) => mockHandlers,
}));

// Stub @react-spectrum/s2: minimal stubs so onPress fires as onClick and
// AlertDialog renders its children + action buttons.
jest.mock("@react-spectrum/s2", () => {
  const React = require("react");
  const btn = (props: Record<string, unknown>) =>
    React.createElement(
      "button",
      {
        onClick: props.onPress as React.MouseEventHandler,
        "data-testid": props["data-testid"],
      },
      props.children as React.ReactNode
    );
  return {
    Button: btn,
    AlertDialog: (props: Record<string, unknown>) =>
      React.createElement(
        "div",
        { "data-testid": "alert-dialog" },
        props.children as React.ReactNode,
        React.createElement(
          "button",
          { onClick: props.onPrimaryAction as React.MouseEventHandler },
          props.primaryActionLabel as string
        ),
        React.createElement(
          "button",
          { onClick: props.onCancel as React.MouseEventHandler },
          props.cancelLabel as string
        )
      ),
    DialogTrigger: ({
      children,
      isOpen,
    }: {
      children: React.ReactNode;
      isOpen?: boolean;
    }) => {
      // DialogTrigger in the page has two children: [0] the trigger element,
      // [1] the AlertDialog. When isOpen is false, render only the trigger.
      const childArray = React.Children.toArray(children);
      return React.createElement(
        "div",
        null,
        isOpen ? childArray : childArray.slice(0, 1)
      );
    },
    Badge: ({ children }: { children: React.ReactNode }) =>
      React.createElement("span", null, children),
    Heading: ({
      children,
      "data-testid": dt,
    }: {
      children: React.ReactNode;
      "data-testid"?: string;
    }) => React.createElement("h2", { "data-testid": dt }, children),
    ProgressBar: ({
      "data-testid": dt,
    }: {
      "data-testid"?: string;
    }) => React.createElement("div", { "data-testid": dt }),
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement("span", null, children),
  };
});

// Stub react-aria-components: AriaButton renders as a plain button so
// ComparisonCard onClick fires correctly.
jest.mock("react-aria-components", () => {
  const React = require("react");
  return {
    Button: (props: Record<string, unknown>) =>
      React.createElement(
        "button",
        {
          onClick: props.onPress as React.MouseEventHandler,
          "data-testid": props["data-testid"],
          "aria-label": props["aria-label"],
        },
        props.children as React.ReactNode
      ),
  };
});

// Stub S2 style macro — returns an empty string class so page renders without
// the Parcel macro build step.
jest.mock("@react-spectrum/s2/style", () => ({
  style: () => "",
  focusRing: () => ({}),
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

type H2HPreload = {
  isActive: boolean;
  pool: { id: string; name: string }[];
  records: Record<string, unknown>;
  pairsQueue: [{ id: string; name: string }, { id: string; name: string }][];
  deferredPairs: unknown[];
  currentPair: [{ id: string; name: string }, { id: string; name: string }] | null;
  totalPairs: number;
  completedComparisons: number;
  skippedCount: number;
  refinementTotalComparisons: number;
  refinementCompletedComparisons: number;
  skippedPairKeys: string[];
  phase: "quick" | "refinement";
  artifacts: null;
  suggestedPairs: unknown[];
};

const baseTier: TierPreload = {
  tiers: {
    S: [{ id: "item-1", name: "Alpha" }],
    A: [],
    B: [],
    unranked: [{ id: "item-2", name: "Beta" }],
  },
  tierOrder: ["S", "A", "B"],
  selection: [],
  tierLabels: { S: "S", A: "A", B: "B" },
  tierColors: { S: "#f00", A: "#0f0", B: "#00f" },
  projectName: "Test",
  sortMode: { type: "custom" as const },
  filters: {},
};

const emptyTier: TierPreload = {
  tiers: { S: [], A: [], B: [], unranked: [] },
  tierOrder: ["S", "A", "B"],
  selection: [],
  tierLabels: {},
  tierColors: {},
  projectName: "Empty",
  sortMode: { type: "custom" as const },
  filters: {},
};

const baseH2H: H2HPreload = {
  isActive: false,
  pool: [],
  records: {},
  pairsQueue: [],
  deferredPairs: [],
  currentPair: null,
  totalPairs: 0,
  completedComparisons: 0,
  skippedCount: 0,
  refinementTotalComparisons: 0,
  refinementCompletedComparisons: 0,
  skippedPairKeys: [],
  phase: "quick",
  artifacts: null,
  suggestedPairs: [],
};

function makeStore(
  tierOverride: TierPreload = baseTier,
  h2hOverride: Partial<H2HPreload> = {}
) {
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
      tier: tierOverride,
      headToHead: { ...baseH2H, ...h2hOverride },
    },
  });
}

function wrap(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

import { HeadToHeadPage } from "./HeadToHeadPage";

describe("HeadToHeadPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Branch 1: empty state (totalItems < 2) ──────────────────────────────────

  it("shows 'Need more items' when tier list has fewer than 2 items", () => {
    const store = makeStore(emptyTier);
    render(
      React.createElement(Provider, { store },
        React.createElement(HeadToHeadPage)
      )
    );
    expect(screen.getByText("Need more items")).toBeTruthy();
    // Start button must NOT be present
    expect(screen.queryByTestId("h2h-start")).toBeNull();
  });

  // ── Branch 2: idle state (totalItems >= 2, !isActive) ──────────────────────

  it("shows 'Start comparing' button in idle state", () => {
    const store = makeStore(baseTier, { isActive: false, currentPair: null });
    render(
      React.createElement(Provider, { store },
        React.createElement(HeadToHeadPage)
      )
    );
    const startBtn = screen.queryByTestId("h2h-start");
    expect(startBtn).not.toBeNull();
  });

  it("calls onStart handler when 'Start comparing' is pressed", () => {
    const store = makeStore(baseTier, { isActive: false, currentPair: null });
    render(
      React.createElement(Provider, { store },
        React.createElement(HeadToHeadPage)
      )
    );
    const startBtn = screen.getByTestId("h2h-start");
    fireEvent.click(startBtn);
    expect(mockHandlers.onStart).toHaveBeenCalledTimes(1);
  });

  // ── Branch 3: active state with currentPair ─────────────────────────────────

  it("renders comparison cards when H2H is active with a currentPair", () => {
    const store = makeStore(baseTier, {
      isActive: true,
      currentPair: [
        { id: "item-1", name: "Alpha" },
        { id: "item-2", name: "Beta" },
      ],
      pairsQueue: [],
      deferredPairs: [],
      totalPairs: 1,
      completedComparisons: 0,
    });
    render(
      React.createElement(Provider, { store },
        React.createElement(HeadToHeadPage)
      )
    );
    expect(screen.queryByTestId("h2h-card-left")).not.toBeNull();
    expect(screen.queryByTestId("h2h-card-right")).not.toBeNull();
  });

  // ── showEndConfirm state machine ────────────────────────────────────────────

  it("opens AlertDialog when 'End & Apply Results' is pressed", () => {
    const store = makeStore(baseTier, {
      isActive: true,
      currentPair: [
        { id: "item-1", name: "Alpha" },
        { id: "item-2", name: "Beta" },
      ],
      pairsQueue: [],
      deferredPairs: [],
      totalPairs: 1,
      completedComparisons: 0,
    });
    render(
      React.createElement(Provider, { store },
        React.createElement(HeadToHeadPage)
      )
    );

    // Dialog initially absent
    expect(screen.queryByTestId("alert-dialog")).toBeNull();

    // Press End & Apply Results button
    const endBtn = screen.getByTestId("h2h-end-apply");
    fireEvent.click(endBtn);

    // AlertDialog should now be visible
    expect(screen.queryByTestId("alert-dialog")).not.toBeNull();
  });

  it("closes AlertDialog when Cancel is pressed", () => {
    const store = makeStore(baseTier, {
      isActive: true,
      currentPair: [
        { id: "item-1", name: "Alpha" },
        { id: "item-2", name: "Beta" },
      ],
      pairsQueue: [],
      deferredPairs: [],
      totalPairs: 1,
      completedComparisons: 0,
    });
    render(
      React.createElement(Provider, { store },
        React.createElement(HeadToHeadPage)
      )
    );

    // Open dialog
    fireEvent.click(screen.getByTestId("h2h-end-apply"));
    expect(screen.queryByTestId("alert-dialog")).not.toBeNull();

    // Cancel closes it
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("alert-dialog")).toBeNull();
  });

  // ── Branch 4: completed state (isActive, no currentPair) ───────────────────

  it("shows 'Apply Results' button in completed state (active, no currentPair)", () => {
    const store = makeStore(baseTier, {
      isActive: true,
      currentPair: null,
      pairsQueue: [],
      deferredPairs: [],
    });
    render(
      React.createElement(Provider, { store },
        React.createElement(HeadToHeadPage)
      )
    );
    expect(screen.queryByTestId("h2h-apply")).not.toBeNull();
  });
});
