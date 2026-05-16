import type { Middleware } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import type { UndoRedoState, TierSnapshot } from "./undoRedoSlice";

const STORAGE_KEY = "tiercade-state";
const DEBOUNCE_MS = 500;
const MAX_PERSISTED_HISTORY = 20; // Limit history size for storage efficiency

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Untyped `Middleware` (no state generic) avoids a circular type dependency
// with `RootState`, which is derived from `store` which uses this middleware.
// State is cast at use site below.
export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Debounce saves to avoid excessive writes
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    if (typeof localStorage === "undefined") return;
    const state = store.getState() as RootState;
    try {
      // Trim undo/redo history for storage efficiency
      const trimmedUndoRedo: UndoRedoState = {
        past: state.undoRedo.past.slice(-MAX_PERSISTED_HISTORY),
        future: state.undoRedo.future.slice(-MAX_PERSISTED_HISTORY),
        maxHistorySize: state.undoRedo.maxHistorySize,
      };

      const persistedState = {
        tier: state.tier,
        theme: state.theme,
        undoRedo: trimmedUndoRedo,
        // Don't persist headToHead - session-specific state
        savedAt: Date.now(),
        version: 2, // Bump version for undo/redo support
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
  undoRedo?: UndoRedoState;
  savedAt: number;
  version: number;
}

/**
 * Load persisted state from localStorage.
 * Returns undefined if no state exists or if parsing fails.
 */
export function loadPersistedState(): Partial<PersistedState> | undefined {
  if (typeof localStorage === "undefined") return undefined;
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

    const historyCount = (parsed.undoRedo?.past?.length ?? 0) + (parsed.undoRedo?.future?.length ?? 0);
    console.log(
      "[Tiercade] Restored state from",
      new Date(parsed.savedAt).toLocaleString(),
      historyCount > 0 ? `(${historyCount} undo/redo entries)` : ""
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
  if (typeof localStorage === "undefined") return;
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
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
