import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ThemeState {
  selectedThemeId: string | null;
}

const initialState: ThemeState = {
  selectedThemeId: null
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

