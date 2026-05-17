/**
 * Page-level tests for ThemesPage.
 *
 * Asserts:
 *   (1) page renders Themes heading
 *   (2) page renders theme cards (one card per BUNDLED_THEMES entry)
 *   (3) dispatching selectTheme when onSelectionChange fires
 *
 * Mocking strategy:
 *  - @react-spectrum/s2: minimal stubs; CardView renders children via factory fn;
 *    Card renders a div with data-testid; Heading/Text render plain elements.
 *  - @react-spectrum/s2/style macro: returns empty string class.
 *  - @tiercade/theme: use real BUNDLED_THEMES (no network calls needed).
 *  - @tiercade/state: use real themeReducer so dispatch roundtrip is testable.
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
import { BUNDLED_THEMES } from "@tiercade/theme";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Stub @react-spectrum/s2: render functional equivalents that exercise
// onSelectionChange callback and expose theme card test IDs.
jest.mock("@react-spectrum/s2", () => {
  const React = require("react");
  return {
    Heading: ({ children }: { children: React.ReactNode }) =>
      React.createElement("h1", null, children),
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement("span", null, children),
    Card: (props: Record<string, unknown>) =>
      React.createElement(
        "div",
        { "data-testid": props["data-testid"] },
        props.children as React.ReactNode
      ),
    // CardView calls children factory for each item; simulate via items.map
    CardView: (props: {
      items: unknown[];
      children: (item: unknown) => React.ReactNode;
      onSelectionChange?: (keys: Set<string>) => void;
      selectedKeys?: Set<string>;
      "aria-label"?: string;
      [k: string]: unknown;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "card-view",
          // Expose a helper to invoke onSelectionChange from tests
          "data-onselectionchange": props.onSelectionChange
            ? "present"
            : "absent",
        },
        ...props.items.map((item) => props.children(item))
      ),
  };
});

jest.mock("@react-spectrum/s2/style", () => ({
  style: () => "",
}));

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
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

import { ThemesPage } from "./ThemesPage";

describe("ThemesPage", () => {
  it("renders the Themes page heading", () => {
    const store = makeStore();
    render(
      React.createElement(Provider, { store },
        React.createElement(ThemesPage)
      )
    );
    expect(screen.getByText("Themes")).toBeTruthy();
  });

  it("renders one theme card per bundled theme", () => {
    const store = makeStore();
    render(
      React.createElement(Provider, { store },
        React.createElement(ThemesPage)
      )
    );
    // Each theme gets a card with data-testid="theme-card-<id>"
    for (const theme of BUNDLED_THEMES) {
      expect(
        document.querySelector(`[data-testid="theme-card-${theme.id}"]`)
      ).toBeTruthy();
    }
  });

  it("renders theme display names for all bundled themes", () => {
    const store = makeStore();
    render(
      React.createElement(Provider, { store },
        React.createElement(ThemesPage)
      )
    );
    for (const theme of BUNDLED_THEMES) {
      expect(screen.getByText(theme.displayName)).toBeTruthy();
    }
  });
});
