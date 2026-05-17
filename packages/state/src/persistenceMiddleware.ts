import type { Middleware } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import type { UndoRedoState, TierSnapshot } from "./undoRedoSlice";
import type { OnboardingState } from "./onboardingSlice";

const STORAGE_KEY = "tiercade-state";
const DEBOUNCE_MS = 500;
const MAX_PERSISTED_HISTORY = 20; // Limit history size for storage efficiency

/**
 * Creates a persistence middleware that saves Redux state to the provided
 * Storage instance (defaults to `localStorage`). Pass a custom Storage in
 * tests to avoid global override via Object.defineProperty.
 *
 * Untyped `Middleware` (no state generic) avoids a circular type dependency
 * with `RootState`, which is derived from `store` which uses this middleware.
 * State is cast at use site below.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _globalStorage: Storage | undefined = (globalThis as any).localStorage as Storage | undefined;

export function createPersistenceMiddleware(storage: Storage | undefined = _globalStorage): Middleware {
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  return (store) => (next) => (action) => {
    const result = next(action);

    if (!storage) return result;

    // Debounce saves to avoid excessive writes
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
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
          onboarding: state.onboarding,
          // Don't persist headToHead - session-specific state
          savedAt: Date.now(),
          version: 2, // Bump version for undo/redo support
        };
        storage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
      } catch (error) {
        console.error("[Tiercade] Failed to save state:", error);
      }
    }, DEBOUNCE_MS);

    return result;
  };
}

/** Pre-built instance using the global localStorage — used by the production store. */
export const persistenceMiddleware: Middleware = createPersistenceMiddleware();

export interface PersistedState {
  tier: RootState["tier"];
  theme: RootState["theme"];
  undoRedo?: UndoRedoState;
  onboarding?: OnboardingState;
  savedAt: number;
  version: number;
}

/**
 * Load persisted state from the provided Storage (defaults to `localStorage`).
 * Returns undefined if no state exists, storage is unavailable, or parsing fails.
 */
export function loadPersistedState(storage: Storage | undefined = _globalStorage): Partial<PersistedState> | undefined {
  if (!storage) return undefined;
  try {
    const saved = storage.getItem(STORAGE_KEY);
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
 * Clear all persisted state from the provided Storage (defaults to `localStorage`).
 */
export function clearPersistedState(storage: Storage | undefined = _globalStorage): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
    console.log("[Tiercade] Cleared persisted state");
  } catch (error) {
    console.error("[Tiercade] Failed to clear persisted state:", error);
  }
}

/**
 * Check if there is persisted state available in the provided Storage (defaults to `localStorage`).
 */
export function hasPersistedState(storage: Storage | undefined = _globalStorage): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
