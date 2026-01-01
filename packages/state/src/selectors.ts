import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { sortItems, filterItems } from "@tiercade/core";

// ============================================================================
// Tier Selectors
// ============================================================================

/** Select the raw tiers object */
export const selectTiers = (state: RootState) => state.tier.tiers;

/** Select the tier order array */
export const selectTierOrder = (state: RootState) => state.tier.tierOrder;

/** Select the current selection array */
export const selectSelection = (state: RootState) => state.tier.selection;

/** Select tier labels map */
export const selectTierLabels = (state: RootState) => state.tier.tierLabels;

/** Select tier colors map */
export const selectTierColors = (state: RootState) => state.tier.tierColors;

/** Select project name */
export const selectProjectName = (state: RootState) => state.tier.projectName;

/** Select current sort mode */
export const selectSortMode = (state: RootState) => state.tier.sortMode;

/** Select current filters */
export const selectFilters = (state: RootState) => state.tier.filters;

/** Select whether any items are selected */
export const selectHasSelection = createSelector(
  [selectSelection],
  (selection) => selection.length > 0
);

/** Select the count of selected items */
export const selectSelectionCount = createSelector(
  [selectSelection],
  (selection) => selection.length
);

/** Select selection as a Set for O(1) lookups (memoized) */
export const selectSelectionSet = createSelector(
  [selectSelection],
  (selection) => new Set(selection)
);

/** Check if a specific item is selected - O(1) with memoized Set */
export const selectIsItemSelected = (state: RootState, itemId: string): boolean =>
  selectSelectionSet(state).has(itemId);

/** Select all items flattened into a single array */
export const selectAllItems = createSelector(
  [selectTiers],
  (tiers) => Object.values(tiers).flat()
);

/** Select total item count across all tiers */
export const selectTotalItemCount = createSelector(
  [selectAllItems],
  (items) => items.length
);

/** Get items for a specific tier with sorting and filtering applied */
export const selectTierItems = createSelector(
  [
    selectTiers,
    selectSortMode,
    selectFilters,
    (_state: RootState, tierName: string) => tierName
  ],
  (tiers, sortMode, filters, tierName) => {
    const items = tiers[tierName] ?? [];
    const filtered = filterItems(items, filters);
    return sortItems(filtered, sortMode);
  }
);

/** Select whether filters are active */
export const selectHasActiveFilters = createSelector(
  [selectFilters],
  (filters) => {
    return Boolean(
      filters.searchText ||
      (filters.mediaTypes && filters.mediaTypes.length > 0) ||
      filters.hasMedia ||
      filters.noMedia
    );
  }
);

// ============================================================================
// Theme Selectors
// ============================================================================

/** Select the currently selected theme ID */
export const selectSelectedThemeId = (state: RootState) => state.theme.selectedThemeId;

/** Select available themes */
export const selectAvailableThemes = (state: RootState) => state.theme.availableThemes;

/** Select the current theme object */
export const selectCurrentTheme = createSelector(
  [selectSelectedThemeId, selectAvailableThemes],
  (selectedId, themes) => themes.find((t) => t.id === selectedId) ?? themes[0]
);

// ============================================================================
// Undo/Redo Selectors
// ============================================================================

/** Select undo stack */
export const selectUndoPast = (state: RootState) => state.undoRedo.past;

/** Select redo stack */
export const selectRedoFuture = (state: RootState) => state.undoRedo.future;

/** Select whether undo is available */
export const selectCanUndo = createSelector(
  [selectUndoPast],
  (past) => past.length > 0
);

/** Select whether redo is available */
export const selectCanRedo = createSelector(
  [selectRedoFuture],
  (future) => future.length > 0
);

/** Select the last action name from undo stack */
export const selectLastActionName = createSelector(
  [selectUndoPast],
  (past) => past.length > 0 ? past[past.length - 1].actionName : null
);

// ============================================================================
// Head-to-Head Selectors
// ============================================================================

/** Select head-to-head active state */
export const selectHeadToHeadIsActive = (state: RootState) => state.headToHead.isActive;

/** Select current head-to-head pair */
export const selectHeadToHeadCurrentPair = (state: RootState) => state.headToHead.currentPair;

/** Select head-to-head pairs queue */
export const selectHeadToHeadPairsQueue = (state: RootState) => state.headToHead.pairsQueue;

/** Select head-to-head phase */
export const selectHeadToHeadPhase = (state: RootState) => state.headToHead.phase;

/** Select head-to-head pool */
export const selectHeadToHeadPool = (state: RootState) => state.headToHead.pool;

/** Select head-to-head progress */
export const selectHeadToHeadProgress = createSelector(
  [selectHeadToHeadPairsQueue, (state: RootState) => state.headToHead.totalPairs],
  (queue, total) => ({
    remaining: queue.length,
    total,
    completed: total - queue.length,
    percentage: total > 0 ? Math.round(((total - queue.length) / total) * 100) : 0
  })
);

// ============================================================================
// Presentation Selectors
// ============================================================================

/** Select presentation mode state */
export const selectIsPresenting = (state: RootState) => state.presentation.isPresenting;

/** Select chroma key color */
export const selectChromaKey = (state: RootState) => state.presentation.chromaKey;

/** Select reveal mode */
export const selectRevealMode = (state: RootState) => state.presentation.revealMode;

/** Select revealed items set */
export const selectRevealedItems = (state: RootState) => state.presentation.revealedItems;

/** Select show progress flag */
export const selectShowProgress = (state: RootState) => state.presentation.showProgress;

/** Select celebrate S-tier flag */
export const selectCelebrateSTier = (state: RootState) => state.presentation.celebrateSTier;

/** Select item scale */
export const selectItemScale = (state: RootState) => state.presentation.itemScale;

/** Select item queue */
export const selectItemQueue = (state: RootState) => state.presentation.itemQueue;

/** Select current queue item */
export const selectCurrentQueueItem = (state: RootState) => state.presentation.currentQueueItem;

/** Select watermark text */
export const selectWatermarkText = (state: RootState) => state.presentation.watermarkText;

/** Select show watermark flag */
export const selectShowWatermark = (state: RootState) => state.presentation.showWatermark;

/** Select show current item flag */
export const selectShowCurrentItem = (state: RootState) => state.presentation.showCurrentItem;

/** Select all presentation settings */
export const selectPresentationSettings = createSelector(
  [
    selectIsPresenting,
    selectChromaKey,
    selectRevealMode,
    selectShowProgress,
    selectCelebrateSTier,
    selectItemScale,
    selectWatermarkText,
    selectShowWatermark,
    selectShowCurrentItem
  ],
  (
    isPresenting,
    chromaKey,
    revealMode,
    showProgress,
    celebrateSTier,
    itemScale,
    watermarkText,
    showWatermark,
    showCurrentItem
  ) => ({
    isPresenting,
    chromaKey,
    revealMode,
    showProgress,
    celebrateSTier,
    itemScale,
    watermarkText,
    showWatermark,
    showCurrentItem
  })
);

// ============================================================================
// Onboarding Selectors
// ============================================================================

/** Select onboarding state */
export const selectOnboardingState = (state: RootState) => state.onboarding;

/** Select current onboarding step */
export const selectOnboardingCurrentStep = (state: RootState) => state.onboarding.currentStep;

/** Select whether onboarding is completed */
export const selectHasCompletedOnboarding = (state: RootState) => state.onboarding.hasCompletedOnboarding;
