import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Items, Item } from "@tiercade/core";
import { moveItem as moveItemLogic } from "@tiercade/core";

export interface TierState {
  tiers: Items;
  tierOrder: string[];
  selection: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string | undefined>;
  projectName: string;
}

const initialState: TierState = {
  tiers: {},
  tierOrder: [],
  selection: [],
  tierLabels: {},
  tierColors: {},
  projectName: "My Tier List"
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
      if (state.selection.includes(id)) {
        state.selection = state.selection.filter((x) => x !== id);
      } else {
        state.selection.push(id);
      }
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
      // Find and update the item in all tiers
      for (const tierName of Object.keys(state.tiers)) {
        const tierItems = state.tiers[tierName];
        const itemIndex = tierItems.findIndex((item) => item.id === itemId);
        if (itemIndex !== -1) {
          state.tiers[tierName][itemIndex] = {
            ...tierItems[itemIndex],
            ...updates,
          };
          break;
        }
      }
    },
    deleteItem(state, action: PayloadAction<string>) {
      const itemId = action.payload;
      // Remove the item from all tiers
      for (const tierName of Object.keys(state.tiers)) {
        state.tiers[tierName] = state.tiers[tierName].filter(
          (item) => item.id !== itemId
        );
      }
      // Remove from selection if selected
      state.selection = state.selection.filter((id) => id !== itemId);
    },
    deleteItems(state, action: PayloadAction<string[]>) {
      const itemIds = new Set(action.payload);
      // Remove the items from all tiers
      for (const tierName of Object.keys(state.tiers)) {
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
  resetProject
} = tierSlice.actions;

export const tierReducer = tierSlice.reducer;
