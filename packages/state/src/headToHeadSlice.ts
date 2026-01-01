import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Item } from "@tiercade/core";
import type { HeadToHeadArtifacts, HeadToHeadRecord } from "@tiercade/core";

export type HeadToHeadPhase = "quick" | "refinement";

export interface HeadToHeadState {
  isActive: boolean;
  pool: Item[];
  records: Record<string, HeadToHeadRecord>;
  pairsQueue: [Item, Item][];
  deferredPairs: [Item, Item][];
  currentPair: [Item, Item] | null;
  totalComparisons: number;
  completedComparisons: number;
  refinementTotalComparisons: number;
  refinementCompletedComparisons: number;
  skippedPairKeys: Set<string>;
  phase: HeadToHeadPhase;
  artifacts: HeadToHeadArtifacts | null;
  suggestedPairs: [Item, Item][];
}

const initialState: HeadToHeadState = {
  isActive: false,
  pool: [],
  records: {},
  pairsQueue: [],
  deferredPairs: [],
  currentPair: null,
  totalComparisons: 0,
  completedComparisons: 0,
  refinementTotalComparisons: 0,
  refinementCompletedComparisons: 0,
  skippedPairKeys: new Set<string>(),
  phase: "quick",
  artifacts: null,
  suggestedPairs: []
};

export const headToHeadSlice = createSlice({
  name: "headToHead",
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
    setActive(state, action: PayloadAction<boolean>) {
      state.isActive = action.payload;
    },
    setPool(state, action: PayloadAction<Item[]>) {
      state.pool = action.payload;
    },
    setPairsQueue(state, action: PayloadAction<[Item, Item][]>) {
      state.pairsQueue = action.payload;
      state.totalComparisons = action.payload.length;
      state.completedComparisons = 0;
    },
    setCurrentPair(state, action: PayloadAction<[Item, Item] | null>) {
      state.currentPair = action.payload;
    },
    setPhase(state, action: PayloadAction<HeadToHeadPhase>) {
      state.phase = action.payload;
    },
    setArtifacts(state, action: PayloadAction<HeadToHeadArtifacts | null>) {
      state.artifacts = action.payload;
    },
    setSuggestedPairs(state, action: PayloadAction<[Item, Item][]>) {
      state.suggestedPairs = action.payload;
    },
    setRecords(state, action: PayloadAction<Record<string, HeadToHeadRecord>>) {
      state.records = action.payload;
    }
  }
});

export const {
  reset,
  setActive,
  setPool,
  setPairsQueue,
  setCurrentPair,
  setPhase,
  setArtifacts,
  setSuggestedPairs,
  setRecords
} = headToHeadSlice.actions;

export const headToHeadReducer = headToHeadSlice.reducer;
