import { useCallback } from "react";
import type { AppDispatch } from "@tiercade/state";
import {
  captureSnapshot,
  addItemToTier,
  updateItem,
  toggleSelection,
} from "@tiercade/state";
import type { Item } from "@tiercade/core";
import type { FileDropResult } from "@tiercade/ui";

export interface ItemInteractionHandlers {
  onItemClick: (item: Item) => void;
  onFileDrop: (tierId: string, file: FileDropResult) => void;
  onItemMediaDrop: (itemId: string, file: FileDropResult) => void;
}

/**
 * Concentrates item interaction handlers that share only `dispatch` as their
 * dependency — no local modal state, no derived selectors. The three handlers
 * (selection toggle, file drop, media drop) are the pure dispatch-only subset
 * of TierBoardPage's useCallback blocks. Callers destructure the returned
 * object; the page keeps modal-coupled handlers inline.
 */
export function useItemInteraction(dispatch: AppDispatch): ItemInteractionHandlers {
  const onItemClick = useCallback(
    (item: Item) => {
      dispatch(toggleSelection(item.id));
    },
    [dispatch]
  );

  const onFileDrop = useCallback(
    (tierId: string, file: FileDropResult) => {
      dispatch(captureSnapshot("Add Item from File"));

      const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const item: Item = {
        id,
        name: file.fileName,
        mediaType: file.mediaType,
      };

      if (file.mediaType === "video") {
        item.videoUrl = file.dataUrl;
      } else if (file.mediaType === "audio") {
        item.audioUrl = file.dataUrl;
      } else {
        item.imageUrl = file.dataUrl;
      }

      dispatch(addItemToTier({ item, tierName: tierId }));
    },
    [dispatch]
  );

  const onItemMediaDrop = useCallback(
    (itemId: string, file: FileDropResult) => {
      dispatch(captureSnapshot("Update Item Media"));

      const updates: Partial<Item> = {
        mediaType: file.mediaType,
        imageUrl: undefined,
        videoUrl: undefined,
        audioUrl: undefined,
      };

      if (file.mediaType === "video") {
        updates.videoUrl = file.dataUrl;
      } else if (file.mediaType === "audio") {
        updates.audioUrl = file.dataUrl;
      } else {
        updates.imageUrl = file.dataUrl;
      }

      dispatch(updateItem({ itemId, updates }));
    },
    [dispatch]
  );

  return { onItemClick, onFileDrop, onItemMediaDrop };
}
