import { useCallback } from "react";
import type { AppDispatch } from "@tiercade/state";
import {
  captureSnapshot,
  moveItemsBetweenTiers,
  deleteItems,
  selectSelection,
} from "@tiercade/state";
import { useAppSelector } from "../hooks/useAppSelector";

export interface BatchActionHandlers {
  onBatchMoveToTier: (targetTierName: string) => void;
  onBatchDelete: () => void;
}

/**
 * Encapsulates batch-operation handlers that share `dispatch` + `selection`
 * as their only dependencies. Reads selection internally via useAppSelector.
 */
export function useBatchActions(dispatch: AppDispatch): BatchActionHandlers {
  const selection = useAppSelector(selectSelection);

  const onBatchMoveToTier = useCallback(
    (targetTierName: string) => {
      if (selection.length === 0) return;
      dispatch(captureSnapshot("Batch Move"));
      dispatch(moveItemsBetweenTiers({ itemIds: selection, targetTierName }));
    },
    [dispatch, selection]
  );

  const onBatchDelete = useCallback(() => {
    if (selection.length === 0) return;
    dispatch(captureSnapshot("Batch Delete"));
    dispatch(deleteItems(selection));
  }, [dispatch, selection]);

  return { onBatchMoveToTier, onBatchDelete };
}
