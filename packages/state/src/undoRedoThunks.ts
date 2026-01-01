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

    // The undo action pops from past and returns the snapshot
    const result = dispatch(undoAction());

    // Use the returned payload (the popped snapshot) to restore state
    // BUG FIX: Previously re-queried state.past which returned wrong snapshot
    if (result.payload) {
      dispatch(setTiers(result.payload.tiers));
      dispatch(setTierOrder(result.payload.tierOrder));
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

    // The redo action pops from future and returns the snapshot
    const result = dispatch(redoAction());

    // Use the returned payload (the popped snapshot) to restore state
    if (result.payload) {
      dispatch(setTiers(result.payload.tiers));
      dispatch(setTierOrder(result.payload.tierOrder));
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
