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
  /** Total pairs in the current phase (quick or refinement) */
  totalPairs: number;
  /** Completed comparisons (decided, not skipped) */
  completedComparisons: number;
  /** Number of pairs skipped in current session */
  skippedCount: number;
  refinementTotalComparisons: number;
  refinementCompletedComparisons: number;
  /** Set of canonical pair keys that have been skipped (for deduplication) */
  skippedPairKeys: string[];
  phase: HeadToHeadPhase;
  artifacts: HeadToHeadArtifacts | null;
  suggestedPairs: [Item, Item][];
}

/** Generate canonical pair key for deduplication (smaller ID first) */
function makePairKey(a: Item, b: Item): string {
  return a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
}

const initialState: HeadToHeadState = {
  isActive: false,
  pool: [],
  records: {},
  pairsQueue: [],
  deferredPairs: [],
  currentPair: null,
  totalPairs: 0,
  completedComparisons: 0,
  skippedCount: 0,
  refinementTotalComparisons: 0,
  refinementCompletedComparisons: 0,
  skippedPairKeys: [],
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
      state.totalPairs = action.payload.length;
      state.completedComparisons = 0;
      state.skippedCount = 0;
      state.deferredPairs = [];
      state.skippedPairKeys = [];
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
    },
    /** Advance to next pair after a vote (not a skip) */
    advanceAfterVote(state) {
      state.completedComparisons += 1;
      const [next, ...rest] = state.pairsQueue;
      state.pairsQueue = rest;
      state.currentPair = next ?? null;
    },
    /** Skip current pair and defer it for later */
    skipCurrentPair(state) {
      if (!state.currentPair) return;

      const [a, b] = state.currentPair;
      const pairKey = makePairKey(a, b);

      // Only defer if not already skipped (prevent infinite loops)
      if (!state.skippedPairKeys.includes(pairKey)) {
        state.deferredPairs.push(state.currentPair);
        state.skippedPairKeys.push(pairKey);
      }

      state.skippedCount += 1;

      // Advance to next pair
      const [next, ...rest] = state.pairsQueue;
      state.pairsQueue = rest;
      state.currentPair = next ?? null;
    },
    /** Recycle deferred pairs back into the queue when main queue is exhausted */
    recycleDeferredPairs(state) {
      if (state.deferredPairs.length === 0) return;

      // Move deferred pairs to main queue
      const [first, ...rest] = state.deferredPairs;
      state.pairsQueue = rest;
      state.deferredPairs = [];
      state.currentPair = first ?? null;

      // Clear skipped keys so pairs can be skipped again if needed
      state.skippedPairKeys = [];
    },
    /** Clear deferred pairs (e.g., when finishing session) */
    clearDeferredPairs(state) {
      state.deferredPairs = [];
      state.skippedPairKeys = [];
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
  setRecords,
  advanceAfterVote,
  skipCurrentPair,
  recycleDeferredPairs,
  clearDeferredPairs
} = headToHeadSlice.actions;

export const headToHeadReducer = headToHeadSlice.reducer;
