import { useState, useCallback } from "react";
import { ToastQueue } from "@react-spectrum/s2";
import { exportElementAsPNG, copyElementToClipboard } from "../utils/exportImage";

/** Element selector for tier board export */
export const TIER_BOARD_SELECTOR = "[data-tier-board]";

interface UseExportOptions {
  /** Default filename for exports (without extension) */
  defaultFilename?: string;
}

interface UseExportResult {
  /** Whether an export operation is in progress */
  isExporting: boolean;
  /** Export the tier board as PNG download */
  exportAsPNG: () => Promise<void>;
  /** Copy the tier board to clipboard as image */
  copyToClipboard: () => Promise<void>;
}

/**
 * Custom hook for tier board export functionality
 *
 * Provides unified export handlers with loading state and error handling
 */
export function useExport({
  defaultFilename = "tier-list",
}: UseExportOptions = {}): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);

  const getElement = useCallback((): HTMLElement | null => {
    return document.querySelector(TIER_BOARD_SELECTOR) as HTMLElement;
  }, []);

  const exportAsPNG = useCallback(async () => {
    const element = getElement();
    if (!element) {
      ToastQueue.negative("Could not find tier board to export");
      return;
    }

    setIsExporting(true);
    element.classList.add("export-mode");
    try {
      await exportElementAsPNG(element, {
        filename: `${defaultFilename}.png`,
        scale: 2,
      });
      ToastQueue.positive("Image downloaded!");
    } catch (error) {
      console.error("Export failed:", error);
      ToastQueue.negative(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      element.classList.remove("export-mode");
      setIsExporting(false);
    }
  }, [getElement, defaultFilename]);

  const copyToClipboard = useCallback(async () => {
    const element = getElement();
    if (!element) {
      ToastQueue.negative("Could not find tier board to copy");
      return;
    }

    setIsExporting(true);
    element.classList.add("export-mode");
    try {
      const success = await copyElementToClipboard(element);
      if (success) {
        ToastQueue.positive("Image copied to clipboard!");
      } else {
        ToastQueue.negative("Failed to copy - try downloading instead");
      }
    } catch (error) {
      console.error("Copy failed:", error);
      ToastQueue.negative("Clipboard access denied");
    } finally {
      element.classList.remove("export-mode");
      setIsExporting(false);
    }
  }, [getElement]);

  return {
    isExporting,
    exportAsPNG,
    copyToClipboard,
  };
}
