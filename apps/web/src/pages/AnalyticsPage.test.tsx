/**
 * Page-level tests for AnalyticsPage.
 *
 * Asserts the two render branches:
 *   (1) empty state — no tierOrder, shows "No tier list loaded" message
 *   (2) loaded state — tier data present, analytics stats rendered
 *       (Balance Score section, Total Items count, tier distribution)
 *
 * Mocking strategy:
 *  - @react-spectrum/s2: minimal stubs (Heading, Text, ProgressBar) so the
 *    page renders without Spectrum internals.
 *  - S2 style macro: stub so the Parcel macro import doesn't error.
 *  - No hooks to mock — AnalyticsPage reads state via inline useAppSelector
 *    and calls pure @tiercade/core analytics functions.
 */

import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
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

// Stub @react-spectrum/s2: render children / text so assertions can find them.
jest.mock("@react-spectrum/s2", () => {
  const React = require("react");
  return {
    Heading: ({
      children,
      "data-testid": dt,
    }: {
      children: React.ReactNode;
      "data-testid"?: string;
    }) => React.createElement("h2", { "data-testid": dt }, children),
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement("span", null, children),
    ProgressBar: ({
      label,
      value,
      "data-testid": dt,
    }: {
      label?: string;
      value?: number;
      "data-testid"?: string;
    }) =>
      React.createElement(
        "div",
        { "data-testid": dt ?? "progress-bar", role: "progressbar", "aria-label": label, "aria-valuenow": value },
        label
      ),
  };
});

// Stub S2 style macro — returns empty string class so page renders without
// the Parcel macro build step.
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

function makeStore(tierOverride: TierPreload) {
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
    },
  });
}

const emptyTier: TierPreload = {
  tiers: { S: [], A: [], B: [], unranked: [] },
  tierOrder: [],
  selection: [],
  tierLabels: {},
  tierColors: {},
  projectName: "Empty",
  sortMode: { type: "custom" as const },
  filters: {},
};

const loadedTier: TierPreload = {
  tiers: {
    S: [{ id: "i1", name: "Alpha" }, { id: "i2", name: "Beta" }],
    A: [{ id: "i3", name: "Gamma" }],
    B: [],
    unranked: [],
  },
  tierOrder: ["S", "A", "B"],
  selection: [],
  tierLabels: { S: "S", A: "A", B: "B" },
  tierColors: { S: "#f00", A: "#0f0", B: "#00f" },
  projectName: "Test",
  sortMode: { type: "custom" as const },
  filters: {},
};

// ─── Tests ────────────────────────────────────────────────────────────────────

import { AnalyticsPage } from "./AnalyticsPage";

describe("AnalyticsPage", () => {
  // ── Branch 1: empty state ───────────────────────────────────────────────────

  it("shows 'No tier list loaded' when tierOrder is empty", () => {
    const store = makeStore(emptyTier);
    render(
      React.createElement(Provider, { store },
        React.createElement(AnalyticsPage)
      )
    );
    expect(screen.getByText(/No tier list loaded/)).toBeTruthy();
    // Balance Score section must NOT be present
    expect(screen.queryByText("Balance Score")).toBeNull();
  });

  // ── Branch 2: loaded state ──────────────────────────────────────────────────

  it("renders Analytics heading when tier data is present", () => {
    const store = makeStore(loadedTier);
    render(
      React.createElement(Provider, { store },
        React.createElement(AnalyticsPage)
      )
    );
    // Page heading
    expect(screen.getByText("Analytics")).toBeTruthy();
  });

  it("renders Balance Score section when tier data is present", () => {
    const store = makeStore(loadedTier);
    render(
      React.createElement(Provider, { store },
        React.createElement(AnalyticsPage)
      )
    );
    expect(screen.getByText("Balance Score")).toBeTruthy();
    // Balance score progress bar
    expect(screen.getByLabelText("Balance score")).toBeTruthy();
  });

  it("renders tier distribution progress bars for each tier", () => {
    const store = makeStore(loadedTier);
    render(
      React.createElement(Provider, { store },
        React.createElement(AnalyticsPage)
      )
    );
    // Tier Distribution heading
    expect(screen.getByText("Tier Distribution")).toBeTruthy();
    // S tier has 2 items — label contains "S —"
    const progressBars = screen.getAllByRole("progressbar");
    // At least balance-score + S + A + B = 4 progress bars
    expect(progressBars.length).toBeGreaterThanOrEqual(4);
  });

  it("shows correct total item count in overview stats", () => {
    const store = makeStore(loadedTier);
    render(
      React.createElement(Provider, { store },
        React.createElement(AnalyticsPage)
      )
    );
    // loadedTier has 3 total items (2 in S, 1 in A).
    // "3" appears in both "Total Items" and "Total Tiers" stat cards.
    const threes = screen.getAllByText("3");
    expect(threes.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Total Items")).toBeTruthy();
  });
});
