/**
 * Presentation/Streaming mode state for content creators
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ChromaKeyColor = "none" | "green" | "magenta" | "blue";

export interface PresentationState {
  /** Whether presentation mode is active */
  isPresenting: boolean;
  /** Chroma key background color for OBS/streaming */
  chromaKey: ChromaKeyColor;
  /** Whether to show item reveal animations */
  revealMode: boolean;
  /** IDs of items that have been revealed (when in reveal mode) */
  revealedItems: string[];
  /** Queue of items to rank (draw mode) */
  itemQueue: string[];
  /** Current item being ranked from queue */
  currentQueueItem: string | null;
  /** Whether to show the "currently ranking" overlay */
  showCurrentItem: boolean;
  /** Whether to play sound effect triggers */
  soundEffectsEnabled: boolean;
  /** Scale factor for items (1 = normal, 1.5 = 150%, etc.) */
  itemScale: number;
  /** Whether to show progress bar */
  showProgress: boolean;
  /** Whether to auto-celebrate S-tier placements */
  celebrateSTier: boolean;
  /** Custom watermark text */
  watermarkText: string;
  /** Whether to show watermark */
  showWatermark: boolean;
}

const initialState: PresentationState = {
  isPresenting: false,
  chromaKey: "none",
  revealMode: false,
  revealedItems: [],
  itemQueue: [],
  currentQueueItem: null,
  showCurrentItem: true,
  soundEffectsEnabled: true,
  itemScale: 1,
  showProgress: true,
  celebrateSTier: true,
  watermarkText: "",
  showWatermark: false,
};

export const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    // Core presentation mode
    togglePresentationMode(state) {
      state.isPresenting = !state.isPresenting;
    },
    setPresentationMode(state, action: PayloadAction<boolean>) {
      state.isPresenting = action.payload;
    },

    // Chroma key
    setChromaKey(state, action: PayloadAction<ChromaKeyColor>) {
      state.chromaKey = action.payload;
    },

    // Reveal mode
    setRevealMode(state, action: PayloadAction<boolean>) {
      state.revealMode = action.payload;
      if (!action.payload) {
        // When turning off reveal mode, clear revealed items
        state.revealedItems = [];
      }
    },
    revealItem(state, action: PayloadAction<string>) {
      if (!state.revealedItems.includes(action.payload)) {
        state.revealedItems.push(action.payload);
      }
    },
    revealAllItems(state, action: PayloadAction<string[]>) {
      state.revealedItems = action.payload;
    },
    hideItem(state, action: PayloadAction<string>) {
      state.revealedItems = state.revealedItems.filter(id => id !== action.payload);
    },
    resetReveals(state) {
      state.revealedItems = [];
    },

    // Queue mode
    setItemQueue(state, action: PayloadAction<string[]>) {
      state.itemQueue = action.payload;
      state.currentQueueItem = action.payload.length > 0 ? action.payload[0] : null;
    },
    drawNextItem(state) {
      if (state.itemQueue.length > 0) {
        // Remove current item from queue
        const remaining = state.itemQueue.slice(1);
        state.itemQueue = remaining;
        state.currentQueueItem = remaining.length > 0 ? remaining[0] : null;
      }
    },
    shuffleQueue(state) {
      // Fisher-Yates shuffle
      const array = [...state.itemQueue];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      state.itemQueue = array;
      state.currentQueueItem = array.length > 0 ? array[0] : null;
    },
    clearQueue(state) {
      state.itemQueue = [];
      state.currentQueueItem = null;
    },

    // Display options
    setShowCurrentItem(state, action: PayloadAction<boolean>) {
      state.showCurrentItem = action.payload;
    },
    setSoundEffectsEnabled(state, action: PayloadAction<boolean>) {
      state.soundEffectsEnabled = action.payload;
    },
    setItemScale(state, action: PayloadAction<number>) {
      state.itemScale = Math.max(0.5, Math.min(2, action.payload));
    },
    setShowProgress(state, action: PayloadAction<boolean>) {
      state.showProgress = action.payload;
    },
    setCelebrateSTier(state, action: PayloadAction<boolean>) {
      state.celebrateSTier = action.payload;
    },

    // Watermark
    setWatermarkText(state, action: PayloadAction<string>) {
      state.watermarkText = action.payload;
    },
    setShowWatermark(state, action: PayloadAction<boolean>) {
      state.showWatermark = action.payload;
    },

    // Reset all presentation settings
    resetPresentationSettings(state) {
      return initialState;
    },
  },
});

export const {
  togglePresentationMode,
  setPresentationMode,
  setChromaKey,
  setRevealMode,
  revealItem,
  revealAllItems,
  hideItem,
  resetReveals,
  setItemQueue,
  drawNextItem,
  shuffleQueue,
  clearQueue,
  setShowCurrentItem,
  setSoundEffectsEnabled,
  setItemScale,
  setShowProgress,
  setCelebrateSTier,
  setWatermarkText,
  setShowWatermark,
  resetPresentationSettings,
} = presentationSlice.actions;

export const presentationReducer = presentationSlice.reducer;
