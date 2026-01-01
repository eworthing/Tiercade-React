import { useCallback } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import {
  togglePresentationMode,
  setChromaKey,
  setRevealMode,
  revealItem,
  setShowProgress,
  setCelebrateSTier,
  setItemScale,
  drawNextItem,
  shuffleQueue,
  setItemQueue,
  setWatermarkText,
  setShowWatermark,
} from "@tiercade/state";
import type { ChromaKeyColor } from "@tiercade/state";
import {
  selectIsPresenting,
  selectChromaKey,
  selectRevealMode,
  selectRevealedItems,
  selectShowProgress,
  selectCelebrateSTier,
  selectItemScale,
  selectItemQueue,
  selectCurrentQueueItem,
  selectWatermarkText,
  selectShowWatermark,
  selectShowCurrentItem,
  selectTiers,
} from "@tiercade/state";
import { UNRANKED_TIER_ID } from "@tiercade/core";

/**
 * Custom hook for presentation mode state and handlers
 *
 * Centralizes all presentation mode logic in one place
 */
export function usePresentationHandlers() {
  const dispatch = useAppDispatch();
  const tiers = useAppSelector(selectTiers);

  // Selectors
  const isPresenting = useAppSelector(selectIsPresenting);
  const chromaKey = useAppSelector(selectChromaKey);
  const revealMode = useAppSelector(selectRevealMode);
  const revealedItems = useAppSelector(selectRevealedItems);
  const showProgress = useAppSelector(selectShowProgress);
  const celebrateSTier = useAppSelector(selectCelebrateSTier);
  const itemScale = useAppSelector(selectItemScale);
  const itemQueue = useAppSelector(selectItemQueue);
  const currentQueueItem = useAppSelector(selectCurrentQueueItem);
  const watermarkText = useAppSelector(selectWatermarkText);
  const showWatermark = useAppSelector(selectShowWatermark);
  const showCurrentItem = useAppSelector(selectShowCurrentItem);

  // Handlers
  const handleTogglePresentation = useCallback(() => {
    dispatch(togglePresentationMode());
  }, [dispatch]);

  const handleChromaKeyChange = useCallback(
    (color: ChromaKeyColor) => {
      dispatch(setChromaKey(color));
    },
    [dispatch]
  );

  const handleRevealModeChange = useCallback(
    (enabled: boolean) => {
      dispatch(setRevealMode(enabled));
    },
    [dispatch]
  );

  const handleItemReveal = useCallback(
    (itemId: string) => {
      dispatch(revealItem(itemId));
    },
    [dispatch]
  );

  const handleShowProgressChange = useCallback(
    (show: boolean) => {
      dispatch(setShowProgress(show));
    },
    [dispatch]
  );

  const handleCelebrateSTierChange = useCallback(
    (celebrate: boolean) => {
      dispatch(setCelebrateSTier(celebrate));
    },
    [dispatch]
  );

  const handleItemScaleChange = useCallback(
    (scale: number) => {
      dispatch(setItemScale(scale));
    },
    [dispatch]
  );

  const handleDrawNext = useCallback(() => {
    dispatch(drawNextItem());
  }, [dispatch]);

  const handleShuffleQueue = useCallback(() => {
    dispatch(shuffleQueue());
  }, [dispatch]);

  const handleStartQueue = useCallback(() => {
    // Queue all unranked items
    const unrankedItems = tiers[UNRANKED_TIER_ID] ?? [];
    const itemIds = unrankedItems.map((item) => item.id);
    dispatch(setItemQueue(itemIds));
  }, [dispatch, tiers]);

  const handleWatermarkTextChange = useCallback(
    (text: string) => {
      dispatch(setWatermarkText(text));
    },
    [dispatch]
  );

  const handleShowWatermarkChange = useCallback(
    (show: boolean) => {
      dispatch(setShowWatermark(show));
    },
    [dispatch]
  );

  return {
    // State
    isPresenting,
    chromaKey,
    revealMode,
    revealedItems,
    showProgress,
    celebrateSTier,
    itemScale,
    itemQueue,
    currentQueueItem,
    watermarkText,
    showWatermark,
    showCurrentItem,

    // Handlers
    handleTogglePresentation,
    handleChromaKeyChange,
    handleRevealModeChange,
    handleItemReveal,
    handleShowProgressChange,
    handleCelebrateSTierChange,
    handleItemScaleChange,
    handleDrawNext,
    handleShuffleQueue,
    handleStartQueue,
    handleWatermarkTextChange,
    handleShowWatermarkChange,
  };
}
