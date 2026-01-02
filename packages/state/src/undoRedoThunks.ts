/**
 * Thunks for undo/redo that integrate with tier state
 */

import { undo as undoAction, redo as redoAction, pushHistory } from "./undoRedoSlice";
import { setTiers, setTierOrder, moveItemBetweenTiers as moveItemAction } from "./tierSlice";
import type { AppThunk } from "./headToHeadThunks";

/**
 * Capture current tier state before making a change
 */
export function captureSnapshot(action: string): AppThunk {
  return (dispatch, getState) => {
    const { tiers, tierOrder } = getState().tier;
    dispatch(pushHistory({ tiers, tierOrder, action }));
  };
}

/**
 * Undo the last change
 */
export function performUndo(): AppThunk {
  return (dispatch, getState) => {
    // Check if we can undo before dispatching
    if (getState().undoRedo.past.length === 0) return;

    // Dispatch undo action (moves snapshot from past to future)
    dispatch(undoAction());

    // Get the snapshot that was just moved to future
    const { future } = getState().undoRedo;
    const snapshot = future[future.length - 1];

    // Restore state from the snapshot
    if (snapshot) {
      dispatch(setTiers(snapshot.tiers));
      dispatch(setTierOrder(snapshot.tierOrder));
    }
  };
}

/**
 * Redo the last undone change
 */
export function performRedo(): AppThunk {
  return (dispatch, getState) => {
    // Check if we can redo before dispatching
    if (getState().undoRedo.future.length === 0) return;

    // Dispatch redo action (moves snapshot from future to past)
    dispatch(redoAction());

    // Get the snapshot that was just moved to past
    const { past } = getState().undoRedo;
    const snapshot = past[past.length - 1];

    // Restore state from the snapshot
    if (snapshot) {
      dispatch(setTiers(snapshot.tiers));
      dispatch(setTierOrder(snapshot.tierOrder));
    }
  };
}

/**
 * Move item between tiers with automatic snapshot capture
 */
export function moveItemBetweenTiersWithUndo(
  itemId: string,
  targetTierName: string
): AppThunk {
  return (dispatch) => {
    dispatch(captureSnapshot("Move Item"));
    dispatch(moveItemAction({ itemId, targetTierName }));
  };
}
