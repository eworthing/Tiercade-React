import React, { useCallback, useMemo, useRef, useState } from "react";
import type { Item } from "@tiercade/core";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFileDrag, type FileDropResult } from "../hooks";
import { Image } from "@react-spectrum/s2";

/** Default tier background color when no theme color is provided */
const DEFAULT_TIER_BACKGROUND = "#48485a";

// Re-export FileDropResult for consumers
export type { FileDropResult };

// ============================================================================
// Helpers
// ============================================================================

/** Graduated bleed intensity — higher tiers glow more */
function getBleedIntensity(tierId: string): number {
  const intensities: Record<string, number> = {
    S: 0.18, A: 0.14, B: 0.11, C: 0.09, D: 0.07, F: 0.05,
  };
  return intensities[tierId.toUpperCase()] ?? 0.08;
}

/** Convert 0-1 opacity to 2-char hex string */
function toHex(opacity: number): string {
  return Math.round(opacity * 255).toString(16).padStart(2, "0");
}

// ============================================================================
// TierRow
// ============================================================================

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
  /** Row index for staggered entrance animation */
  animationIndex?: number;
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
  animationIndex,
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

  // Only animate on initial mount, not on re-renders
  const hasAnimated = useRef(false);
  const shouldAnimate = typeof animationIndex === "number" && !hasAnimated.current;
  if (shouldAnimate) hasAnimated.current = true;

  // Graduated color bleed
  const bleedIntensity = isUnranked ? 0 : getBleedIntensity(tierId);
  const bleedFade = bleedIntensity * 0.33;

  const rowBackground = isHighlighted
    ? `linear-gradient(90deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 40%, transparent 70%)`
    : isUnranked
    ? "#0f1019"
    : `linear-gradient(90deg, ${bgColor}${toHex(bleedIntensity)} 0%, ${bgColor}${toHex(bleedFade)} 30%, #0f1019 60%)`;

  return (
    <section
      ref={setDroppableRef}
      data-testid={`tier-row-${tierId}`}
      role="listbox"
      aria-label={`${label} tier, ${items.length} items`}
      {...dragProps}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        borderRadius: 12,
        minHeight: 100,
        overflow: "hidden",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        transform: isHighlighted ? "scale(1.005)" : "scale(1)",
        background: rowBackground,
        border: isHighlighted
          ? "1px solid rgba(56,189,248,0.3)"
          : `1px solid #1a1b2a`,
        borderLeft: `3px solid ${bgColor}`,
        boxShadow: isHighlighted
          ? `0 0 20px ${bgColor}15, 0 4px 12px rgba(0,0,0,0.2)`
          : "none",
        ...(shouldAnimate ? {
          animation: "tierRowEnter 300ms ease-out both",
          animationDelay: `${animationIndex * 50}ms`,
        } : {}),
      }}
    >
      {/* Tier Label Sidebar */}
      <header style={{
        width: 96,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "12px 8px",
        position: "relative",
        background: `${bgColor}15`,
        borderRight: `1px solid ${bgColor}25`,
      }}>
        {/* Tier badge */}
        <div style={{
          padding: "8px 14px",
          borderRadius: 8,
          background: bgColor,
          boxShadow: `0 0 16px ${bgColor}40, 0 2px 8px rgba(0,0,0,0.3)`,
        }}>
          <span style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: "#0a0a12",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}>
            {label}
          </span>
        </div>

        {/* Item count */}
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
          color: "#8b90a0",
        }}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </header>

      {/* Items Container */}
      <div style={{
        flex: 1,
        display: "flex",
        flexWrap: "wrap",
        alignContent: "flex-start",
        gap: 10,
        padding: "12px 14px",
        minHeight: 76,
      }}>
        {items.length === 0 ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            minHeight: 60,
          }}>
            {isHighlighted ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  border: "2px dashed rgba(56, 189, 248, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(56, 189, 248, 0.1)",
                }}>
                  <svg width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="rgba(56, 189, 248, 0.8)">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(56, 189, 248, 0.9)",
                }}>
                  {showFileDrop ? "Drop file here" : "Drop here"}
                </span>
              </div>
            ) : (
              <span style={{
                fontSize: 13,
                fontStyle: "italic",
                color: "#4a4f65",
              }}>
                Drop items here to rank
              </span>
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
                borderRadius: 10,
                border: "2px dashed rgba(56, 189, 248, 0.6)",
                background: "rgba(56, 189, 248, 0.1)",
              }}>
                <svg width={26} height={26} fill="none" viewBox="0 0 24 24" stroke="rgba(56, 189, 248, 0.8)">
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

