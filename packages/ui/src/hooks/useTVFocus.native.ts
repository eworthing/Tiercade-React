/**
 * tvOS Focus Management Hook
 * Handles Siri Remote navigation and focus events for Apple TV
 */
import { useEffect, useRef, useCallback, useState } from "react";
import { Platform, TVEventHandler, findNodeHandle, View } from "react-native";

export type TVDirection = "up" | "down" | "left" | "right";

export interface TVFocusOptions {
  /** Callback when select button is pressed */
  onSelect?: () => void;
  /** Callback when directional input is received */
  onMove?: (direction: TVDirection) => void;
  /** Callback when menu/back button is pressed */
  onBack?: () => void;
  /** Callback when play/pause button is pressed */
  onPlayPause?: () => void;
  /** Whether this component should receive TV events */
  enabled?: boolean;
}

export interface TVFocusResult {
  /** Ref to attach to the focusable View */
  ref: React.RefObject<View>;
  /** Whether TV mode is active */
  isTVOS: boolean;
  /** Current focus state (requires separate focus tracking) */
  hasFocus: boolean;
  /** Set focus state manually */
  setHasFocus: (value: boolean) => void;
}

/**
 * Hook for handling tvOS remote events
 *
 * Usage:
 * ```tsx
 * const { ref, isTVOS, hasFocus } = useTVFocus({
 *   onSelect: () => openTierPicker(),
 *   onMove: (dir) => navigateToNextItem(dir),
 *   onBack: () => dismiss(),
 * });
 *
 * return <View ref={ref} focusable={isTVOS} hasTVPreferredFocus={hasFocus} />;
 * ```
 */
export function useTVFocus({
  onSelect,
  onMove,
  onBack,
  onPlayPause,
  enabled = true,
}: TVFocusOptions = {}): TVFocusResult {
  const viewRef = useRef<View>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const isTVOS = Platform.isTV;

  useEffect(() => {
    // Only enable TV event handling on tvOS
    if (!isTVOS || !enabled) {
      return;
    }

    let tvEventHandler: TVEventHandler | null = null;

    const setupHandler = () => {
      tvEventHandler = new TVEventHandler();
      const node = findNodeHandle(viewRef.current);

      if (!node) {
        return;
      }

      tvEventHandler.enable(viewRef.current, (_cmp, evt) => {
        if (!evt) return;

        switch (evt.eventType) {
          case "select":
            onSelect?.();
            break;
          case "up":
            onMove?.("up");
            break;
          case "down":
            onMove?.("down");
            break;
          case "left":
            onMove?.("left");
            break;
          case "right":
            onMove?.("right");
            break;
          case "menu":
            onBack?.();
            break;
          case "playPause":
            onPlayPause?.();
            break;
        }
      });
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(setupHandler, 100);

    return () => {
      clearTimeout(timer);
      if (tvEventHandler) {
        tvEventHandler.disable();
      }
    };
  }, [isTVOS, enabled, onSelect, onMove, onBack, onPlayPause]);

  return {
    ref: viewRef,
    isTVOS,
    hasFocus,
    setHasFocus,
  };
}

/**
 * Hook for managing focus within a list of items
 * Provides arrow key navigation between items
 */
export interface TVListFocusOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  initialFocusId?: string;
  /** Number of items per row (for grid navigation) */
  columns?: number;
  onSelect?: (item: T) => void;
  onBack?: () => void;
}

export interface TVListFocusResult<T> {
  focusedId: string | null;
  focusedItem: T | null;
  setFocusedId: (id: string | null) => void;
  handleMove: (direction: TVDirection) => void;
  handleSelect: () => void;
  isTVOS: boolean;
}

export function useTVListFocus<T>({
  items,
  getItemId,
  initialFocusId,
  columns = 1,
  onSelect,
  onBack,
}: TVListFocusOptions<T>): TVListFocusResult<T> {
  const [focusedId, setFocusedId] = useState<string | null>(
    initialFocusId ?? (items.length > 0 ? getItemId(items[0]) : null)
  );
  const isTVOS = Platform.isTV;

  const focusedItem = items.find((item) => getItemId(item) === focusedId) ?? null;
  const focusedIndex = items.findIndex((item) => getItemId(item) === focusedId);

  const handleMove = useCallback(
    (direction: TVDirection) => {
      if (items.length === 0) return;

      let newIndex = focusedIndex;

      switch (direction) {
        case "up":
          newIndex = Math.max(0, focusedIndex - columns);
          break;
        case "down":
          newIndex = Math.min(items.length - 1, focusedIndex + columns);
          break;
        case "left":
          if (focusedIndex % columns > 0) {
            newIndex = focusedIndex - 1;
          }
          break;
        case "right":
          if (focusedIndex % columns < columns - 1 && focusedIndex < items.length - 1) {
            newIndex = focusedIndex + 1;
          }
          break;
      }

      if (newIndex !== focusedIndex && newIndex >= 0 && newIndex < items.length) {
        setFocusedId(getItemId(items[newIndex]));
      }
    },
    [items, focusedIndex, columns, getItemId]
  );

  const handleSelect = useCallback(() => {
    if (focusedItem && onSelect) {
      onSelect(focusedItem);
    }
  }, [focusedItem, onSelect]);

  // Set up TV event handling
  useTVFocus({
    onMove: handleMove,
    onSelect: handleSelect,
    onBack,
    enabled: isTVOS,
  });

  return {
    focusedId,
    focusedItem,
    setFocusedId,
    handleMove,
    handleSelect,
    isTVOS,
  };
}
