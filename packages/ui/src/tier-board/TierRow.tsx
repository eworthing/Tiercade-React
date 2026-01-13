import React, { useCallback, useMemo, useState } from "react";
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

  // O(1) selection lookup instead of O(n) includes() per item
  const selectedSet = useMemo(() => new Set(selectedItems), [selectedItems]);
  const revealedSet = useMemo(() => new Set(revealedItems), [revealedItems]);

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
  const isHighlighted = isOver || showFileDrop;

  return (
    <section
      ref={setDroppableRef}
      data-testid={`tier-row-${tierId}`}
      role="listbox"
      aria-label={`${label} tier, ${items.length} items`}
      {...dragProps}
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 12,
        borderRadius: 8,
        border: isHighlighted ? "1px solid var(--spectrum-blue-700)" : "1px solid var(--spectrum-gray-300)",
        minHeight: 80,
        transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: isHighlighted ? "scale(1.01)" : "scale(1)",
        boxShadow: isHighlighted ? "0 0 20px rgba(99, 102, 241, 0.3)" : "none",
        backgroundColor: isHighlighted
          ? "rgba(99, 102, 241, 0.1)"
          : isUnranked
          ? "rgba(30, 41, 59, 0.5)"
          : `color-mix(in srgb, ${bgColor}, transparent 85%)`,
        borderLeftWidth: 4,
        borderLeftColor: bgColor,
      }}
    >
      {/* Tier Label */}
      <header style={{
        width: 80,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "12px 8px"
      }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "white",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            minWidth: 40,
            backgroundColor: bgColor
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 10, color: "var(--spectrum-gray-600)", textAlign: "center" }}>
          {items.length} item{items.length === 1 ? "" : "s"}
        </div>
      </header>

      {/* Items Container with sorted items */}
      <div style={{
        flex: 1,
        display: "flex",
        flexWrap: "wrap",
        alignContent: "flex-start",
        gap: 8,
        padding: "8px 12px 8px 0"
      }}>
        {items.length === 0 ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            minHeight: 60,
            color: "var(--spectrum-gray-600)",
            fontSize: 12
          }}>
            {isHighlighted ? (
              <span style={{ color: "var(--spectrum-blue-700)", fontWeight: 500 }}>
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
                isSelected={selectedSet.has(item.id)}
                onClick={onItemClick}
                onDoubleClick={onItemDoubleClick}
                onMediaDrop={onItemMediaDrop}
                scale={itemScale}
                isRevealed={!revealMode || revealedSet.has(item.id)}
                onReveal={onItemReveal}
              />
            ))}
            {/* Drop zone indicator when dragging files over tier */}
            {showFileDrop && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: 8,
                border: "2px dashed var(--spectrum-blue-700)",
                backgroundColor: "rgba(99, 102, 241, 0.1)"
              }}>
                <svg style={{ width: 24, height: 24, color: "var(--spectrum-blue-700)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
// ============================================================================

interface ItemMediaContentProps {
  item: Item;
  isHovered?: boolean;
}

/** Shared name overlay component for media items */
const NameOverlay: React.FC<{ name: string; subtitle?: string; isHovered?: boolean }> = ({ name, subtitle, isHovered }) => (
  <div style={{
    position: "absolute",
    inset: "auto 0 0 0",
    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
    padding: 6,
    borderRadius: "0 0 8px 8px",
    opacity: isHovered ? 1 : 0,
    transition: "opacity 150ms ease"
  }}>
    <p style={{ fontSize: 10, color: "white", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{name}</p>
    {subtitle && (
      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>
    )}
  </div>
);

/** Media type badge component */
const MediaBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    position: "absolute",
    top: 4,
    left: 4,
    padding: "2px 4px",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 4,
    fontSize: 8,
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: 2
  }}>
    {children}
  </div>
);

/** Renders the appropriate media content based on item type */
const ItemMediaContent: React.FC<ItemMediaContentProps> = ({ item, isHovered }) => {
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
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
          loop
          muted
          playsInline
          autoPlay
          draggable={false}
        />
        <MediaBadge>
          <svg style={{ width: 8, height: 8 }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </MediaBadge>
        <NameOverlay name={displayName} subtitle={item.seasonString} isHovered={isHovered} />
      </>
    );
  }

  if (hasAudio) {
    return (
      <>
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 8 }}>
          <svg style={{ width: 32, height: 32, color: "var(--spectrum-blue-700)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p style={{ fontSize: 10, color: "var(--spectrum-gray-700)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", fontWeight: 500 }}>
            {displayName}
          </p>
        </div>
        <MediaBadge>
          <svg style={{ width: 8, height: 8 }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </MediaBadge>
        <audio src={item.audioUrl} style={{ display: "none" }} />
      </>
    );
  }

  if (hasImage) {
    return (
      <>
        <img
          src={item.imageUrl}
          alt={displayName}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
          draggable={false}
        />
        {isGif && (
          <div style={{
            position: "absolute",
            top: 4,
            left: 4,
            padding: "2px 4px",
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 4,
            fontSize: 8,
            color: "white",
            fontWeight: 500
          }}>
            GIF
          </div>
        )}
        <NameOverlay name={displayName} subtitle={item.seasonString} isHovered={isHovered} />
      </>
    );
  }

  // Text-only fallback
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: 4 }}>
      <span style={{ fontSize: 12, color: "var(--spectrum-gray-900)", textAlign: "center", lineHeight: 1.2, fontWeight: 500 }}>
        {displayName}
      </span>
      {item.seasonString && (
        <span style={{ fontSize: 9, color: "var(--spectrum-gray-700)", textAlign: "center", lineHeight: 1.2 }}>
          {item.seasonString}
        </span>
      )}
    </div>
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
  const [isHovered, setIsHovered] = useState(false);

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
    // Modern Spring Physics (Research Doc: 100ms snap, 300ms spring)
    transition: isDragging
      ? "none" // Instant response during drag
      : `${transition}, box-shadow 200ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
    willChange: isDragging ? "transform" : "auto",
    zIndex: isDragging ? 100 : undefined,
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
        style={{
          ...style,
          position: "relative",
          width: 80,
          height: 80,
          borderRadius: 8,
          cursor: "pointer",
          transition: "all 300ms ease",
        }}
        {...attributes}
        {...listeners}
        role="option"
        aria-selected={isSelected}
        data-testid={`item-card-${item.id}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Mystery card back */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #7c3aed, #4338ca)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          transition: "transform 300ms ease"
        }}>
          {/* Question mark */}
          <span style={{
            fontSize: 30,
            fontWeight: 700,
            color: "rgba(255,255,255,0.9)",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 150ms ease"
          }}>
            ?
          </span>
        </div>
        {/* Glow effect on hover */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: 8,
          boxShadow: isHovered ? "0 0 0 2px rgba(167, 139, 250, 0.5)" : "none",
          transition: "box-shadow 150ms ease"
        }} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        outline: "none",
        ...(hasMedia
          ? { width: 80, height: 80 }
          : { padding: "8px 12px" }
        ),
        opacity: isDragging ? 0.3 : 1,
      }}
      {...attributes}
      {...listeners}
      {...dragProps}
      role="option"
      aria-selected={isSelected}
      data-testid={`item-card-${item.id}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          borderRadius: 8,
          backgroundColor: "var(--spectrum-gray-100)",
          boxShadow: isHovered
            ? "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1)"
            : "0 1px 3px rgba(0, 0, 0, 0.1)",
          transform: isHovered ? "scale(1.03)" : "scale(1)",
          transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          border: isSelected
            ? "2px solid var(--spectrum-blue-700)"
            : isFileDragOver
            ? "2px solid var(--spectrum-green-700)"
            : "1px solid var(--spectrum-gray-300)",
        }}
      >
        {/* File drop overlay */}
        {isFileDragOver && (
          <div style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            borderRadius: 8,
            border: "2px dashed var(--spectrum-green-700)"
          }}>
            <svg style={{ width: 24, height: 24, color: "var(--spectrum-green-700)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
        )}

        <ItemMediaContent item={item} isHovered={isHovered} />

        {/* Selection indicator with pop animation */}
        {isSelected && !isFileDragOver && (
          <div style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 20,
            height: 20,
            backgroundColor: "var(--spectrum-blue-700)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)",
            zIndex: 20
          }}>
            <svg
              style={{ width: 12, height: 12, color: "white" }}
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
    </div>
  );
};

// Display names for React DevTools debugging
TierRow.displayName = "TierRow";
SortableTierItem.displayName = "SortableTierItem";

export { SortableTierItem };
