/**
 * Drag Item Hook for React Native
 * Uses react-native-gesture-handler + react-native-reanimated for 60fps drag animations
 */
import { useCallback, useRef } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureStateChangeEvent, PanGestureHandlerEventPayload } from "react-native-gesture-handler";
import { reanimatedSprings, reanimatedTiming } from "@tiercade/theme";

export interface DragItemOptions {
  /** Unique ID of the item being dragged */
  itemId: string;
  /** Callback when drag starts */
  onDragStart?: (itemId: string) => void;
  /** Callback during drag with position */
  onDragMove?: (itemId: string, x: number, y: number) => void;
  /** Callback when drag ends */
  onDragEnd?: (itemId: string, x: number, y: number) => void;
  /** Callback when drag is canceled */
  onDragCancel?: (itemId: string) => void;
  /** Callback when item is tapped (not dragged) */
  onTap?: (itemId: string) => void;
  /** Minimum duration for long press to initiate drag (ms) */
  longPressDuration?: number;
  /** Whether drag is enabled */
  enabled?: boolean;
}

export interface DragItemResult {
  /** Composed gesture to attach to GestureDetector */
  gesture: ReturnType<typeof Gesture.Race>;
  /** Animated style to apply to the draggable view */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Whether the item is currently being dragged */
  isDragging: boolean;
  /** Current drag position (x, y) */
  position: { x: number; y: number };
}

/**
 * Hook for making an item draggable with touch gestures
 *
 * Usage:
 * ```tsx
 * const { gesture, animatedStyle, isDragging } = useDragItem({
 *   itemId: item.id,
 *   onDragStart: () => setDragging(true),
 *   onDragEnd: (id, x, y) => handleDrop(id, x, y),
 *   onTap: () => openTierPicker(item),
 * });
 *
 * return (
 *   <GestureDetector gesture={gesture}>
 *     <Animated.View style={animatedStyle}>
 *       <ItemCard item={item} />
 *     </Animated.View>
 *   </GestureDetector>
 * );
 * ```
 */
export function useDragItem({
  itemId,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  onTap,
  longPressDuration = 250,
  enabled = true,
}: DragItemOptions): DragItemResult {
  // Animated values for drag state
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const isDraggingValue = useSharedValue(false);

  // Track drag state for non-animated reads
  const isDraggingRef = useRef(false);
  const positionRef = useRef({ x: 0, y: 0 });

  // Long press gesture to initiate drag
  const longPressGesture = Gesture.LongPress()
    .minDuration(longPressDuration)
    .enabled(enabled)
    .onStart(() => {
      "worklet";
      isDraggingValue.value = true;
      scale.value = withSpring(1.05, reanimatedSprings.snappy);
      opacity.value = 0.9;
      zIndex.value = 1000;

      if (onDragStart) {
        runOnJS(onDragStart)(itemId);
      }
    });

  // Pan gesture for drag movement
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((event) => {
      "worklet";
      if (!isDraggingValue.value) return;

      translateX.value = event.translationX;
      translateY.value = event.translationY;

      if (onDragMove) {
        runOnJS(onDragMove)(itemId, event.absoluteX, event.absoluteY);
      }
    })
    .onEnd((event) => {
      "worklet";
      if (!isDraggingValue.value) return;

      isDraggingValue.value = false;

      // Animate back to original position
      translateX.value = withSpring(0, reanimatedSprings.bouncy);
      translateY.value = withSpring(0, reanimatedSprings.bouncy);
      scale.value = withSpring(1, reanimatedSprings.gentle);
      opacity.value = 1;
      zIndex.value = 0;

      if (onDragEnd) {
        runOnJS(onDragEnd)(itemId, event.absoluteX, event.absoluteY);
      }
    })
    .onFinalize((event, success) => {
      "worklet";
      if (!success && isDraggingValue.value) {
        // Drag was canceled
        isDraggingValue.value = false;
        translateX.value = withSpring(0, reanimatedSprings.gentle);
        translateY.value = withSpring(0, reanimatedSprings.gentle);
        scale.value = withSpring(1, reanimatedSprings.gentle);
        opacity.value = 1;
        zIndex.value = 0;

        if (onDragCancel) {
          runOnJS(onDragCancel)(itemId);
        }
      }
    });

  // Tap gesture for quick selection (tier picker)
  const tapGesture = Gesture.Tap()
    .enabled(enabled)
    .onEnd(() => {
      "worklet";
      if (onTap) {
        runOnJS(onTap)(itemId);
      }
    });

  // Combine gestures: long press + pan for drag, tap for quick action
  // Race ensures only one gesture wins
  const composedGesture = Gesture.Race(
    Gesture.Simultaneous(longPressGesture, panGesture),
    tapGesture
  );

  // Animated style for the draggable view
  const animatedStyle = useAnimatedStyle(() => {
    // Calculate rotation based on drag direction
    const rotation = interpolate(
      translateX.value,
      [-200, 0, 200],
      [-5, 0, 5],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation}deg` },
      ],
      opacity: opacity.value,
      zIndex: zIndex.value,
      // Add shadow when dragging
      shadowColor: isDraggingValue.value ? "#000" : "transparent",
      shadowOffset: { width: 0, height: isDraggingValue.value ? 10 : 0 },
      shadowOpacity: isDraggingValue.value ? 0.3 : 0,
      shadowRadius: isDraggingValue.value ? 20 : 0,
      elevation: isDraggingValue.value ? 10 : 0,
    };
  });

  return {
    gesture: composedGesture,
    animatedStyle,
    isDragging: isDraggingRef.current,
    position: positionRef.current,
  };
}

/**
 * Hook for tracking drop targets during drag
 * Call this in each potential drop target to register its bounds
 */
export interface DropTargetOptions {
  /** Unique ID of this drop target */
  targetId: string;
  /** Whether drops are allowed on this target */
  enabled?: boolean;
  /** Callback when drag hovers over this target */
  onDragEnter?: (itemId: string) => void;
  /** Callback when drag leaves this target */
  onDragLeave?: (itemId: string) => void;
  /** Callback when item is dropped on this target */
  onDrop?: (itemId: string) => void;
}

export interface DropTargetResult {
  /** Whether an item is currently hovering over this target */
  isHovering: boolean;
  /** Callback to check if coordinates are within this target's bounds */
  checkBounds: (x: number, y: number) => boolean;
  /** Method to measure and store this target's bounds */
  measureTarget: () => void;
}

// Global drop target registry for hit testing
const dropTargetRegistry = new Map<string, { bounds: { x: number; y: number; width: number; height: number } }>();

export function useDropTarget({
  targetId,
  enabled = true,
  onDragEnter,
  onDragLeave,
  onDrop,
}: DropTargetOptions): DropTargetResult {
  const isHoveringRef = useRef(false);
  const boundsRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const measureTarget = useCallback(() => {
    // This should be called when the target's layout changes
    // The actual measurement happens in the component using onLayout
  }, []);

  const checkBounds = useCallback(
    (x: number, y: number) => {
      if (!enabled) return false;

      const { x: bx, y: by, width, height } = boundsRef.current;
      const isInside =
        x >= bx && x <= bx + width && y >= by && y <= by + height;

      if (isInside && !isHoveringRef.current) {
        isHoveringRef.current = true;
        onDragEnter?.(targetId);
      } else if (!isInside && isHoveringRef.current) {
        isHoveringRef.current = false;
        onDragLeave?.(targetId);
      }

      return isInside;
    },
    [enabled, targetId, onDragEnter, onDragLeave]
  );

  return {
    isHovering: isHoveringRef.current,
    checkBounds,
    measureTarget,
  };
}
