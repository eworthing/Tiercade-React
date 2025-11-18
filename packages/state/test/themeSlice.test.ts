import { describe, expect, it } from "@jest/globals";
import { themeReducer, selectTheme, clearTheme } from "../src/themeSlice";

describe("themeSlice", () => {
  it("selects a theme id", () => {
    const state = themeReducer(undefined, selectTheme("default"));
    expect(state.selectedThemeId).toBe("default");
  });

  it("clears selected theme", () => {
    const selected = themeReducer(undefined, selectTheme("default"));
    const cleared = themeReducer(selected, clearTheme());
    expect(cleared.selectedThemeId).toBeNull();
  });
});

