import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { tierReducer, type TierState } from "./tierSlice";
import { headToHeadReducer } from "./headToHeadSlice";
import { themeReducer, type ThemeState } from "./themeSlice";
import { undoRedoReducer, type UndoRedoState } from "./undoRedoSlice";
import { onboardingReducer } from "./onboardingSlice";
import { presentationReducer } from "./presentationSlice";
import { persistenceMiddleware, loadPersistedState } from "./persistenceMiddleware";

const rootReducer = combineReducers({
  tier: tierReducer,
  headToHead: headToHeadReducer,
  theme: themeReducer,
  undoRedo: undoRedoReducer,
  onboarding: onboardingReducer,
  presentation: presentationReducer,
});

type PreloadedRootState = Partial<ReturnType<typeof rootReducer>>;

const persistedState = loadPersistedState();

const preloadedState: PreloadedRootState = {};

if (persistedState?.tier) {
  preloadedState.tier = persistedState.tier as TierState;
}
if (persistedState?.theme) {
  preloadedState.theme = persistedState.theme as ThemeState;
}
if (persistedState?.undoRedo) {
  preloadedState.undoRedo = persistedState.undoRedo as UndoRedoState;
}

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: Object.keys(preloadedState).length > 0 ? preloadedState : undefined,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["headToHead/setSkippedPairKeys"],
      },
    }).concat(persistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
