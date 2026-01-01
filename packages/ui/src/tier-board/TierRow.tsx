import React, { useState, useCallback } from "react";
import type { Item, MediaType } from "@tiercade/core";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// File processing utilities
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/webm"];

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB

function getMediaTypeFromMime(mimeType: string): MediaType | null {
  if (mimeType === "image/gif") return "gif";
  if (ACCEPTED_IMAGE_TYPES.includes(mimeType)) return "image";
  if (ACCEPTED_VIDEO_TYPES.includes(mimeType)) return "video";
  if (ACCEPTED_AUDIO_TYPES.includes(mimeType)) return "audio";
  return null;
}

function isValidFileType(file: File): boolean {
  return (
    ACCEPTED_IMAGE_TYPES.includes(file.type) ||
    ACCEPTED_VIDEO_TYPES.includes(file.type) ||
    ACCEPTED_AUDIO_TYPES.includes(file.type)
  );
}

function isValidFileSize(file: File): boolean {
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");
  const maxSize = isVideo || isAudio ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  return file.size <= maxSize;
}

async function processFile(file: File): Promise<{ dataUrl: string; mediaType: MediaType; fileName: string } | null> {
  if (!isValidFileType(file)) {
    console.warn("Invalid file type:", file.type);
    return null;
  }

  if (!isValidFileSize(file)) {
    console.warn("File too large:", file.size);
    return null;
  }

  const mediaType = getMediaTypeFromMime(file.type);
  if (!mediaType) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Extract filename without extension for item name
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      resolve({ dataUrl, mediaType, fileName });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export interface FileDropResult {
  dataUrl: string;
  mediaType: MediaType;
  fileName: string;
}

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
}) => {
  const label = tierLabel ?? (tierId === "unranked" ? "Unranked" : tierId);
  const bgColor = tierColor ?? "#1E293B"; // Default slate-800 fallback
  const isUnranked = tierId === "unranked";
  const [isFileDragOver, setIsFileDragOver] = useState(false);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: tierId,
    data: { tierId },
  });

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    // Check if it's a file drag (not internal dnd-kit drag)
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      setIsFileDragOver(true);
    }
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);
  }, []);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);

    if (!onFileDrop) return;

    const files = Array.from(e.dataTransfer.files);
    const file = files[0]; // Only process first file

    if (!file) return;

    const result = await processFile(file);
    if (result) {
      onFileDrop(tierId, result);
    }
  }, [onFileDrop, tierId]);

  const showFileDrop = isFileDragOver && onFileDrop;

  return (
    <section
      ref={setDroppableRef}
      data-testid={`tier-row-${tierId}`}
      role="listbox"
      aria-label={`${label} tier, ${items.length} items`}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
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

interface SortableTierItemProps {
  item: Item;
  index?: number;
  tierId: string;
  isSelected?: boolean;
  onClick?: (item: Item) => void;
  onDoubleClick?: (item: Item) => void;
  onMediaDrop?: (itemId: string, file: FileDropResult) => void;
}

const SortableTierItem: React.FC<SortableTierItemProps> = ({
  item,
  tierId,
  index = 0,
  isSelected = false,
  onClick,
  onDoubleClick,
  onMediaDrop,
}) => {
  const [isFileDragOver, setIsFileDragOver] = useState(false);

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

  // 3D perspective transform with GPU acceleration
  const baseTransform = CSS.Transform.toString(transform);
  const dragTransform = isDragging
    ? `${baseTransform} perspective(1000px) rotateX(3deg) rotateY(-3deg)`
    : baseTransform;

  const style: React.CSSProperties = {
    transform: dragTransform,
    transition: isDragging
      ? "box-shadow 200ms cubic-bezier(0.34, 1.56, 0.64, 1)"
      : `${transition}, box-shadow 200ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
    willChange: isDragging ? "transform" : "auto",
    // Stagger animation delay
    animationDelay: `${index * 30}ms`,
  };

  const hasImage = !!item.imageUrl;
  const hasVideo = !!item.videoUrl;
  const hasAudio = !!item.audioUrl;
  const hasMedia = hasImage || hasVideo || hasAudio;
  const isGif = item.mediaType === "gif";
  const isAudio = item.mediaType === "audio";

  const handleClick = (e: React.MouseEvent) => {
    // Prevent triggering when dragging
    if (e.detail === 1) {
      onClick?.(item);
    }
  };

  const handleDoubleClick = () => {
    onDoubleClick?.(item);
  };

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      setIsFileDragOver(true);
    }
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);
  }, []);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);

    if (!onMediaDrop) return;

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (!file) return;

    const result = await processFile(file);
    if (result) {
      onMediaDrop(item.id, result);
    }
  }, [onMediaDrop, item.id]);

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
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
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

      {hasVideo ? (
        <>
          {/* Video */}
          <video
            src={item.videoUrl}
            className="w-full h-full object-cover rounded-card"
            loop
            muted
            playsInline
            autoPlay
            draggable={false}
          />
          {/* Video badge */}
          <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[8px] text-white flex items-center gap-0.5">
            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          {/* Name overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 rounded-b-card opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-2xs text-white text-center truncate font-medium">
              {item.name ?? item.id}
            </p>
          </div>
        </>
      ) : hasAudio ? (
        <>
          {/* Audio visualization */}
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-2xs text-text-muted text-center truncate w-full font-medium">
              {item.name ?? item.id}
            </p>
          </div>
          {/* Audio badge */}
          <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[8px] text-white flex items-center gap-0.5">
            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          {/* Hidden audio element for potential playback */}
          <audio src={item.audioUrl} className="hidden" />
        </>
      ) : hasImage ? (
        <>
          {/* Image */}
          <img
            src={item.imageUrl}
            alt={item.name ?? item.id}
            className="w-full h-full object-cover rounded-card"
            draggable={false}
          />
          {/* GIF badge */}
          {isGif && (
            <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[8px] text-white font-medium">
              GIF
            </div>
          )}
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

export { SortableTierItem };
