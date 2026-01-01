import { useState, useCallback } from "react";
import { useToast } from "@tiercade/ui";
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
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const getElement = useCallback((): HTMLElement | null => {
    return document.querySelector(TIER_BOARD_SELECTOR) as HTMLElement;
  }, []);

  const exportAsPNG = useCallback(async () => {
    const element = getElement();
    if (!element) {
      toast.error("Could not find tier board to export");
      return;
    }

    setIsExporting(true);
    try {
      await exportElementAsPNG(element, {
        filename: `${defaultFilename}.png`,
        scale: 2,
      });
      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsExporting(false);
    }
  }, [getElement, defaultFilename, toast]);

  const copyToClipboard = useCallback(async () => {
    const element = getElement();
    if (!element) {
      toast.error("Could not find tier board to copy");
      return;
    }

    setIsExporting(true);
    try {
      const success = await copyElementToClipboard(element);
      if (success) {
        toast.success("Image copied to clipboard!");
      } else {
        toast.error("Failed to copy - try downloading instead");
      }
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Clipboard access denied");
    } finally {
      setIsExporting(false);
    }
  }, [getElement, toast]);

  return {
    isExporting,
    exportAsPNG,
    copyToClipboard,
  };
}
