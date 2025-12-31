import React from "react";
import type { Item } from "@tiercade/core";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface TierRowProps {
  tierId: string;
  items: Item[];
  tierColor?: string;
  tierLabel?: string;
  onItemClick?: (item: Item) => void;
  onItemDoubleClick?: (item: Item) => void;
  selectedItems?: string[];
}

export const TierRow: React.FC<TierRowProps> = ({
  tierId,
  items,
  tierColor,
  tierLabel,
  onItemClick,
  onItemDoubleClick,
  selectedItems = [],
}) => {
  const label = tierLabel ?? (tierId === "unranked" ? "Unranked" : tierId);
  const bgColor = tierColor ?? "#1E293B"; // Default slate-800 fallback
  const isUnranked = tierId === "unranked";

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: tierId,
    data: { tierId },
  });

  return (
    <section
      ref={setDroppableRef}
      data-testid={`tier-row-${tierId}`}
      role="listbox"
      aria-label={`${label} tier, ${items.length} items`}
      className={`
        flex items-stretch gap-3 rounded-tier border min-h-[80px]
        transition-colors duration-150
        ${isOver ? "border-accent bg-accent/10" : "border-border"}
        ${isUnranked ? "bg-surface-soft/50" : ""}
      `}
      style={{
        backgroundColor: isOver ? undefined : `${bgColor}15`,
        borderLeftWidth: "4px",
        borderLeftColor: bgColor,
      }}
    >
      {/* Tier Label */}
      <header className="w-20 sm:w-24 shrink-0 flex flex-col items-center justify-center gap-1 py-3 px-2">
        <div
          className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm min-w-[40px]"
          style={{ backgroundColor: bgColor }}
        >
          {label}
        </div>
        <div className="text-2xs text-text-subtle text-center">
          {items.length} item{items.length === 1 ? "" : "s"}
        </div>
      </header>

      {/* Items Container */}
      <div className="flex-1 flex flex-wrap content-start gap-2 py-2 pr-3">
        {items.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full min-h-[60px] text-text-subtle text-xs">
            {isOver ? "Drop here" : "Drag items here"}
          </div>
        ) : (
          items.map((item) => (
            <SortableTierItem
              key={item.id}
              item={item}
              tierId={tierId}
              isSelected={selectedItems.includes(item.id)}
              onClick={onItemClick}
              onDoubleClick={onItemDoubleClick}
            />
          ))
        )}
      </div>
    </section>
  );
};

interface SortableTierItemProps {
  item: Item;
  tierId: string;
  isSelected?: boolean;
  onClick?: (item: Item) => void;
  onDoubleClick?: (item: Item) => void;
}

const SortableTierItem: React.FC<SortableTierItemProps> = ({
  item,
  tierId,
  isSelected = false,
  onClick,
  onDoubleClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { tierId, item },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasImage = !!item.imageUrl;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent triggering when dragging
    if (e.detail === 1) {
      onClick?.(item);
    }
  };

  const handleDoubleClick = () => {
    onDoubleClick?.(item);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="option"
      aria-selected={isSelected}
      data-testid={`item-card-${item.id}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`
        group relative flex flex-col items-center justify-center
        cursor-grab active:cursor-grabbing
        rounded-card bg-surface-raised border shadow-card
        hover:shadow-card-hover hover:border-text-subtle
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
        ${hasImage ? "w-20 h-20 sm:w-24 sm:h-24" : "px-3 py-2"}
        ${isSelected ? "ring-2 ring-accent border-accent" : "border-border"}
        ${isDragging ? "scale-105 shadow-modal z-10" : ""}
      `}
    >
      {hasImage ? (
        <>
          {/* Image */}
          <img
            src={item.imageUrl}
            alt={item.name ?? item.id}
            className="w-full h-full object-cover rounded-card"
            draggable={false}
          />
          {/* Name overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 rounded-b-card opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-2xs text-white text-center truncate font-medium">
              {item.name ?? item.id}
            </p>
          </div>
        </>
      ) : (
        /* Text only */
        <span className="text-xs text-text text-center leading-tight">
          {item.name ?? item.id}
        </span>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export { SortableTierItem };
