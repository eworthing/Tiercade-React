import React, { createContext, useContext, useMemo } from "react";
import type { Item } from "@tiercade/core";
import type { FileDropResult } from "../tier-board/TierRow";

/**
 * Context value for TierBoard presentation and interaction settings
 *
 * Reduces prop drilling by providing shared settings to all tier board components
 */
export interface TierBoardContextValue {
  // Presentation settings
  /** Scale factor for items (1 = normal) */
  itemScale: number;
  /** Whether reveal mode is active (items start hidden) */
  revealMode: boolean;
  /** Set of revealed item IDs in reveal mode */
  revealedItems: string[];

  // Selection state
  /** Set of selected item IDs */
  selectedItems: string[];

  // Interaction callbacks (optional - not all contexts need them)
  /** Called when an item is clicked */
  onItemClick?: (item: Item) => void;
  /** Called when an item is double-clicked */
  onItemDoubleClick?: (item: Item) => void;
  /** Called when an item is revealed */
  onItemReveal?: (itemId: string) => void;
  /** Called when a file is dropped on a tier */
  onFileDrop?: (tierId: string, file: FileDropResult) => void;
  /** Called when a file is dropped on an item */
  onItemMediaDrop?: (itemId: string, file: FileDropResult) => void;
}

const defaultContextValue: TierBoardContextValue = {
  itemScale: 1,
  revealMode: false,
  revealedItems: [],
  selectedItems: [],
};

const TierBoardContext = createContext<TierBoardContextValue>(defaultContextValue);

export interface TierBoardProviderProps {
  children: React.ReactNode;
  value: Partial<TierBoardContextValue>;
}

/**
 * Provider for TierBoard context
 *
 * Wrap TierBoard with this provider to pass presentation settings
 * without prop drilling through multiple component layers
 */
export const TierBoardProvider: React.FC<TierBoardProviderProps> = ({
  children,
  value,
}) => {
  const contextValue = useMemo(
    () => ({
      ...defaultContextValue,
      ...value,
    }),
    [value]
  );

  return (
    <TierBoardContext.Provider value={contextValue}>
      {children}
    </TierBoardContext.Provider>
  );
};

TierBoardProvider.displayName = "TierBoardProvider";

/**
 * Hook to access TierBoard context
 *
 * Use within components inside TierBoard to access presentation settings
 */
export function useTierBoardContext(): TierBoardContextValue {
  return useContext(TierBoardContext);
}

/**
 * Hook to access just the presentation settings from context
 */
export function usePresentationSettings() {
  const { itemScale, revealMode, revealedItems } = useTierBoardContext();
  return { itemScale, revealMode, revealedItems };
}

/**
 * Hook to access just the selection state from context
 */
export function useSelectionContext() {
  const { selectedItems, onItemClick } = useTierBoardContext();
  return { selectedItems, onItemClick };
}
