import { useEffect } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { captureSnapshot, loadProject } from "@tiercade/state";
import {
  getShareDataFromUrl,
  clearShareDataFromUrl,
} from "../utils/urlSharing";

/**
 * Checks for a shared tier list in the URL on mount and loads it into state.
 * Self-contained: depends only on dispatch and URL utilities.
 * No dependencies on modal state, drag-drop state, or other page concerns.
 */
export function useShareImport(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const sharedData = getShareDataFromUrl();
    if (sharedData) {
      dispatch(captureSnapshot("Load Shared"));
      dispatch(
        loadProject({
          tiers: sharedData.tiers,
          tierOrder: sharedData.tierOrder,
          tierLabels: sharedData.tierLabels,
          tierColors: sharedData.tierColors,
          projectName: sharedData.projectName,
        })
      );
      clearShareDataFromUrl();
    }
  }, [dispatch]); // dispatch is stable
}