/** Shared name overlay component for media items — semi-visible at rest */
const NameOverlay: React.FC<{ name: string; subtitle?: string; isHovered?: boolean }> = ({ name, subtitle, isHovered }) => (
  <div style={{
    position: "absolute",
    inset: "auto 0 0 0",
    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
    padding: "16px 6px 6px",
    borderRadius: "0 0 8px 8px",
    opacity: isHovered ? 1 : 0.6,
    transform: isHovered ? "translateY(0)" : "translateY(0)",
    transition: "opacity 150ms ease",
  }}>
    <p style={{
      fontSize: 11,
      fontWeight: 600,
      color: "white",
      textAlign: "center",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}>{name}</p>
    {subtitle && (
      <p style={{
        fontSize: 9,
        color: "rgba(255,255,255,0.6)",
        textAlign: "center",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        marginTop: 2,
      }}>{subtitle}</p>
    )}
  </div>
);

/** Media type badge component */
const MediaBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    position: "absolute",
    top: 4,
    left: 4,
    padding: "2px 6px",
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: 3,
    textTransform: "uppercase",
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
          <svg width={8} height={8} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          VID
        </MediaBadge>
        <NameOverlay name={displayName} subtitle={item.seasonString} isHovered={isHovered} />
      </>
    );
  }

  if (hasAudio) {
    return (
      <>
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          padding: 8,
          background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
          borderRadius: 8,
        }}>
          <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p style={{
            fontSize: 9,
            fontWeight: 600,
            color: "white",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
          }}>
            {displayName}
          </p>
        </div>
        <MediaBadge>
          <svg width={8} height={8} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          AUDIO
        </MediaBadge>
        <audio src={item.audioUrl} style={{ display: "none" }} />
      </>
    );
  }

  if (hasImage) {
    return (
      <>
        <Image
          src={item.imageUrl}
          alt={displayName}
          UNSAFE_style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
        />
        {isGif && (
          <MediaBadge>GIF</MediaBadge>
        )}
        <NameOverlay name={displayName} subtitle={item.seasonString} isHovered={isHovered} />
      </>
    );
  }

  // Text-only fallback
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      padding: "8px 12px",
      background: "#15161f",
      borderRadius: 8,
      width: "100%",
      height: "100%",
    }}>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: "white",
        textAlign: "center",
        lineHeight: 1.2,
      }}>
        {displayName}
      </span>
      {item.seasonString && (
        <span style={{
          fontSize: 9,
          color: "#8b90a0",
          textAlign: "center",
        }}>
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
    transition: isDragging ? "none" : transition,
    willChange: isDragging ? "transform" : "auto",
    zIndex: isDragging ? 100 : undefined,
    transformOrigin: "center center",
  };

  const hasMedia = !!(item.imageUrl || item.videoUrl || item.audioUrl);

  const handleClick = (e: React.MouseEvent) => {
    if (e.detail === 1) {
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
          borderRadius: 10,
          cursor: "pointer",
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
        {/* Mystery card */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transform: isHovered ? "scale(1.03)" : "scale(1)",
          transition: "all 180ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: isHovered
            ? "0 8px 20px rgba(99, 102, 241, 0.4)"
            : "0 2px 8px rgba(0, 0, 0, 0.3)",
        }}>
          {/* Shimmer effect */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
            animation: "shimmer 2s infinite",
          }} />
          {/* Question mark */}
          <span style={{
            fontSize: 28,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: "white",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            ?
          </span>
        </div>
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
          borderRadius: 10,
          background: "#15161f",
          border: isSelected
            ? "none"
            : isHovered
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid #1a1b2a",
          boxShadow: isSelected
            ? "0 0 0 2px #00f0ff, 0 0 12px rgba(0, 240, 255, 0.2)"
            : isHovered
            ? "0 8px 20px rgba(0, 0, 0, 0.4)"
            : "none",
          transform: isHovered && !isDragging ? "translateY(-2px) scale(1.02)" : "translateY(0)",
          transition: "transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 180ms ease, border-color 180ms ease",
          overflow: "hidden",
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
            background: "rgba(56, 189, 248, 0.2)",
            borderRadius: 10,
            border: "2px dashed #38bdf8",
          }}>
            <svg width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="#38bdf8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
        )}

        <ItemMediaContent item={item} isHovered={isHovered} />

        {/* Selection indicator */}
        {isSelected && !isFileDragOver && (
          <div style={{
            position: "absolute",
            top: -3,
            right: -3,
            width: 20,
            height: 20,
            background: "#00f0ff",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 10px rgba(0, 240, 255, 0.4)",
            zIndex: 20,
            border: "2px solid #0a0b14",
          }}>
            <svg
              width={11}
              height={11}
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
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
