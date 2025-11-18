/**
 * Undo/redo functionality for tier state
 * Matches Swift AppState undo/redo history behavior
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Items } from "@tiercade/core";

export interface TierSnapshot {
  tiers: Items;
  tierOrder: string[];
  timestamp: number;
  action: string;
}

export interface UndoRedoState {
  past: TierSnapshot[];
  future: TierSnapshot[];
  maxHistorySize: number;
}

const initialState: UndoRedoState = {
  past: [],
  future: [],
  maxHistorySize: 50, // Match Swift's history limit
};

export const undoRedoSlice = createSlice({
  name: "undoRedo",
  initialState,
  reducers: {
    pushHistory(
      state,
      action: PayloadAction<{
        tiers: Items;
        tierOrder: string[];
        action: string;
      }>
    ) {
      const snapshot: TierSnapshot = {
        tiers: action.payload.tiers,
        tierOrder: action.payload.tierOrder,
        timestamp: Date.now(),
        action: action.payload.action,
      };

      state.past.push(snapshot);

      // Trim history if it exceeds max size
      if (state.past.length > state.maxHistorySize) {
        state.past.shift();
      }

      // Clear future when new action is taken
      state.future = [];
    },

    undo(state): TierSnapshot | null {
      if (state.past.length === 0) return null;

      const snapshot = state.past.pop()!;
      state.future.push(snapshot);

      return snapshot;
    },

    redo(state): TierSnapshot | null {
      if (state.future.length === 0) return null;

      const snapshot = state.future.pop()!;
      state.past.push(snapshot);

      return snapshot;
    },

    clearHistory(state) {
      state.past = [];
      state.future = [];
    },
  },
});

export const { pushHistory, undo, redo, clearHistory } = undoRedoSlice.actions;

export const undoRedoReducer = undoRedoSlice.reducer;
