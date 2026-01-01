/**
 * TierBoardTouch - iOS/iPadOS Touch Implementation
 * Supports both drag-and-drop AND tier picker overlay
 */
import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { Items, Item } from "@tiercade/core";
import { palette, metrics, reanimatedSprings, reanimatedTiming } from "@tiercade/theme";
import type { FilterType } from "../components/SearchBar";
import { TierRow } from "./TierRow.native";

// Import TierBoardProps from the router
import type { TierBoardProps } from "./TierBoard.native";

// Track drop target bounds for hit testing
interface DropTargetBounds {
  tierId: string;
  bounds: { x: number; y: number; width: number; height: number };
}

/**
 * TierBoardTouch - Touch-based tier board for iOS/iPadOS
 *
 * Interaction modes:
 * - Long press + drag: Move item between tiers
 * - Tap: Open tier picker overlay for quick move
 */
export const TierBoardTouch: React.FC<TierBoardProps> = ({
  tiers,
  tierOrder,
  onMoveItem,
  onReorderItems,
  tierColors = {},
  tierLabels = {},
  cardOrientation = "portrait",
  onDragStart: onDragStartCallback,
  onDragComplete,
  onDragCancel,
  validateDrop,
  searchQuery = "",
  activeFilter = "all",
  selection = [],
  onToggleSelection,
  lockedTiers = [],
  onToggleTierLock,
  onItemClick,
  onItemContextMenu,
}) => {
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [previewTierId, setPreviewTierId] = useState<string | null>(null);
  const [tierPickerItem, setTierPickerItem] = useState<Item | null>(null);

  // Track drop target bounds
  const dropTargetsRef = useRef<Map<string, DropTargetBounds>>(new Map());

  // Ordered tier IDs including unranked
  const orderedIds = useMemo(() => [...tierOrder, "unranked"], [tierOrder]);

  // Filter tiers based on search query and active filter
  const filteredTiers = useMemo(() => {
    const filtered: Items = {};

    Object.entries(tiers).forEach(([tierId, items]) => {
      let filteredItems = items;

      // Apply tier filter
      if (activeFilter !== "all") {
        if (activeFilter === "unranked" && tierId !== "unranked") {
          filteredItems = [];
        } else if (activeFilter !== "unranked" && tierId !== activeFilter) {
          filteredItems = [];
        }
      }

      // Apply search query
      if (searchQuery && filteredItems.length > 0) {
        const query = searchQuery.toLowerCase();
        filteredItems = filteredItems.filter((item) => {
          const name = (item.name || item.id || "").toLowerCase();
          const season = (item.seasonString || "").toLowerCase();
          return name.includes(query) || season.includes(query);
        });
      }

      filtered[tierId] = filteredItems;
    });

    return filtered;
  }, [tiers, searchQuery, activeFilter]);

  // Find which tier an item belongs to
  const findItemTier = useCallback(
    (itemId: string): string | null => {
      for (const [tierId, items] of Object.entries(tiers)) {
        if (items.some((item) => item.id === itemId)) {
          return tierId;
        }
      }
      return null;
    },
    [tiers]
  );

  // Find item by ID
  const findItem = useCallback(
    (itemId: string): Item | null => {
      for (const items of Object.values(tiers)) {
        const found = items.find((item) => item.id === itemId);
        if (found) return found;
      }
      return null;
    },
    [tiers]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (itemId: string) => {
      const tierId = findItemTier(itemId);
      setIsDragging(true);
      setDraggedItemId(itemId);
      onDragStartCallback?.(itemId, tierId ?? "");
    },
    [findItemTier, onDragStartCallback]
  );

  // Handle drag end - hit test against drop targets
  const handleDragEnd = useCallback(
    (itemId: string, x: number, y: number) => {
      setIsDragging(false);
      setDraggedItemId(null);
      setPreviewTierId(null);

      // Find which tier was dropped on
      let targetTierId: string | null = null;
      for (const [tierId, target] of dropTargetsRef.current.entries()) {
        const { bounds } = target;
        if (
          x >= bounds.x &&
          x <= bounds.x + bounds.width &&
          y >= bounds.y &&
          y <= bounds.y + bounds.height
        ) {
          targetTierId = tierId;
          break;
        }
      }

      if (!targetTierId || !onMoveItem) {
        onDragCancel?.(itemId);
        return;
      }

      const sourceTierId = findItemTier(itemId);

      // Check if drop is allowed
      if (lockedTiers.includes(targetTierId)) {
        onDragCancel?.(itemId);
        return;
      }

      if (validateDrop && sourceTierId) {
        const validation = validateDrop(itemId, sourceTierId, targetTierId);
        if (!validation.allowed) {
          onDragCancel?.(itemId);
          return;
        }
      }

      // Perform move
      onMoveItem(itemId, targetTierId);
      onDragComplete?.(itemId, sourceTierId ?? "", targetTierId);
    },
    [
      findItemTier,
      lockedTiers,
      validateDrop,
      onMoveItem,
      onDragComplete,
      onDragCancel,
    ]
  );

  // Handle tier picker open (on tap)
  const handleOpenTierPicker = useCallback((item: Item) => {
    setTierPickerItem(item);
  }, []);

  // Handle tier picker selection
  const handleTierPickerSelect = useCallback(
    (targetTierId: string) => {
      if (!tierPickerItem || !onMoveItem) {
        setTierPickerItem(null);
        return;
      }

      const sourceTierId = findItemTier(tierPickerItem.id);

      // Check if drop is allowed
      if (lockedTiers.includes(targetTierId)) {
        setTierPickerItem(null);
        return;
      }

      if (validateDrop && sourceTierId) {
        const validation = validateDrop(tierPickerItem.id, sourceTierId, targetTierId);
        if (!validation.allowed) {
          setTierPickerItem(null);
          return;
        }
      }

      // Perform move
      onMoveItem(tierPickerItem.id, targetTierId);
      onDragComplete?.(tierPickerItem.id, sourceTierId ?? "", targetTierId);
      setTierPickerItem(null);
    },
    [
      tierPickerItem,
      findItemTier,
      lockedTiers,
      validateDrop,
      onMoveItem,
      onDragComplete,
    ]
  );

  // Track tier row layouts for drop target detection
  const handleTierLayout = useCallback(
    (tierId: string, bounds: { x: number; y: number; width: number; height: number }) => {
      dropTargetsRef.current.set(tierId, { tierId, bounds });
    },
    []
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Dragging indicator */}
      {isDragging && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={styles.draggingIndicator}
        >
          <Text style={styles.draggingText}>Dragging</Text>
        </Animated.View>
      )}

      {/* Tier rows */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {orderedIds.map((tierId) => (
          <TierRow
            key={tierId}
            tierId={tierId}
            items={filteredTiers[tierId] ?? []}
            tierColor={tierColors[tierId]}
            tierLabel={tierLabels[tierId]}
            cardOrientation={cardOrientation}
            isPreviewTarget={previewTierId === tierId}
            isLocked={lockedTiers.includes(tierId)}
            onToggleLock={onToggleTierLock}
            selection={selection}
            onToggleSelection={onToggleSelection}
            onItemClick={onItemClick}
            onItemContextMenu={handleOpenTierPicker}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onLayout={handleTierLayout}
          />
        ))}
      </ScrollView>

      {/* Tier Picker Modal */}
      <TierPickerModal
        visible={tierPickerItem !== null}
        item={tierPickerItem}
        tiers={orderedIds}
        tierLabels={tierLabels}
        tierColors={tierColors}
        currentTierId={tierPickerItem ? findItemTier(tierPickerItem.id) : null}
        lockedTiers={lockedTiers}
        onSelect={handleTierPickerSelect}
        onClose={() => setTierPickerItem(null)}
      />
    </GestureHandlerRootView>
  );
};

