import React, { useMemo } from "react";
import type { Items } from "@tiercade/core";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import { TierRow } from "./TierRow";

export interface TierBoardProps {
  tiers: Items;
  tierOrder: string[];
  onMoveItem?: (itemId: string, targetTierName: string) => void;
  tierColors?: Record<string, string>;
  tierLabels?: Record<string, string>;
}

export const TierBoard: React.FC<TierBoardProps> = ({
  tiers,
  tierOrder,
  onMoveItem,
  tierColors = {},
  tierLabels = {}
}) => {
  const orderedIds = useMemo(() => [...tierOrder, "unranked"], [tierOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onMoveItem) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overTier = String(over.data.current?.tierId ?? over.id);
    onMoveItem(activeId, overTier);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {orderedIds.map((tierId) => (
            <TierRow
              key={tierId}
              tierId={tierId}
              items={tiers[tierId] ?? []}
              tierColor={tierColors[tierId]}
              tierLabel={tierLabels[tierId]}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
