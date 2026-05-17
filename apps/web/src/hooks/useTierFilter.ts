import { useMemo, useCallback } from "react";
import { useAppSelector } from "./useAppSelector";
import { useAppDispatch } from "./useAppDispatch";
import {
  selectTiers,
  selectSortMode,
  selectFilters,
  setSortMode,
  setSearchFilter,
  toggleMediaTypeFilter,
  clearFilters,
} from "@tiercade/state";
import { sortItems, filterAllTiers } from "@tiercade/core";
import type { GlobalSortMode, MediaType, Items } from "@tiercade/core";

export interface TierFilterResult {
  processedTiers: Items;
  filteredItems: number;
  handleSortModeChange: (mode: GlobalSortMode) => void;
  handleSearchChange: (search: string) => void;
  handleMediaTypeToggle: (mediaType: MediaType) => void;
  handleClearFilters: () => void;
}

/**
 * Concentrates all sort + filter logic behind one interface:
 *   - Applies active filters to all tiers
 *   - Applies sort mode (or preserves custom order)
 *   - Exposes stable dispatch callbacks for sort/filter controls
 *
 * Owns: processedTiers derivation, filteredItems count, all 4 sort/filter handlers.
 * Does not own: item interaction (click/drag/drop), modal visibility, presentation mode.
 */
export function useTierFilter(): TierFilterResult {
  const dispatch = useAppDispatch();
  const tiers = useAppSelector(selectTiers);
  const sortMode = useAppSelector(selectSortMode);
  const filters = useAppSelector(selectFilters);

  const processedTiers = useMemo((): Items => {
    const filtered = filterAllTiers(tiers, filters);

    if (sortMode.type === "custom") {
      return filtered;
    }

    const sorted: Items = {};
    for (const [tierName, items] of Object.entries(filtered)) {
      sorted[tierName] = sortItems(items, sortMode);
    }
    return sorted;
  }, [tiers, filters, sortMode]);

  const filteredItems = useMemo(() => {
    return Object.values(processedTiers).flat().length;
  }, [processedTiers]);

  const handleSortModeChange = useCallback(
    (mode: GlobalSortMode) => {
      dispatch(setSortMode(mode));
    },
    [dispatch]
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      dispatch(setSearchFilter(search));
    },
    [dispatch]
  );

  const handleMediaTypeToggle = useCallback(
    (mediaType: MediaType) => {
      dispatch(toggleMediaTypeFilter(mediaType));
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  return {
    processedTiers,
    filteredItems,
    handleSortModeChange,
    handleSearchChange,
    handleMediaTypeToggle,
    handleClearFilters,
  };
}
