import React from "react";
import type { Item } from "@tiercade/core";
import { useDroppable, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface TierRowProps {
  tierId: string;
  items: Item[];
  tierColor?: string;
  tierLabel?: string;
}

export const TierRow: React.FC<TierRowProps> = ({ tierId, items, tierColor, tierLabel }) => {
  const label = tierLabel ?? (tierId === "unranked" ? "Unranked" : tierId);
  const bgColor = tierColor ?? "#1E293B"; // Default slate-800 fallback

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: tierId,
    data: { tierId }
  });

  return (
    <section
      ref={setDroppableRef}
      data-testid={`tier-row-${tierId}`}
      className="flex items-start gap-3 rounded-lg border border-slate-700 px-3 py-2"
      style={{
        backgroundColor: `${bgColor}20`, // 20% opacity for background
        borderLeftWidth: "4px",
        borderLeftColor: bgColor
      }}
    >
      <header className="w-24 shrink-0 flex flex-col items-start gap-1">
        <div
          className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: bgColor }}
        >
          {label}
        </div>
        <div className="text-[11px] text-slate-500">
          {items.length} item{items.length === 1 ? "" : "s"}
        </div>
      </header>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <SortableTierItem key={item.id} item={item} tierId={tierId} />
        ))}
      </div>
    </section>
  );
};

interface SortableTierItemProps {
  item: Item;
  tierId: string;
}

const SortableTierItem: React.FC<SortableTierItemProps> = ({ item, tierId }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    data: { tierId }
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`item-card-${item.id}`}
      className="cursor-grab rounded-md bg-slate-800/80 border border-slate-700 px-3 py-2 text-xs text-slate-100"
    >
      {item.name ?? item.id}
    </div>
  );
};
