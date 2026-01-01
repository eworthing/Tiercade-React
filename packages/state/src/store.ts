import { configureStore } from "@reduxjs/toolkit";
import { tierReducer, type TierState } from "./tierSlice";
import { headToHeadReducer } from "./headToHeadSlice";
import { themeReducer, type ThemeState } from "./themeSlice";
import { undoRedoReducer } from "./undoRedoSlice";
import { onboardingReducer } from "./onboardingSlice";
import { persistenceMiddleware, loadPersistedState } from "./persistenceMiddleware";

// Load any persisted state from localStorage
const persistedState = loadPersistedState();

// Build preloaded state from persisted data
const preloadedState: {
  tier?: TierState;
  theme?: ThemeState;
} = {};

if (persistedState?.tier) {
  preloadedState.tier = persistedState.tier;
}
if (persistedState?.theme) {
  preloadedState.theme = persistedState.theme;
}

export const store = configureStore({
  reducer: {
    tier: tierReducer,
    headToHead: headToHeadReducer,
    theme: themeReducer,
    undoRedo: undoRedoReducer,
    onboarding: onboardingReducer,
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
