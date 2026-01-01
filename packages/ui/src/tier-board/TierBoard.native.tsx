/**
 * TierBoard Native Component
 * Platform-aware router between iOS/iPadOS (touch) and tvOS (focus) implementations
 */
import React from "react";
import { Platform } from "react-native";
import type { Items, Item } from "@tiercade/core";
import type { FilterType } from "../components/SearchBar";
import { TierBoardTouch } from "./TierBoardTouch.native";
import { TierBoardTV } from "./TierBoardTV.native";

export interface TierBoardProps {
  tiers: Items;
  tierOrder: string[];
  onMoveItem?: (itemId: string, targetTierName: string) => void;
  onReorderItems?: (tierId: string, fromIndex: number, toIndex: number) => void;
  tierColors?: Record<string, string>;
  tierLabels?: Record<string, string>;
  cardOrientation?: "portrait" | "landscape";
  /** Callback when drag starts - useful for analytics/global state */
  onDragStart?: (itemId: string, tierId: string) => void;
  /** Callback when drag ends - useful for analytics/undo tracking */
  onDragComplete?: (itemId: string, fromTier: string, toTier: string) => void;
  /** Callback when drag is canceled */
  onDragCancel?: (itemId: string) => void;
  /** Validation function to prevent invalid drops - return true to cancel */
  validateDrop?: (itemId: string, fromTier: string, toTier: string) => { allowed: boolean; reason?: string };
  /** Search query to filter items */
  searchQuery?: string;
  /** Active filter (all, unranked, or tier ID) */
  activeFilter?: FilterType;
  /** Selected item IDs */
  selection?: string[];
  /** Callback when item selection changes */
  onToggleSelection?: (itemId: string) => void;
  /** Locked tier IDs (prevent moves into these tiers) */
  lockedTiers?: string[];
  /** Callback to toggle tier lock */
  onToggleTierLock?: (tierId: string) => void;
  /** Callback when item is clicked for details */
  onItemClick?: (item: Item) => void;
  /** Callback when item context menu is requested */
  onItemContextMenu?: (item: Item) => void;
}

/**
 * TierBoard component for React Native
 *
 * Automatically selects the appropriate implementation based on platform:
 * - iOS/iPadOS: Touch-based drag-and-drop + tier picker overlay
 * - tvOS: Focus-based navigation + tier picker overlay
 */
export const TierBoard: React.FC<TierBoardProps> = (props) => {
  // tvOS uses focus-based navigation (Siri Remote)
  if (Platform.isTV) {
    return <TierBoardTV {...props} />;
  }

  // iOS/iPadOS uses touch-based drag-and-drop
  return <TierBoardTouch {...props} />;
};

export default TierBoard;
