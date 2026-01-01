/**
 * TierRow Native Component
 * Individual tier row for React Native with animated items
 */
import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import type { Item } from "@tiercade/core";
import { palette, metrics, reanimatedSprings, reanimatedTiming } from "@tiercade/theme";
import { useDragItem } from "../hooks/useDragItem.native";

export interface TierRowProps {
  tierId: string;
  items: Item[];
  tierColor?: string;
  tierLabel?: string;
  cardOrientation?: "portrait" | "landscape";
  /** Whether this tier is currently the preview target during drag */
  isPreviewTarget?: boolean;
  /** Whether this tier is locked (prevents items from being moved in) */
  isLocked?: boolean;
  /** Callback to toggle tier lock state */
  onToggleLock?: (tierId: string) => void;
  /** Selected item IDs */
  selection?: string[];
  /** Callback when item selection changes */
  onToggleSelection?: (itemId: string) => void;
  /** Callback when item is clicked for details */
  onItemClick?: (item: Item) => void;
  /** Callback when item context menu is requested (tier picker) */
  onItemContextMenu?: (item: Item) => void;
  /** Callback when item drag starts */
  onDragStart?: (itemId: string) => void;
  /** Callback when item drag ends */
  onDragEnd?: (itemId: string, x: number, y: number) => void;
  /** Callback when row layout changes (for drop target tracking) */
  onLayout?: (tierId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  /** tvOS: Currently focused item ID */
  focusedItemId?: string | null;
  /** tvOS: Callback when item receives focus */
  onItemFocus?: (itemId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TierRow: React.FC<TierRowProps> = ({
  tierId,
  items,
  tierColor,
  tierLabel,
  cardOrientation = "portrait",
  isPreviewTarget = false,
  isLocked = false,
  onToggleLock,
  selection = [],
  onToggleSelection,
  onItemClick,
  onItemContextMenu,
  onDragStart,
  onDragEnd,
  onLayout,
  focusedItemId,
  onItemFocus,
}) => {
  const label = tierLabel ?? (tierId === "unranked" ? "Unranked" : tierId);
  const bgColor = tierColor ?? palette.tierDefault;
  const isTVOS = Platform.isTV;

  // Animated values for row highlight
  const highlightScale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);

  // Update highlight state when preview target changes
  React.useEffect(() => {
    if (isPreviewTarget) {
      highlightScale.value = withSpring(1.003, reanimatedSprings.snappy);
      highlightOpacity.value = withTiming(1, { duration: reanimatedTiming.fast });
    } else {
      highlightScale.value = withSpring(1, reanimatedSprings.gentle);
      highlightOpacity.value = withTiming(0, { duration: reanimatedTiming.fast });
    }
  }, [isPreviewTarget, highlightScale, highlightOpacity]);

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: highlightScale.value }],
    borderColor: highlightOpacity.value > 0.5 ? palette.accent : palette.border,
  }));

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      onLayout?.(tierId, { x, y, width, height });
    },
    [tierId, onLayout]
  );

  return (
    <Animated.View
      style={[styles.row, rowAnimatedStyle]}
      onLayout={handleLayout}
      testID={`tier-row-${tierId}`}
    >
      {/* Tier Label - Colored sidebar */}
      <View style={[styles.labelContainer, { backgroundColor: bgColor }]}>
        <Text style={styles.labelText}>{label}</Text>
        {items.length > 0 && (
          <Text style={styles.countText}>{items.length}</Text>
        )}
        {isLocked && (
          <View style={styles.lockIcon}>
            <Text style={styles.lockIconText}>🔒</Text>
          </View>
        )}
      </View>

      {/* Items area */}
      <View style={styles.itemsContainer}>
        {items.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              isPreviewTarget && styles.emptyTextHighlight,
            ]}
          >
            {isPreviewTarget ? "Drop here" : "Drag items here"}
          </Text>
        ) : (
          <View style={styles.itemsGrid}>
            {items.map((item) => (
              <TierItemCard
                key={item.id}
                item={item}
                tierId={tierId}
                cardOrientation={cardOrientation}
                isSelected={selection.includes(item.id)}
                isFocused={focusedItemId === item.id}
                isTVOS={isTVOS}
                onToggleSelection={onToggleSelection}
                onItemClick={onItemClick}
                onItemContextMenu={onItemContextMenu}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onFocus={onItemFocus}
              />
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

interface TierItemCardProps {
  item: Item;
  tierId: string;
  cardOrientation: "portrait" | "landscape";
  isSelected: boolean;
  isFocused: boolean;
  isTVOS: boolean;
  onToggleSelection?: (itemId: string) => void;
  onItemClick?: (item: Item) => void;
  onItemContextMenu?: (item: Item) => void;
  onDragStart?: (itemId: string) => void;
  onDragEnd?: (itemId: string, x: number, y: number) => void;
  onFocus?: (itemId: string) => void;
}

const TierItemCard: React.FC<TierItemCardProps> = ({
  item,
  tierId,
  cardOrientation,
  isSelected,
  isFocused,
  isTVOS,
  onToggleSelection,
  onItemClick,
  onItemContextMenu,
  onDragStart,
  onDragEnd,
  onFocus,
}) => {
  const cardWidth = cardOrientation === "landscape" ? 180 : 160;

  // Use drag hook for iOS/iPadOS
  const { gesture, animatedStyle: dragStyle } = useDragItem({
    itemId: item.id,
    onDragStart: () => onDragStart?.(item.id),
    onDragEnd: (id, x, y) => onDragEnd?.(id, x, y),
    onTap: () => onItemContextMenu?.(item), // Tap opens tier picker
    enabled: !isTVOS, // Disable gestures on tvOS
  });

  // Focus animation for tvOS
  const focusScale = useSharedValue(1);
  const focusElevation = useSharedValue(0);

  React.useEffect(() => {
    if (isTVOS && isFocused) {
      focusScale.value = withSpring(1.1, reanimatedSprings.snappy);
      focusElevation.value = withTiming(8, { duration: reanimatedTiming.fast });
    } else {
      focusScale.value = withSpring(1, reanimatedSprings.gentle);
      focusElevation.value = withTiming(0, { duration: reanimatedTiming.fast });
    }
  }, [isTVOS, isFocused, focusScale, focusElevation]);

  const focusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
    elevation: focusElevation.value,
    shadowOpacity: focusElevation.value > 0 ? 0.3 : 0,
    shadowRadius: focusElevation.value * 2,
  }));

  const handlePress = useCallback(() => {
    onItemClick?.(item);
  }, [item, onItemClick]);

  const handleLongPress = useCallback(() => {
    onItemContextMenu?.(item);
  }, [item, onItemContextMenu]);

  const handleFocus = useCallback(() => {
    onFocus?.(item.id);
  }, [item.id, onFocus]);

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        { width: cardWidth },
        isSelected && styles.cardSelected,
        isFocused && styles.cardFocused,
        !isTVOS && dragStyle,
        isTVOS && focusStyle,
      ]}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={Layout.springify()}
    >
      {/* Drag handle (iOS only) */}
      {!isTVOS && (
        <View style={styles.dragHandle}>
          <Text style={styles.dragHandleText}>⋮⋮</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        <Text
          style={styles.cardTitle}
          numberOfLines={1}
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

      {/* Selection indicator */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionIcon}>✓</Text>
        </View>
      )}
    </Animated.View>
  );

  // tvOS uses Pressable with focus handling
  if (isTVOS) {
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onFocus={handleFocus}
        focusable={true}
        hasTVPreferredFocus={isFocused}
        testID={`item-card-${item.id}`}
        accessibilityLabel={`${item.name ?? item.id}, ${isSelected ? "selected" : ""}`}
        accessibilityRole="button"
      >
        {cardContent}
      </Pressable>
    );
  }

  // iOS uses GestureDetector for drag + tap
  return (
    <GestureDetector gesture={gesture}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        testID={`item-card-${item.id}`}
        accessibilityLabel={`${item.name ?? item.id}, ${isSelected ? "selected" : ""}`}
        accessibilityRole="button"
      >
        {cardContent}
      </Pressable>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderRadius: metrics.radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    overflow: "hidden",
  },
  labelContainer: {
    width: 80,
    paddingVertical: metrics.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.textOnColor,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  countText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  lockIcon: {
    marginTop: 4,
  },
  lockIconText: {
    fontSize: 12,
    opacity: 0.6,
  },
  itemsContainer: {
    flex: 1,
    padding: metrics.spacing.sm,
    backgroundColor: palette.surfaceSoft,
    minHeight: 56,
  },
  emptyText: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    color: palette.textMuted,
    fontSize: 14,
    paddingVertical: metrics.spacing.md,
  },
  emptyTextHighlight: {
    color: palette.accent,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: metrics.spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: metrics.spacing.sm,
    paddingVertical: metrics.spacing.sm,
    borderRadius: metrics.radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceElevated,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cardSelected: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  cardFocused: {
    borderColor: palette.accent,
    borderWidth: 2,
  },
  dragHandle: {
    paddingRight: metrics.spacing.xs,
  },
  dragHandleText: {
    fontSize: 12,
    color: palette.textMuted,
    opacity: 0.5,
  },
  cardContent: {
    flex: 1,
    minWidth: 0, // Enable text truncation
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: palette.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
  selectionIndicator: {
    marginLeft: metrics.spacing.xs,
  },
  selectionIcon: {
    fontSize: 14,
    color: palette.accent,
    fontWeight: "600",
  },
});

export default TierRow;
