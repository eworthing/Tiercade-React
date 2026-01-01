/**
 * TierBoardTV - tvOS Focus-based Implementation
 * Uses Siri Remote focus navigation and tier picker overlay
 */
import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  TVFocusGuideView,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { Items, Item } from "@tiercade/core";
import { palette, metrics, tvosMetrics, reanimatedSprings, reanimatedTiming } from "@tiercade/theme";
import type { FilterType } from "../components/SearchBar";
import { useTVFocus, useTVListFocus } from "../hooks/useTVFocus.native";

// Import TierBoardProps from the router
import type { TierBoardProps } from "./TierBoard.native";

/**
 * TierBoardTV - Focus-based tier board for Apple TV
 *
 * Interaction:
 * - D-pad: Navigate between items and tiers
 * - Select: Open tier picker overlay
 * - Menu: Close overlay / go back
 */
export const TierBoardTV: React.FC<TierBoardProps> = ({
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
  const [tierPickerItem, setTierPickerItem] = useState<Item | null>(null);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

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

  // Flatten all items for focus navigation
  const allItems = useMemo(() => {
    const items: { item: Item; tierId: string }[] = [];
    orderedIds.forEach((tierId) => {
      (filteredTiers[tierId] ?? []).forEach((item) => {
        items.push({ item, tierId });
      });
    });
    return items;
  }, [orderedIds, filteredTiers]);

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

  // Handle item select (open tier picker)
  const handleItemSelect = useCallback(
    (item: Item) => {
      setTierPickerItem(item);
    },
    []
  );

  // Handle item focus change
  const handleItemFocus = useCallback((itemId: string) => {
    setFocusedItemId(itemId);
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

  return (
    <View style={styles.container}>
      {/* TV Focus Guide for proper navigation */}
      <TVFocusGuideView style={styles.focusGuide} autoFocus>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {orderedIds.map((tierId) => (
            <TierRowTV
              key={tierId}
              tierId={tierId}
              items={filteredTiers[tierId] ?? []}
              tierColor={tierColors[tierId]}
              tierLabel={tierLabels[tierId]}
              cardOrientation={cardOrientation}
              isLocked={lockedTiers.includes(tierId)}
              selection={selection}
              onToggleSelection={onToggleSelection}
              onItemSelect={handleItemSelect}
              onItemClick={onItemClick}
              focusedItemId={focusedItemId}
              onItemFocus={handleItemFocus}
            />
          ))}
        </ScrollView>
      </TVFocusGuideView>

      {/* Tier Picker Modal */}
      <TierPickerModalTV
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
    </View>
  );
};

// tvOS Tier Row Component
interface TierRowTVProps {
  tierId: string;
  items: Item[];
  tierColor?: string;
  tierLabel?: string;
  cardOrientation?: "portrait" | "landscape";
  isLocked?: boolean;
  selection?: string[];
  onToggleSelection?: (itemId: string) => void;
  onItemSelect?: (item: Item) => void;
  onItemClick?: (item: Item) => void;
  focusedItemId?: string | null;
  onItemFocus?: (itemId: string) => void;
}

const TierRowTV: React.FC<TierRowTVProps> = ({
  tierId,
  items,
  tierColor,
  tierLabel,
  cardOrientation = "portrait",
  isLocked = false,
  selection = [],
  onToggleSelection,
  onItemSelect,
  onItemClick,
  focusedItemId,
  onItemFocus,
}) => {
  const label = tierLabel ?? (tierId === "unranked" ? "Unranked" : tierId);
  const bgColor = tierColor ?? palette.tierDefault;

  return (
    <View style={styles.row} testID={`tier-row-${tierId}`}>
      {/* Tier Label */}
      <View style={[styles.labelContainer, { backgroundColor: bgColor }]}>
        <Text style={styles.labelText}>{label}</Text>
        {items.length > 0 && (
          <Text style={styles.countText}>{items.length}</Text>
        )}
        {isLocked && (
          <Text style={styles.lockIcon}>🔒</Text>
        )}
      </View>

      {/* Items area */}
      <View style={styles.itemsContainer}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No items</Text>
        ) : (
          <View style={styles.itemsGrid}>
            {items.map((item) => (
              <TVItemCard
                key={item.id}
                item={item}
                cardOrientation={cardOrientation}
                isSelected={selection.includes(item.id)}
                isFocused={focusedItemId === item.id}
                onSelect={() => onItemSelect?.(item)}
                onClick={() => onItemClick?.(item)}
                onFocus={() => onItemFocus?.(item.id)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// tvOS Item Card Component
interface TVItemCardProps {
  item: Item;
  cardOrientation: "portrait" | "landscape";
  isSelected: boolean;
  isFocused: boolean;
  onSelect: () => void;
  onClick: () => void;
  onFocus: () => void;
}

const TVItemCard: React.FC<TVItemCardProps> = ({
  item,
  cardOrientation,
  isSelected,
  isFocused,
  onSelect,
  onClick,
  onFocus,
}) => {
  const cardWidth = cardOrientation === "landscape"
    ? tvosMetrics.cardSizes.medium.width
    : tvosMetrics.cardSizes.medium.width;

  // Focus animation
  const scale = useSharedValue(1);
  const elevation = useSharedValue(1);

  React.useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1.1, reanimatedSprings.snappy);
      elevation.value = withTiming(8, { duration: reanimatedTiming.fast });
    } else {
      scale.value = withSpring(1, reanimatedSprings.gentle);
      elevation.value = withTiming(1, { duration: reanimatedTiming.fast });
    }
  }, [isFocused, scale, elevation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    elevation: elevation.value,
    shadowOpacity: elevation.value > 1 ? 0.3 : 0.1,
    shadowRadius: elevation.value * 3,
  }));

  return (
    <Pressable
      onPress={onSelect}
      onLongPress={onClick}
      onFocus={onFocus}
      focusable={true}
      hasTVPreferredFocus={isFocused}
      testID={`item-card-${item.id}`}
      accessibilityLabel={`${item.name ?? item.id}${isSelected ? ", selected" : ""}`}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.tvCard,
          { width: cardWidth },
          isSelected && styles.cardSelected,
          isFocused && styles.cardFocused,
          animatedStyle,
        ]}
      >
        <View style={styles.cardContent}>
          <Text
            style={styles.cardTitle}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name ?? item.id}
          </Text>
          {item.seasonString && (
            <Text
              style={styles.cardSubtitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.seasonString}
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.selectionIcon}>✓</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

// tvOS Tier Picker Modal
interface TierPickerModalTVProps {
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

const TierPickerModalTV: React.FC<TierPickerModalTVProps> = ({
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
  const [focusedTier, setFocusedTier] = useState<string | null>(null);

  // TV focus hook for modal
  const { ref: modalRef } = useTVFocus({
    onBack: onClose,
    enabled: visible,
  });

  if (!visible || !item) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View ref={modalRef} style={styles.modalOverlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.tvModalContent}
        >
          {/* Item info */}
          <View style={styles.modalHeader}>
            <Text style={styles.tvModalTitle}>Move to Tier</Text>
            <Text style={styles.tvModalSubtitle}>{item.name ?? item.id}</Text>
          </View>

          {/* Tier list (vertical for TV) */}
          <TVFocusGuideView style={styles.tierList} autoFocus>
            {tiers.map((tierId) => {
              const label = tierLabels[tierId] ?? (tierId === "unranked" ? "Unranked" : tierId);
              const color = tierColors[tierId] ?? palette.tierDefault;
              const isCurrent = tierId === currentTierId;
              const isLocked = lockedTiers.includes(tierId);
              const isDisabled = isCurrent || isLocked;
              const isFocused = focusedTier === tierId;

              return (
                <Pressable
                  key={tierId}
                  onPress={() => !isDisabled && onSelect(tierId)}
                  onFocus={() => setFocusedTier(tierId)}
                  focusable={!isDisabled}
                  disabled={isDisabled}
                  style={[
                    styles.tvTierButton,
                    { borderLeftColor: color },
                    isDisabled && styles.tierButtonDisabled,
                    isFocused && styles.tvTierButtonFocused,
                  ]}
                >
                  <View style={[styles.tierColorBar, { backgroundColor: color }]} />
                  <Text style={styles.tvTierButtonText}>{label}</Text>
                  {isCurrent && (
                    <Text style={styles.tvTierHint}>Current</Text>
                  )}
                  {isLocked && !isCurrent && (
                    <Text style={styles.tvTierHint}>🔒 Locked</Text>
                  )}
                </Pressable>
              );
            })}
          </TVFocusGuideView>

          {/* Cancel hint */}
          <Text style={styles.tvCancelHint}>Press Menu to cancel</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  focusGuide: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tvosMetrics.focusableGap,
    gap: tvosMetrics.focusableGap,
  },
  row: {
    flexDirection: "row",
    borderRadius: metrics.radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    overflow: "hidden",
  },
  labelContainer: {
    width: tvosMetrics.tierRow.labelWidth,
    paddingVertical: metrics.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.textOnColor,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  countText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  lockIcon: {
    fontSize: 16,
    marginTop: 4,
    opacity: 0.6,
  },
  itemsContainer: {
    flex: 1,
    padding: metrics.spacing.md,
    backgroundColor: palette.surfaceSoft,
    minHeight: tvosMetrics.tierRow.minHeight,
  },
  emptyText: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    color: palette.textMuted,
    fontSize: 16,
    paddingVertical: metrics.spacing.lg,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tvosMetrics.focusableGap,
  },
  tvCard: {
    paddingHorizontal: metrics.spacing.md,
    paddingVertical: metrics.spacing.md,
    borderRadius: metrics.radii.md,
    borderWidth: 2,
    borderColor: palette.border,
    backgroundColor: palette.surfaceElevated,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: tvosMetrics.minFocusableSize,
    justifyContent: "center",
  },
  cardSelected: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  cardFocused: {
    borderColor: palette.accent,
    borderWidth: 3,
    backgroundColor: palette.surfaceHover,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: palette.textMuted,
  },
  selectionIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  selectionIcon: {
    fontSize: 18,
    color: palette.accent,
    fontWeight: "700",
  },
  // Modal styles for TV
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: tvosMetrics.focusableGap * 2,
  },
  tvModalContent: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: metrics.radii.xl,
    padding: tvosMetrics.focusableGap,
    width: "60%",
    maxWidth: 600,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
  },
  modalHeader: {
    marginBottom: tvosMetrics.focusableGap,
    alignItems: "center",
  },
  tvModalTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 8,
  },
  tvModalSubtitle: {
    fontSize: 18,
    color: palette.textSecondary,
  },
  tierList: {
    gap: metrics.spacing.md,
  },
  tvTierButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: metrics.spacing.lg,
    paddingHorizontal: metrics.spacing.lg,
    borderRadius: metrics.radii.md,
    backgroundColor: palette.surface,
    borderLeftWidth: 4,
    borderLeftColor: palette.tierDefault,
  },
  tvTierButtonFocused: {
    backgroundColor: palette.surfaceHover,
    borderColor: palette.accent,
    borderWidth: 2,
  },
  tierButtonDisabled: {
    opacity: 0.4,
  },
  tierColorBar: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: metrics.spacing.md,
  },
  tvTierButtonText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: palette.text,
    textTransform: "uppercase",
  },
  tvTierHint: {
    fontSize: 14,
    color: palette.textMuted,
  },
  tvCancelHint: {
    textAlign: "center",
    marginTop: tvosMetrics.focusableGap,
    fontSize: 14,
    color: palette.textMuted,
  },
});

export default TierBoardTV;
