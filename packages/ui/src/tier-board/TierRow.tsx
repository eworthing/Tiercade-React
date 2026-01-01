import React, { useCallback } from "react";
import type { Item } from "@tiercade/core";
import { STAGGER } from "@tiercade/theme";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFileDrag, type FileDropResult } from "../hooks";

/** Default tier background color when no theme color is provided */
const DEFAULT_TIER_BACKGROUND = "#1E293B";

// Re-export FileDropResult for consumers
export type { FileDropResult };

export interface TierRowProps {
  tierId: string;
  items: Item[];
  tierColor?: string;
  tierLabel?: string;
  onItemClick?: (item: Item) => void;
  onItemDoubleClick?: (item: Item) => void;
  selectedItems?: string[];
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

export const TierRow: React.FC<TierRowProps> = ({
  tierId,
  items,
  tierColor,
  tierLabel,
  onItemClick,
  onItemDoubleClick,
  selectedItems = [],
  onFileDrop,
  onItemMediaDrop,
  itemScale = 1,
  revealMode = false,
  revealedItems = [],
  onItemReveal,
}) => {
  const label = tierLabel ?? (tierId === "unranked" ? "Unranked" : tierId);
  const bgColor = tierColor ?? DEFAULT_TIER_BACKGROUND;
  const isUnranked = tierId === "unranked";

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: tierId,
    data: { tierId },
  });

  const handleFileDrop = useCallback(
    (result: FileDropResult) => onFileDrop?.(tierId, result),
    [onFileDrop, tierId]
  );

  const { isFileDragOver, dragProps } = useFileDrag({
    onDrop: handleFileDrop,
    enabled: !!onFileDrop,
  });

  const showFileDrop = isFileDragOver && onFileDrop;

  return (
    <section
      ref={setDroppableRef}
      data-testid={`tier-row-${tierId}`}
      role="listbox"
      aria-label={`${label} tier, ${items.length} items`}
      {...dragProps}
      className={`
        flex items-stretch gap-3 rounded-tier border min-h-[80px]
        transition-all duration-300 ease-spring transform-gpu
        ${isOver || showFileDrop ? "border-accent bg-accent/10 scale-[1.01] shadow-glow-accent" : "border-border"}
        ${isUnranked ? "bg-surface-soft/50" : ""}
      `}
      style={{
        backgroundColor: isOver || showFileDrop ? undefined : `${bgColor}15`,
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

      {/* Items Container with staggered animations */}
      <div className="flex-1 flex flex-wrap content-start gap-2 py-2 pr-3 perspective-container">
        {items.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full min-h-[60px] text-text-subtle text-xs animate-pulse-soft">
            {isOver || showFileDrop ? (
              <span className="text-accent font-medium animate-bounce-in">
                {showFileDrop ? "Drop file to add item" : "Drop here"}
              </span>
            ) : (
              "Drag items or files here"
            )}
          </div>
        ) : (
          <>
            {items.map((item, index) => (
              <SortableTierItem
                key={item.id}
                item={item}
                tierId={tierId}
                index={index}
                isSelected={selectedItems.includes(item.id)}
                onClick={onItemClick}
                onDoubleClick={onItemDoubleClick}
                onMediaDrop={onItemMediaDrop}
                scale={itemScale}
                isRevealed={!revealMode || revealedItems.includes(item.id)}
                onReveal={onItemReveal}
              />
            ))}
            {/* Drop zone indicator when dragging files over tier */}
            {showFileDrop && (
              <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-card border-2 border-dashed border-accent bg-accent/10 animate-pulse">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

// ============================================================================
// Item Media Content
// Extracted to eliminate complex ternary chain and improve readability
// ============================================================================

interface ItemMediaContentProps {
  item: Item;
}

/** Shared name overlay component for media items */
const NameOverlay: React.FC<{ name: string }> = ({ name }) => (
  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 rounded-b-card opacity-0 group-hover:opacity-100 transition-opacity">
    <p className="text-2xs text-white text-center truncate font-medium">{name}</p>
  </div>
);

/** Media type badge component */
const MediaBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[8px] text-white flex items-center gap-0.5">
    {children}
  </div>
);

/** Renders the appropriate media content based on item type */
const ItemMediaContent: React.FC<ItemMediaContentProps> = ({ item }) => {
  const displayName = item.name ?? item.id;
  const hasVideo = !!item.videoUrl;
  const hasAudio = !!item.audioUrl;
  const hasImage = !!item.imageUrl;
  const isGif = item.mediaType === "gif";

  if (hasVideo) {
    return (
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
        <MediaBadge>
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </MediaBadge>
        <NameOverlay name={displayName} />
      </>
    );
  }

  if (hasAudio) {
    return (
      <>
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-2xs text-text-muted text-center truncate w-full font-medium">
            {displayName}
          </p>
        </div>
        <MediaBadge>
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </MediaBadge>
        <audio src={item.audioUrl} className="hidden" />
      </>
    );
  }

  if (hasImage) {
    return (
      <>
        <img
          src={item.imageUrl}
          alt={displayName}
          className="w-full h-full object-cover rounded-card"
          draggable={false}
        />
        {isGif && (
          <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[8px] text-white font-medium">
            GIF
          </div>
        )}
        <NameOverlay name={displayName} />
      </>
    );
  }

  // Text-only fallback
  return (
    <span className="text-xs text-text text-center leading-tight">
      {displayName}
    </span>
  );
};

NameOverlay.displayName = "NameOverlay";
MediaBadge.displayName = "MediaBadge";
ItemMediaContent.displayName = "ItemMediaContent";

// ============================================================================
// SortableTierItem Component
// ============================================================================

interface SortableTierItemProps {
  item: Item;
  index?: number;
  tierId: string;
  isSelected?: boolean;
  onClick?: (item: Item) => void;
  onDoubleClick?: (item: Item) => void;
  onMediaDrop?: (itemId: string, file: FileDropResult) => void;
  /** Scale factor for presentation mode */
  scale?: number;
  /** Whether this item has been revealed (in reveal mode) */
  isRevealed?: boolean;
  /** Callback when item is clicked to reveal */
  onReveal?: (itemId: string) => void;
}

const SortableTierItem: React.FC<SortableTierItemProps> = ({
  item,
  tierId,
  index = 0,
  isSelected = false,
  onClick,
  onDoubleClick,
  onMediaDrop,
  scale = 1,
  isRevealed = true,
  onReveal,
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

  const handleMediaDrop = useCallback(
    (result: FileDropResult) => onMediaDrop?.(item.id, result),
    [onMediaDrop, item.id]
  );

  const { isFileDragOver, dragProps } = useFileDrag({
    onDrop: handleMediaDrop,
    enabled: !!onMediaDrop,
  });

  // 3D perspective transform with GPU acceleration
  const baseTransform = CSS.Transform.toString(transform);
  const scaleTransform = scale !== 1 ? ` scale(${scale})` : "";
  const dragTransform = isDragging
    ? `${baseTransform} perspective(1000px) rotateX(3deg) rotateY(-3deg)${scaleTransform}`
    : `${baseTransform || ""}${scaleTransform}`;

  const style: React.CSSProperties = {
    transform: dragTransform || undefined,
    transition: isDragging
      ? "box-shadow 200ms cubic-bezier(0.34, 1.56, 0.64, 1)"
      : `${transition}, box-shadow 200ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
    willChange: isDragging ? "transform" : "auto",
    animationDelay: `${index * STAGGER.FAST}ms`,
    transformOrigin: "center center",
  };

  const hasMedia = !!(item.imageUrl || item.videoUrl || item.audioUrl);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent triggering when dragging
    if (e.detail === 1) {
      // If not revealed, reveal it first
      if (!isRevealed) {
        onReveal?.(item.id);
      } else {
        onClick?.(item);
      }
    }
  };

  const handleDoubleClick = () => {
    onDoubleClick?.(item);
  };

  // Mystery card for unrevealed items
  if (!isRevealed) {
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
        className="
          relative w-20 h-20 sm:w-24 sm:h-24 rounded-card cursor-pointer
          transition-all duration-300 hover:scale-105 group
          opacity-0 animate-stagger-scale
        "
      >
        {/* Mystery card back */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-card flex items-center justify-center overflow-hidden">
          {/* Animated pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_0%,transparent_50%)] animate-pulse" />
          </div>
          {/* Question mark */}
          <span className="text-3xl font-bold text-white/90 group-hover:scale-110 transition-transform">
            ?
          </span>
        </div>
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-card ring-2 ring-transparent group-hover:ring-purple-400/50 transition-all" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      {...dragProps}
      role="option"
      aria-selected={isSelected}
      data-testid={`item-card-${item.id}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`
        group relative flex flex-col items-center justify-center
        cursor-grab active:cursor-grabbing
        rounded-card bg-surface-raised border shadow-card
        transform-gpu
        hover:shadow-card-hover hover:border-text-subtle hover:scale-[1.03]
        active:scale-[0.98]
        transition-all duration-200 ease-spring
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface
        opacity-0 animate-stagger-scale
        ${hasMedia ? "w-20 h-20 sm:w-24 sm:h-24" : "px-3 py-2"}
        ${isSelected ? "ring-2 ring-accent border-accent shadow-glow-accent" : "border-border"}
        ${isDragging ? "scale-110 shadow-card-lifted z-50" : ""}
        ${isFileDragOver ? "ring-2 ring-success border-success shadow-glow-accent scale-105" : ""}
      `}
    >
      {/* File drop overlay */}
      {isFileDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-success/20 rounded-card border-2 border-dashed border-success">
          <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
      )}

      <ItemMediaContent item={item} />

      {/* Selection indicator with pop animation */}
      {isSelected && !isFileDragOver && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-glow-accent animate-pop">
          <svg
            className="w-3 h-3 text-white"
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

// Display names for React DevTools debugging
TierRow.displayName = "TierRow";
SortableTierItem.displayName = "SortableTierItem";

export { SortableTierItem };
