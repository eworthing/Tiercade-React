import { useState, useCallback } from "react";
import type { MediaType } from "@tiercade/core";
import {
  isAcceptedFileType,
  isAcceptedImageType,
  isAcceptedVideoType,
  isAcceptedAudioType,
  isValidFileSize,
} from "@tiercade/core";

export interface FileDropResult {
  dataUrl: string;
  mediaType: MediaType;
  fileName: string;
}

/**
 * Determine MediaType from MIME type
 */
function getMediaTypeFromMime(mimeType: string): MediaType | null {
  if (mimeType === "image/gif") return "gif";
  if (isAcceptedImageType(mimeType)) return "image";
  if (isAcceptedVideoType(mimeType)) return "video";
  if (isAcceptedAudioType(mimeType)) return "audio";
  return null;
}

/**
 * Process a dropped file and return data URL with metadata
 */
async function processFile(file: File): Promise<FileDropResult | null> {
  if (!isAcceptedFileType(file.type)) {
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

interface UseFileDragOptions {
  /** Callback when a valid file is dropped */
  onDrop?: (result: FileDropResult) => void;
  /** Whether file drag is enabled */
  enabled?: boolean;
}

interface UseFileDragResult {
  /** Whether a file is currently being dragged over the element */
  isFileDragOver: boolean;
  /** Handler for dragOver events */
  handleDragOver: (e: React.DragEvent) => void;
  /** Handler for dragLeave events */
  handleDragLeave: (e: React.DragEvent) => void;
  /** Handler for drop events */
  handleDrop: (e: React.DragEvent) => void;
  /** Props to spread on the drop target element */
  dragProps: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

/**
 * Custom hook for file drag-and-drop handling.
 * Extracts duplicate drag logic from TierRow and SortableTierItem.
 */
export function useFileDrag({ onDrop, enabled = true }: UseFileDragOptions = {}): UseFileDragResult {
  const [isFileDragOver, setIsFileDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Check if it's a file drag (not internal dnd-kit drag)
    if (enabled && e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      setIsFileDragOver(true);
    }
  }, [enabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragOver(false);

    if (!onDrop) return;

    const files = Array.from(e.dataTransfer.files);
    const file = files[0]; // Only process first file

    if (!file) return;

    const result = await processFile(file);
    if (result) {
      onDrop(result);
    }
  }, [onDrop]);

  return {
    isFileDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    dragProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
