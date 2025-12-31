import type { Middleware, MiddlewareAPI, Dispatch, AnyAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

const STORAGE_KEY = "tiercade-state";
const DEBOUNCE_MS = 500;

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Middleware that persists state to localStorage after every action.
 * Uses debouncing to avoid excessive writes during rapid interactions.
 */
export const persistenceMiddleware: Middleware = (
  store: MiddlewareAPI<Dispatch<AnyAction>, RootState>
) => (next) => (action) => {
  const result = next(action);

  // Debounce saves to avoid excessive writes
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    const state = store.getState();
    try {
      const persistedState = {
        tier: state.tier,
        theme: state.theme,
        // Don't persist undoRedo - start fresh each session
        // Don't persist headToHead - session-specific state
        savedAt: Date.now(),
        version: 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
      console.error("[Tiercade] Failed to save state:", error);
    }
  }, DEBOUNCE_MS);

  return result;
};

export interface PersistedState {
  tier: RootState["tier"];
  theme: RootState["theme"];
  savedAt: number;
  version: number;
}

/**
 * Load persisted state from localStorage.
 * Returns undefined if no state exists or if parsing fails.
 */
export function loadPersistedState(): Partial<PersistedState> | undefined {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return undefined;
    }

    const parsed = JSON.parse(saved) as PersistedState;

    // Validate the parsed state has expected structure
    if (!parsed.tier || !parsed.theme) {
      console.warn("[Tiercade] Invalid persisted state structure");
      return undefined;
    }

    console.log(
      "[Tiercade] Restored state from",
      new Date(parsed.savedAt).toLocaleString()
    );

    return parsed;
  } catch (error) {
    console.error("[Tiercade] Failed to load persisted state:", error);
    return undefined;
  }
}

/**
 * Clear all persisted state from localStorage.
 */
export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[Tiercade] Cleared persisted state");
  } catch (error) {
    console.error("[Tiercade] Failed to clear persisted state:", error);
  }
}

/**
 * Check if there is persisted state available.
 */
export function hasPersistedState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
