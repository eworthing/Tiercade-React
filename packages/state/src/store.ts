import { configureStore } from "@reduxjs/toolkit";
import { tierReducer, type TierState } from "./tierSlice";
import { headToHeadReducer } from "./headToHeadSlice";
import { themeReducer, type ThemeState } from "./themeSlice";
import { undoRedoReducer, type UndoRedoState } from "./undoRedoSlice";
import { onboardingReducer } from "./onboardingSlice";
import { presentationReducer } from "./presentationSlice";
import { persistenceMiddleware, loadPersistedState } from "./persistenceMiddleware";

// Load any persisted state from localStorage
const persistedState = loadPersistedState();

// Build preloaded state from persisted data
const preloadedState: {
  tier?: TierState;
  theme?: ThemeState;
  undoRedo?: UndoRedoState;
} = {};

if (persistedState?.tier) {
  preloadedState.tier = persistedState.tier;
}
if (persistedState?.theme) {
  preloadedState.theme = persistedState.theme;
}
if (persistedState?.undoRedo) {
  preloadedState.undoRedo = persistedState.undoRedo;
}

export const store = configureStore({
  reducer: {
    tier: tierReducer,
    headToHead: headToHeadReducer,
    theme: themeReducer,
    undoRedo: undoRedoReducer,
    onboarding: onboardingReducer,
    presentation: presentationReducer,
  },
  preloadedState: Object.keys(preloadedState).length > 0 ? preloadedState : undefined,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ["headToHead/setSkippedPairKeys"],
      },
    }).concat(persistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
