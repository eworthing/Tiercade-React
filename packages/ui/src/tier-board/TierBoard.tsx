import React, { useMemo, useState, useOptimistic, startTransition } from "react";
import { createPortal } from "react-dom";
import type { Items, Item } from "@tiercade/core";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type Announcements,
  type DragCancelEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { TierRow, type FileDropResult } from "./TierRow";
import { tierListCollisionResult } from "./collision";

export interface TierBoardProps {
  tiers: Items;
  tierOrder: string[];
  onMoveItem?: (itemId: string, targetTierName: string) => void;
  tierColors?: Record<string, string>;
  tierLabels?: Record<string, string>;
  selectedItems?: string[];
  onItemClick?: (item: Item) => void;
  onItemDoubleClick?: (item: Item) => void;
  onFileDrop?: (tierId: string, file: FileDropResult) => void;
  onItemMediaDrop?: (itemId: string, file: FileDropResult) => void;
  /** Item scale for presentation mode (1 = normal) */
  itemScale?: number;
  /** Whether reveal mode is active */
  revealMode?: boolean;
  /** IDs of items that have been revealed */
  revealedItems?: string[];
  /** Callback when an item is revealed */
  onItemReveal?: (itemId: string) => void;
}

export const TierBoard: React.FC<TierBoardProps> = ({
  tiers,
  tierOrder,
  onMoveItem,
  tierColors = {},
  tierLabels = {},
  selectedItems = [],
  onItemClick,
  onItemDoubleClick,
  onFileDrop,
  onItemMediaDrop,
  itemScale = 1,
  revealMode = false,
  revealedItems = [],
  onItemReveal,
}) => {
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const orderedIds = useMemo(() => [...tierOrder, "unranked"], [tierOrder]);

  // React 19 Optimistic UI
  // Allows immediate UI updates while the parent async action processes
  const [optimisticTiers, addOptimisticUpdate] = useOptimistic(
    tiers,
    (currentTiers: Items, update: { itemId: string; fromTierId: string; toTierId: string }) => {
      const { itemId, fromTierId, toTierId } = update;

      // If moving to same tier, do nothing (or reorder if index logic was passed)
      if (fromTierId === toTierId) return currentTiers;

      const newTiers = { ...currentTiers };

      // Find item
      const itemToMove = newTiers[fromTierId]?.find(i => i.id === itemId);
      if (!itemToMove) return currentTiers;

      // Remove from old
      newTiers[fromTierId] = newTiers[fromTierId].filter(i => i.id !== itemId);

      // Add to new
      newTiers[toTierId] = [...(newTiers[toTierId] || []), itemToMove];

      return newTiers;
    }
  );

  // All items flattened for finding during drag
  // Use optimistic tiers to prevent jitter during sync
  const allItems = useMemo(() => {
    return Object.values(optimisticTiers).flat();
  }, [optimisticTiers]);

  // O(1) lookup map for drag operations
  const itemMap = useMemo(() => {
    return new Map(allItems.map(item => [item.id, item]));
  }, [allItems]);

  // Optimized Sensor Configuration (Research-Based)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Instant on desktop but prevents accidental clicks
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,      // 200ms long-press for mobile (prevents scroll conflict)
        tolerance: 8,    // 8px movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Accessibility announcements
  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const item = itemMap.get(String(active.id));
      return `Picked up ${item?.name ?? active.id}. Use arrow keys to move between tiers.`;
    },
    onDragOver: ({ over }) => {
      if (!over) return "";
      const tierName = tierLabels[String(over.id)] ?? over.id;
      return `Over ${tierName} tier`;
    },
    onDragEnd: ({ active, over }) => {
      const item = itemMap.get(String(active.id));
      if (!over) return `Cancelled dragging ${item?.name ?? active.id}`;
      // Logic to resolve tier name from item or tier collision
      let tierName = over.id;
      if (over.data.current?.tierId) {
        tierName = tierLabels[String(over.data.current.tierId)] ?? over.data.current.tierId;
      }
      return `Dropped ${item?.name ?? active.id} in ${tierName} tier`;
    },
    onDragCancel: ({ active }) => {
      const item = itemMap.get(String(active.id));
      return `Cancelled dragging ${item?.name ?? active.id}`;
    },
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = itemMap.get(String(event.active.id));
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);

    if (!onMoveItem) return;
    const { active, over } = event;

    if (!over) return;

    // Resolve IDs
    const activeId = String(active.id);
    const item = itemMap.get(activeId);

    // Determine target tier
    // If we dropped on a Tier container: over.id is the tierId
    // If we dropped on an Item: over.data.current.tierId is the tierId
    const overTierId = String(over.data.current?.tierId ?? over.id);

    // Find source tier for optimistic update
    const sourceTierId = Object.keys(optimisticTiers).find(
      key => optimisticTiers[key]?.some(i => i.id === activeId)
    );

    if (!sourceTierId || sourceTierId === overTierId) return;

    // 1. Optimistic Update (Immediate Feedback)
    startTransition(() => {
      addOptimisticUpdate({
        itemId: activeId,
        fromTierId: sourceTierId,
        toTierId: overTierId
      });
    });

    // 2. Actual Data Update (Propagate to parent/server)
    onMoveItem(activeId, overTierId);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={tierListCollisionResult}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To pick up an item, press Space or Enter. Use arrow keys to move between tiers. Press Space or Enter again to drop the item, or press Escape to cancel.",
        },
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }} role="list" data-tier-board>
        {orderedIds.map((tierId) => (
          <SortableContext
            key={tierId}
            items={optimisticTiers[tierId]?.map(i => i.id) ?? []}
            strategy={verticalListSortingStrategy}
            id={tierId}
          >
            <TierRow
              tierId={tierId}
              items={optimisticTiers[tierId] ?? []}
              tierColor={tierColors[tierId]}
              tierLabel={tierLabels[tierId]}
              selectedItems={selectedItems}
              onItemClick={onItemClick}
              onItemDoubleClick={onItemDoubleClick}
              onFileDrop={onFileDrop}
              onItemMediaDrop={onItemMediaDrop}
              itemScale={itemScale}
              revealMode={revealMode}
              revealedItems={revealedItems}
              onItemReveal={onItemReveal}
            />
          </SortableContext>
        ))}
      </div>

      {/* Drag Overlay - Shows a preview of the dragged item */}
      {typeof document !== 'undefined' && createPortal(
        <DragOverlay dropAnimation={{
          duration: 300,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)", // Spring Drop (Research Doc)
          sideEffects: ({ active }) => {
            active.node.animate([
              { transform: 'scale(1.05)' },
              { transform: 'scale(0.98)' },
              { transform: 'scale(1)' },
            ], {
              duration: 300,
              easing: "cubic-bezier(0.23, 1, 0.32, 1)", // Spring Thud
            });
            // Return cleanup function (empty) to satisfy stricter types if needed, or just undefined
            return () => { };
          }
        }}>
          {activeItem ? (
            <DragPreview item={activeItem} />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};

interface DragPreviewProps {
  item: Item;
}

const DragPreview: React.FC<DragPreviewProps> = ({ item }) => {
  const hasImage = !!item.imageUrl;
  const hasVideo = !!item.videoUrl;
  const hasAudio = !!item.audioUrl;
  const hasMedia = hasImage || hasVideo || hasAudio;

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "var(--spectrum-gray-100)",
    border: "1px solid var(--spectrum-blue-700)",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1)",
    cursor: "grabbing",
    ...(hasMedia
      ? { width: 80, height: 80 }
      : { padding: "8px 12px" }
    ),
  };

  return (
    <div style={containerStyle}>
      {hasVideo ? (
        <>
          <video
            src={item.videoUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
            loop
            muted
            playsInline
            autoPlay
            draggable={false}
          />
          <div style={{
            position: "absolute",
            inset: "auto 0 0 0",
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            padding: 6,
            borderRadius: "0 0 8px 8px"
          }}>
            <p style={{ fontSize: 10, color: "white", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
              {item.name ?? item.id}
            </p>
          </div>
        </>
      ) : hasAudio ? (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 8 }}>
          <svg style={{ width: 32, height: 32, color: "var(--spectrum-blue-700)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p style={{ fontSize: 10, color: "var(--spectrum-gray-700)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", fontWeight: 500 }}>
            {item.name ?? item.id}
          </p>
        </div>
      ) : hasImage ? (
        <>
          <img
            src={item.imageUrl}
            alt={item.name ?? item.id}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
            draggable={false}
          />
          <div style={{
            position: "absolute",
            inset: "auto 0 0 0",
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            padding: 6,
            borderRadius: "0 0 8px 8px"
          }}>
            <p style={{ fontSize: 10, color: "white", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
              {item.name ?? item.id}
            </p>
          </div>
        </>
      ) : (
        <span style={{ fontSize: 14, color: "var(--spectrum-gray-900)", fontWeight: 500 }}>
          {item.name ?? item.id}
        </span>
      )}
    </div>
  );
};

export type { FileDropResult };