// Tier Picker Modal Component
interface TierPickerModalProps {
  visible: boolean;
  item: Item | null;
  tiers: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string>;
  currentTierId: string | null;
  lockedTiers: string[];
  onSelect: (tierId: string) => void;
  onClose: () => void;
}

const TierPickerModal: React.FC<TierPickerModalProps> = ({
  visible,
  item,
  tiers,
  tierLabels,
  tierColors,
  currentTierId,
  lockedTiers,
  onSelect,
  onClose,
}) => {
  if (!visible || !item) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.modalContent}
        >
          {/* Item info */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Move Item</Text>
            <Text style={styles.modalSubtitle}>{item.name ?? item.id}</Text>
          </View>

          {/* Tier grid */}
          <View style={styles.tierGrid}>
            {tiers.map((tierId, index) => {
              const label = tierLabels[tierId] ?? (tierId === "unranked" ? "Unranked" : tierId);
              const color = tierColors[tierId] ?? palette.tierDefault;
              const isCurrent = tierId === currentTierId;
              const isLocked = lockedTiers.includes(tierId);
              const isDisabled = isCurrent || isLocked;

              return (
                <Pressable
                  key={tierId}
                  style={[
                    styles.tierButton,
                    { backgroundColor: color },
                    isDisabled && styles.tierButtonDisabled,
                  ]}
                  onPress={() => !isDisabled && onSelect(tierId)}
                  disabled={isDisabled}
                >
                  <Text style={styles.tierButtonText}>{label}</Text>
                  {isCurrent && (
                    <Text style={styles.tierButtonHint}>Current</Text>
                  )}
                  {isLocked && !isCurrent && (
                    <Text style={styles.tierButtonHint}>🔒</Text>
                  )}
                  {!isDisabled && (
                    <Text style={styles.tierButtonShortcut}>{index + 1}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Cancel button */}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: metrics.spacing.md,
    gap: metrics.spacing.md,
  },
  draggingIndicator: {
    position: "absolute",
    top: metrics.spacing.md,
    right: metrics.spacing.md,
    zIndex: 100,
    paddingHorizontal: metrics.spacing.lg,
    paddingVertical: metrics.spacing.sm,
    backgroundColor: palette.accent,
    borderRadius: metrics.radii.full,
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  draggingText: {
    color: palette.textOnColor,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: metrics.spacing.xl,
  },
  modalContent: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: metrics.radii.xl,
    padding: metrics.spacing.xl,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    marginBottom: metrics.spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
    marginBottom: metrics.spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  tierGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: metrics.spacing.sm,
    marginBottom: metrics.spacing.lg,
  },
  tierButton: {
    flexBasis: "48%",
    flexGrow: 1,
    paddingVertical: metrics.spacing.md,
    paddingHorizontal: metrics.spacing.md,
    borderRadius: metrics.radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tierButtonDisabled: {
    opacity: 0.5,
  },
  tierButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.textOnColor,
    textTransform: "uppercase",
  },
  tierButtonHint: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  tierButtonShortcut: {
    position: "absolute",
    top: 4,
    right: 8,
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: metrics.spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textSecondary,
  },
});

export default TierBoardTouch;
