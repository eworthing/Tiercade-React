import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Items, Item } from "@tiercade/core";
import { moveItem as moveItemLogic } from "@tiercade/core";

export interface TierState {
  tiers: Items;
  tierOrder: string[];
  selection: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string | undefined>;
}

const initialState: TierState = {
  tiers: {},
  tierOrder: [],
  selection: [],
  tierLabels: {},
  tierColors: {}
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
    moveItemBetweenTiers(
      state,
      action: PayloadAction<{ itemId: string; targetTierName: string }>
    ) {
      const { itemId, targetTierName } = action.payload;
      state.tiers = moveItemLogic(state.tiers, itemId, targetTierName);
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
    loadProject(
      state,
      action: PayloadAction<{
        tiers: Items;
        tierOrder: string[];
        tierLabels: Record<string, string>;
        tierColors: Record<string, string | undefined>;
      }>
    ) {
      state.tiers = action.payload.tiers;
      state.tierOrder = action.payload.tierOrder;
      state.tierLabels = action.payload.tierLabels;
      state.tierColors = action.payload.tierColors;
      state.selection = []; // Clear selection on project load
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
  moveItemBetweenTiers,
  setTierLabels,
  setTierColors,
  loadProject
} = tierSlice.actions;

export const tierReducer = tierSlice.reducer;
