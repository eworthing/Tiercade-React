import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { BUNDLED_THEMES, type TierTheme } from "@tiercade/theme";

export interface ThemeState {
  selectedThemeId: string | null;
  availableThemes: TierTheme[];
}

const initialState: ThemeState = {
  selectedThemeId: null,
  availableThemes: BUNDLED_THEMES,
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    selectTheme(state, action: PayloadAction<string>) {
      state.selectedThemeId = action.payload;
    },
    clearTheme(state) {
      state.selectedThemeId = null;
    }
  }
});

export const { selectTheme, clearTheme } = themeSlice.actions;

export const themeReducer = themeSlice.reducer;

