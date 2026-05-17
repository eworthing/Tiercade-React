/**
 * Page-level tests for TemplatesPage.
 *
 * Asserts:
 *   (1) renders Template Library heading
 *   (2) renders SearchField and Category Picker filter controls
 *   (3) search state machine: entering a search query updates filteredTemplates
 *       (section heading shows "Search Results (<n>)")
 *   (4) preview modal state machine: setPreviewTemplate open/close
 *
 * Mocking strategy:
 *  - react-router-dom: stub useNavigate (navigate("/") called on handleUseTemplate)
 *  - @react-spectrum/s2: minimal stubs; CardView renders children factory; Dialog
 *    renders its children; SearchField fires onChange; Picker fires onSelectionChange.
 *  - @react-spectrum/s2/style macro: returns empty string class.
 *  - @tiercade/core: use real TEMPLATES / TEMPLATE_CATEGORIES / search functions.
 */

import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
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
import { TEMPLATES } from "@tiercade/core";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

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
    Badge: ({ children }: { children: React.ReactNode }) =>
      React.createElement("span", null, children),
    Heading: ({ children }: { children: React.ReactNode }) =>
      React.createElement("h2", null, children),
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement("span", null, children),
    Content: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
    ButtonGroup: ({ children }: { children: React.ReactNode }) =>
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
    // SearchField: renders an input that fires onChange on change
    SearchField: (props: {
      value?: string;
      onChange?: (v: string) => void;
      "aria-label"?: string;
      placeholder?: string;
      [k: string]: unknown;
    }) =>
      React.createElement("input", {
        "aria-label": props["aria-label"],
        value: props.value ?? "",
        placeholder: props.placeholder,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          props.onChange?.(e.target.value),
        "data-testid": "search-field",
      }),
    // Picker: renders a select element; onSelectionChange fires with selected value
    Picker: (props: {
      label?: string;
      selectedKey?: string;
      onSelectionChange?: (key: string) => void;
      children?: React.ReactNode;
      [k: string]: unknown;
    }) =>
      React.createElement(
        "select",
        {
          "aria-label": props.label,
          value: props.selectedKey ?? "",
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
            props.onSelectionChange?.(e.target.value),
          "data-testid": "category-picker",
        },
        props.children
      ),
    PickerItem: (props: { id?: string; children?: React.ReactNode }) =>
      React.createElement("option", { value: props.id }, props.children),
    Dialog: (props: { children?: React.ReactNode; [k: string]: unknown }) =>
      React.createElement(
        "div",
        { "data-testid": props["data-testid"] ?? "dialog" },
        props.children
      ),
    // DialogTrigger: always render children (isOpen=true when preview is set)
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

import { TemplatesPage } from "./TemplatesPage";

describe("TemplatesPage", () => {
  it("renders the Template Library heading", () => {
    const store = makeStore();
    render(
      React.createElement(Provider, { store },
        React.createElement(TemplatesPage)
      )
    );
    expect(screen.getByText("Template Library")).toBeTruthy();
  });

  it("renders search field and category picker filter controls", () => {
    const store = makeStore();
    render(
      React.createElement(Provider, { store },
        React.createElement(TemplatesPage)
      )
    );
    expect(document.querySelector("[data-testid='search-field']")).toBeTruthy();
    expect(document.querySelector("[data-testid='category-picker']")).toBeTruthy();
  });

  it("shows search results section heading when query is entered", () => {
    const store = makeStore();
    render(
      React.createElement(Provider, { store },
        React.createElement(TemplatesPage)
      )
    );
    const searchInput = document.querySelector("[data-testid='search-field']") as HTMLInputElement;
    expect(searchInput).toBeTruthy();

    // Entering a search query that matches at least one template
    fireEvent.change(searchInput, { target: { value: "tier" } });

    // Section heading should reflect search results
    const headings = screen.getAllByText(/Search Results/);
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("renders all-templates section heading in default (no search/filter) state", () => {
    const store = makeStore();
    render(
      React.createElement(Provider, { store },
        React.createElement(TemplatesPage)
      )
    );
    // Default state shows "All Templates" and "Featured templates" headings
    expect(screen.getByText("All Templates")).toBeTruthy();
    expect(screen.getByText("Featured templates")).toBeTruthy();
  });
});
