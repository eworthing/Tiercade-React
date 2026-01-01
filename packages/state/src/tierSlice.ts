import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Items, Item, GlobalSortMode, MediaType } from "@tiercade/core";
import type { ItemFilters } from "@tiercade/core";
import { moveItem as moveItemLogic } from "@tiercade/core";

/** Build item location index on-demand for O(1) tier lookup */
function buildItemLocationIndex(tiers: Items): Map<string, string> {
  const index = new Map<string, string>();
  for (const [tierName, items] of Object.entries(tiers)) {
    for (const item of items) {
      index.set(item.id, tierName);
    }
  }
  return index;
}

export interface TierState {
  tiers: Items;
  tierOrder: string[];
  selection: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string | undefined>;
  projectName: string;
  sortMode: GlobalSortMode;
  filters: ItemFilters;
}

const initialState: TierState = {
  tiers: {},
  tierOrder: [],
  selection: [],
  tierLabels: {},
  tierColors: {},
  projectName: "My Tier List",
  sortMode: { type: "custom" },
  filters: {}
};

export const tierSlice = createSlice({
  name: "tier",
  initialState,
  reducers: {
    setTiers(state, action: PayloadAction<Items>) {
      state.tiers = action.payload;
    },
    setTierOrder(state, action: PayloadAction<string[]>) {
      state.tierOrder = action.payload;
    },
    setSelection(state, action: PayloadAction<string[]>) {
      state.selection = action.payload;
    },
    toggleSelection(state, action: PayloadAction<string>) {
      const id = action.payload;
      // Use Set for O(1) lookup instead of Array.includes() O(n)
      const selectionSet = new Set(state.selection);
      if (selectionSet.has(id)) {
        selectionSet.delete(id);
      } else {
        selectionSet.add(id);
      }
      state.selection = Array.from(selectionSet);
    },
    clearSelection(state) {
      state.selection = [];
    },
    addItemToUnranked(state, action: PayloadAction<Item>) {
      const unranked = state.tiers["unranked"] ?? [];
      state.tiers["unranked"] = [...unranked, action.payload];
    },
    addItemToTier(
      state,
      action: PayloadAction<{ item: Item; tierName: string }>
    ) {
      const { item, tierName } = action.payload;
      const tier = state.tiers[tierName] ?? [];
      state.tiers[tierName] = [...tier, item];
    },
    updateItem(
      state,
      action: PayloadAction<{ itemId: string; updates: Partial<Item> }>
    ) {
      const { itemId, updates } = action.payload;
      // Use O(n) index build once, then O(1) lookup - better than O(n*m) scan
      const locationIndex = buildItemLocationIndex(state.tiers);
      const tierName = locationIndex.get(itemId);
      if (!tierName) return;

      const tierItems = state.tiers[tierName];
      const itemIndex = tierItems.findIndex((item) => item.id === itemId);
      if (itemIndex !== -1) {
        state.tiers[tierName][itemIndex] = {
          ...tierItems[itemIndex],
          ...updates,
        };
      }
    },
    deleteItem(state, action: PayloadAction<string>) {
      const itemId = action.payload;
      // Use O(n) index build once for O(1) tier lookup
      const locationIndex = buildItemLocationIndex(state.tiers);
      const tierName = locationIndex.get(itemId);
      if (tierName) {
        state.tiers[tierName] = state.tiers[tierName].filter(
          (item) => item.id !== itemId
        );
      }
      // Remove from selection if selected (use Set for O(1))
      const selectionSet = new Set(state.selection);
      if (selectionSet.has(itemId)) {
        selectionSet.delete(itemId);
        state.selection = Array.from(selectionSet);
      }
    },
    deleteItems(state, action: PayloadAction<string[]>) {
      const itemIds = new Set(action.payload);
      // Build location index once, then filter only affected tiers
      const locationIndex = buildItemLocationIndex(state.tiers);
      const affectedTiers = new Set<string>();
      for (const itemId of itemIds) {
        const tierName = locationIndex.get(itemId);
        if (tierName) affectedTiers.add(tierName);
      }
      // Only filter affected tiers instead of all tiers
      for (const tierName of affectedTiers) {
        state.tiers[tierName] = state.tiers[tierName].filter(
          (item) => !itemIds.has(item.id)
        );
      }
      // Remove from selection
      state.selection = state.selection.filter((id) => !itemIds.has(id));
    },
    moveItemBetweenTiers(
      state,
      action: PayloadAction<{ itemId: string; targetTierName: string }>
    ) {
      const { itemId, targetTierName } = action.payload;
      state.tiers = moveItemLogic(state.tiers, itemId, targetTierName);
    },
    reorderItemWithinTier(
      state,
      action: PayloadAction<{
        tierName: string;
        fromIndex: number;
        toIndex: number;
      }>
    ) {
      const { tierName, fromIndex, toIndex } = action.payload;
      const tier = state.tiers[tierName];
      if (!tier || fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= tier.length || toIndex >= tier.length) return;

      const [item] = tier.splice(fromIndex, 1);
      tier.splice(toIndex, 0, item);
    },
    setTierLabels(state, action: PayloadAction<Record<string, string>>) {
      state.tierLabels = action.payload;
    },
    setTierColors(
      state,
      action: PayloadAction<Record<string, string | undefined>>
    ) {
      state.tierColors = action.payload;
    },
    updateTierLabel(
      state,
      action: PayloadAction<{ tierId: string; label: string }>
    ) {
      state.tierLabels[action.payload.tierId] = action.payload.label;
    },
    updateTierColor(
      state,
      action: PayloadAction<{ tierId: string; color: string }>
    ) {
      state.tierColors[action.payload.tierId] = action.payload.color;
    },
    addTier(
      state,
      action: PayloadAction<{ tierId: string; label: string; color: string; insertAt?: number }>
    ) {
      const { tierId, label, color, insertAt } = action.payload;
      // Don't add if tier already exists
      if (state.tierOrder.includes(tierId) || tierId === "unranked") return;

      // Add to tier order
      if (insertAt !== undefined && insertAt >= 0 && insertAt <= state.tierOrder.length) {
        state.tierOrder.splice(insertAt, 0, tierId);
      } else {
        state.tierOrder.push(tierId);
      }

      // Initialize empty tier
      state.tiers[tierId] = [];
      state.tierLabels[tierId] = label;
      state.tierColors[tierId] = color;
    },
    removeTier(state, action: PayloadAction<string>) {
      const tierId = action.payload;
      // Don't remove if it's the last tier or unranked
      if (state.tierOrder.length <= 1 || tierId === "unranked") return;

      // Move items to unranked
      const itemsToMove = state.tiers[tierId] ?? [];
      state.tiers["unranked"] = [...(state.tiers["unranked"] ?? []), ...itemsToMove];

      // Remove tier
      delete state.tiers[tierId];
      delete state.tierLabels[tierId];
      delete state.tierColors[tierId];
      state.tierOrder = state.tierOrder.filter((id) => id !== tierId);
    },
    reorderTiers(state, action: PayloadAction<string[]>) {
      // Validate that all tier IDs are valid (no unranked, all exist)
      const newOrder = action.payload.filter(
        (id) => id !== "unranked" && state.tierOrder.includes(id)
      );
      if (newOrder.length === state.tierOrder.length) {
        state.tierOrder = newOrder;
      }
    },
    setProjectName(state, action: PayloadAction<string>) {
      state.projectName = action.payload;
    },
    loadProject(
      state,
      action: PayloadAction<{
        tiers: Items;
        tierOrder: string[];
        tierLabels: Record<string, string>;
        tierColors: Record<string, string | undefined>;
        projectName?: string;
      }>
    ) {
      state.tiers = action.payload.tiers;
      state.tierOrder = action.payload.tierOrder;
      state.tierLabels = action.payload.tierLabels;
      state.tierColors = action.payload.tierColors;
      state.projectName = action.payload.projectName ?? "My Tier List";
      state.selection = []; // Clear selection on project load
    },
    resetProject(state) {
      state.tiers = {};
      state.tierOrder = [];
      state.tierLabels = {};
      state.tierColors = {};
      state.projectName = "My Tier List";
      state.selection = [];
      state.sortMode = { type: "custom" };
      state.filters = {};
    },
    // Sorting actions
    setSortMode(state, action: PayloadAction<GlobalSortMode>) {
      state.sortMode = action.payload;
    },
    // Filtering actions
    setFilters(state, action: PayloadAction<ItemFilters>) {
      state.filters = action.payload;
    },
    setSearchFilter(state, action: PayloadAction<string>) {
      state.filters = { ...state.filters, searchText: action.payload };
    },
    setMediaTypeFilter(state, action: PayloadAction<MediaType[]>) {
      state.filters = { ...state.filters, mediaTypes: action.payload };
    },
    toggleMediaTypeFilter(state, action: PayloadAction<MediaType>) {
      const current = state.filters.mediaTypes ?? [];
      if (current.includes(action.payload)) {
        state.filters = {
          ...state.filters,
          mediaTypes: current.filter((t) => t !== action.payload)
        };
      } else {
        state.filters = {
          ...state.filters,
          mediaTypes: [...current, action.payload]
        };
      }
    },
    setHasMediaFilter(state, action: PayloadAction<boolean | undefined>) {
      state.filters = { ...state.filters, hasMedia: action.payload, noMedia: undefined };
    },
    setNoMediaFilter(state, action: PayloadAction<boolean | undefined>) {
      state.filters = { ...state.filters, noMedia: action.payload, hasMedia: undefined };
    },
    clearFilters(state) {
      state.filters = {};
    },
    clearSortAndFilters(state) {
      state.sortMode = { type: "custom" };
      state.filters = {};
    }
  }
});

export const {
  setTiers,
  setTierOrder,
  setSelection,
  toggleSelection,
  clearSelection,
  addItemToUnranked,
  addItemToTier,
  updateItem,
  deleteItem,
  deleteItems,
  moveItemBetweenTiers,
  reorderItemWithinTier,
  setTierLabels,
  setTierColors,
  updateTierLabel,
  updateTierColor,
  addTier,
  removeTier,
  reorderTiers,
  setProjectName,
  loadProject,
  resetProject,
  // Sorting
  setSortMode,
  // Filtering
  setFilters,
  setSearchFilter,
  setMediaTypeFilter,
  toggleMediaTypeFilter,
  setHasMediaFilter,
  setNoMediaFilter,
  clearFilters,
  clearSortAndFilters
} = tierSlice.actions;

export const tierReducer = tierSlice.reducer;
