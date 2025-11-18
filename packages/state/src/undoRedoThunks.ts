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
    const snapshot = getState().undoRedo.past[getState().undoRedo.past.length - 1];
    if (!snapshot) return;

    const result = dispatch(undoAction());
    if (result.payload) {
      const prev = getState().undoRedo.past[getState().undoRedo.past.length - 1];
      if (prev) {
        dispatch(setTiers(prev.tiers));
        dispatch(setTierOrder(prev.tierOrder));
      }
    }
  };
}

/**
 * Redo the last undone change
 */
export function performRedo(): AppThunk {
  return (dispatch, getState) => {
    const snapshot = getState().undoRedo.future[getState().undoRedo.future.length - 1];
    if (!snapshot) return;

    const result = dispatch(redoAction());
    if (result.payload) {
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
