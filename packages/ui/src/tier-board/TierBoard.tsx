import React, { useMemo, useState, useOptimistic, startTransition } from "react";
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
      <div className="flex flex-col gap-tier-gap" role="list" data-tier-board>
        {orderedIds.map((tierId) => (
          <SortableContext
            key={tierId}
            items={optimisticTiers[tierId]?.map(i => i.id) ?? []}
            strategy={verticalListSortingStrategy}
            id={tierId} // Context ID helps with collision? No, SortableContext needs items. Explicit container helps.
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
      </DragOverlay>
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

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        rounded-card bg-surface-raised border border-accent shadow-card-lifted
        cursor-grabbing scale-105 rotate-3
        ${hasMedia ? "w-24 h-24" : "px-4 py-3"}
      `}
    >
      {hasVideo ? (
        <>
          <video
            src={item.videoUrl}
            className="w-full h-full object-cover rounded-card"
            loop
            muted
            playsInline
            autoPlay
            draggable={false}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 rounded-b-card">
            <p className="text-2xs text-white text-center truncate font-medium">
              {item.name ?? item.id}
            </p>
          </div>
        </>
      ) : hasAudio ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-2xs text-text-muted text-center truncate w-full font-medium">
            {item.name ?? item.id}
          </p>
        </div>
      ) : hasImage ? (
        <>
          <img
            src={item.imageUrl}
            alt={item.name ?? item.id}
            className="w-full h-full object-cover rounded-card"
            draggable={false}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 rounded-b-card">
            <p className="text-2xs text-white text-center truncate font-medium">
              {item.name ?? item.id}
            </p>
          </div>
        </>
      ) : (
        <span className="text-sm text-text font-medium">
          {item.name ?? item.id}
        </span>
      )}
    </div>
  );
};

export type { FileDropResult };
