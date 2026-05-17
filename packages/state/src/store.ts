import { combineReducers, configureStore, type Middleware } from "@reduxjs/toolkit";
import { tierReducer, type TierState } from "./tierSlice";
import { headToHeadReducer } from "./headToHeadSlice";
import { themeReducer, type ThemeState } from "./themeSlice";
import { undoRedoReducer, type UndoRedoState } from "./undoRedoSlice";
import { onboardingReducer, type OnboardingState } from "./onboardingSlice";
import { presentationReducer } from "./presentationSlice";
import { persistenceMiddleware as defaultPersistenceMiddleware, loadPersistedState } from "./persistenceMiddleware";

const rootReducer = combineReducers({
  tier: tierReducer,
  headToHead: headToHeadReducer,
  theme: themeReducer,
  undoRedo: undoRedoReducer,
  onboarding: onboardingReducer,
  presentation: presentationReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof createAppStore>["dispatch"];

type PreloadedRootState = Partial<RootState>;

export interface CreateStoreOptions {
  /**
   * Optional preloaded state. When omitted, `createAppStore` loads persisted
   * state from the middleware's storage (production path). Pass explicit state
   * in tests to start with a known baseline without touching localStorage.
   */
  preloadedState?: PreloadedRootState;
  /**
   * Optional persistence middleware override. Defaults to the production
   * middleware backed by localStorage. Pass a custom instance (e.g.
   * `createPersistenceMiddleware(fakeStorage)`) in tests or storybook to
   * avoid touching globals.
   */
  persistenceMiddleware?: Middleware;
}

/**
 * Factory that wires up the full Redux store.
 *
 * Lifetime contract: each call returns an independent store instance. The
 * production singleton (`store`) is created once at module load via
 * `createAppStore()`. Tests and storybook call `createAppStore({ ... })` to
 * obtain isolated stores with no shared state.
 */
export function createAppStore(options: CreateStoreOptions = {}): ReturnType<typeof configureStore<RootState>> {
  const middleware = options.persistenceMiddleware ?? defaultPersistenceMiddleware;

  let preloadedState: PreloadedRootState;

  if (options.preloadedState !== undefined) {
    // Caller supplied explicit state — use it directly (test / storybook path).
    preloadedState = options.preloadedState;
  } else {
    // Production path: restore from persisted storage.
    const persistedState = loadPersistedState();
    const restored: PreloadedRootState = {};
    if (persistedState?.tier) restored.tier = persistedState.tier as TierState;
    if (persistedState?.theme) restored.theme = persistedState.theme as ThemeState;
    if (persistedState?.undoRedo) restored.undoRedo = persistedState.undoRedo as UndoRedoState;
    if (persistedState?.onboarding) restored.onboarding = persistedState.onboarding as OnboardingState;
    preloadedState = restored;
  }

  return configureStore({
    reducer: rootReducer,
    preloadedState: Object.keys(preloadedState).length > 0 ? preloadedState : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["headToHead/setSkippedPairKeys"],
        },
      }).concat(middleware),
  });
}

/**
 * Production singleton. Loaded once at module initialization.
 * Tests must use `createAppStore({ ... })` to obtain isolated instances.
 */
export const store = createAppStore();
