import { useEffect, useCallback } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import {
  setSelection,
  clearSelection,
  deleteItems,
  captureSnapshot,
} from "@tiercade/state";
import { selectTiers, selectSelection } from "@tiercade/state";
import { useToast } from "@tiercade/ui";

interface UseTierBoardKeyboardOptions {
  onAddItem?: () => void;
  onShowHelp?: () => void;
}

/**
 * Custom hook for TierBoard keyboard shortcuts
 *
 * Handles:
 * - Cmd/Ctrl+N: Add item
 * - Cmd/Ctrl+A: Select all
 * - Escape: Deselect all
 * - Delete/Backspace: Delete selected items
 * - ?: Show keyboard help
 */
export function useTierBoardKeyboard({
  onAddItem,
  onShowHelp,
}: UseTierBoardKeyboardOptions = {}) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const tiers = useAppSelector(selectTiers);
  const selection = useAppSelector(selectSelection);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Add item (Cmd/Ctrl+N)
      if (isMod && e.key === "n") {
        e.preventDefault();
        onAddItem?.();
        return;
      }

      // Select all (Cmd/Ctrl+A)
      if (isMod && e.key === "a") {
        e.preventDefault();
        const allItemIds = Object.values(tiers).flat().map((item) => item.id);
        dispatch(setSelection(allItemIds));
        return;
      }

      // Deselect all (Escape)
      if (e.key === "Escape" && selection.length > 0) {
        e.preventDefault();
        dispatch(clearSelection());
        return;
      }

      // Delete selected items (Delete or Backspace)
      if ((e.key === "Delete" || e.key === "Backspace") && selection.length > 0) {
        e.preventDefault();
        dispatch(captureSnapshot("Delete Items"));
        dispatch(deleteItems(selection));
        toast.success(`Deleted ${selection.length} item(s)`);
        return;
      }

      // Show keyboard help (?)
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        onShowHelp?.();
        return;
      }
    },
    [dispatch, tiers, selection, toast, onAddItem, onShowHelp]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
