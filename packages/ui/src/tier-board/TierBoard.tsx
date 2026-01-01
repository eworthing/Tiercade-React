import React, { useMemo, useState } from "react";
import type { Items, Item } from "@tiercade/core";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type Announcements,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { TierRow, type FileDropResult } from "./TierRow";

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

  // All items flattened for finding during drag
  const allItems = useMemo(() => {
    return Object.values(tiers).flat();
  }, [tiers]);

  // O(1) lookup map for drag operations (instead of O(n) find() calls)
  const itemMap = useMemo(() => {
    return new Map(allItems.map(item => [item.id, item]));
  }, [allItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag (prevents accidental drags on click)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Accessibility announcements for screen readers
  // Uses itemMap for O(1) lookups instead of O(n) find() calls
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
      const tierName = tierLabels[String(over.data.current?.tierId ?? over.id)] ?? over.id;
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
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overTier = String(over.data.current?.tierId ?? over.id);
    onMoveItem(activeId, overTier);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
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
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-tier-gap" role="list" data-tier-board>
          {orderedIds.map((tierId) => (
            <TierRow
              key={tierId}
              tierId={tierId}
              items={tiers[tierId] ?? []}
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
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - Shows a preview of the dragged item */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
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
        rounded-card bg-surface-raised border border-accent shadow-modal
        cursor-grabbing scale-105
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
