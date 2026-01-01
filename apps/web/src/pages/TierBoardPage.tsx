import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { TierBoard, Button, Modal, useToast, type FileDropResult } from "@tiercade/ui";
import {
  moveItemBetweenTiersWithUndo,
  loadDefaultProject,
  selectTheme,
  toggleSelection,
  clearSelection,
  setSelection,
  deleteItems,
  loadProject,
  captureSnapshot,
  addItemToTier,
  updateItem,
} from "@tiercade/state";
import {
  DEFAULT_THEME_ID,
  findThemeById,
  getTierColorHex,
} from "@tiercade/theme";
import type { Item } from "@tiercade/core";
import { AddItemModal } from "../components/AddItemModal";
import { EditItemModal } from "../components/EditItemModal";
import { TierSettingsModal } from "../components/TierSettingsModal";
import { exportElementAsPNG, copyElementToClipboard } from "../utils/exportImage";
import {
  generateShareUrl,
  getShareDataFromUrl,
  clearShareDataFromUrl,
  copyToClipboard,
} from "../utils/urlSharing";

export const TierBoardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const tiers = useAppSelector((state) => state.tier.tiers);
  const tierOrder = useAppSelector((state) => state.tier.tierOrder);
  const selection = useAppSelector((state) => state.tier.selection);
  const selectedThemeId = useAppSelector((state) => state.theme.selectedThemeId);
  const stateTierLabels = useAppSelector((state) => state.tier.tierLabels);
  const stateTierColors = useAppSelector((state) => state.tier.tierColors);
  const projectName = useAppSelector((state) => state.tier.projectName);

  // Modal states
  const [showAddItem, setShowAddItem] = useState(false);
  const [showTierSettings, setShowTierSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize default theme on first load
  useEffect(() => {
    if (!selectedThemeId) {
      dispatch(selectTheme(DEFAULT_THEME_ID));
    }
  }, [dispatch, selectedThemeId]);

  // Load default project on mount only if no tier data exists
  useEffect(() => {
    const hasTierData = tierOrder && tierOrder.length > 0;
    const hasTierItems = Object.keys(tiers).length > 0;

    if (!hasTierData && !hasTierItems) {
      dispatch(loadDefaultProject());
    }
  }, []); // Only run once on mount

  // Check for shared tier list in URL
  useEffect(() => {
    const sharedData = getShareDataFromUrl();
    if (sharedData) {
      dispatch(captureSnapshot("Load Shared"));
      dispatch(
        loadProject({
          tiers: sharedData.tiers,
          tierOrder: sharedData.tierOrder,
          tierLabels: sharedData.tierLabels,
          tierColors: sharedData.tierColors,
          projectName: sharedData.projectName,
        })
      );
      // Clear the share parameter from URL
      clearShareDataFromUrl();
      toast.success("Loaded shared tier list!");
    }
  }, []); // Only run once on mount

  // Keyboard shortcuts for TierBoard page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Add item (Cmd/Ctrl+N)
      if (isMod && e.key === "n") {
        e.preventDefault();
        setShowAddItem(true);
        return;
      }

      // Select all (Cmd/Ctrl+A)
      if (isMod && e.key === "a") {
        e.preventDefault();
        const allItemIds = Object.values(tiers).flat().map((item) => item.id);
        dispatch(setSelection(allItemIds));
        return;
      }

      // Deselect all (Escape)
      if (e.key === "Escape" && selection.length > 0) {
        e.preventDefault();
        dispatch(clearSelection());
        return;
      }

      // Delete selected items (Delete or Backspace)
      if ((e.key === "Delete" || e.key === "Backspace") && selection.length > 0) {
        e.preventDefault();
        dispatch(captureSnapshot("Delete Items"));
        dispatch(deleteItems(selection));
        toast.success(`Deleted ${selection.length} item(s)`);
        return;
      }

      // Show keyboard help (?)
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowKeyboardHelp(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, tiers, selection, toast]);

  // Compute tier colors and labels from theme + custom overrides
  const { tierColors, tierLabels } = useMemo(() => {
    const themeId = selectedThemeId ?? DEFAULT_THEME_ID;
    const theme = findThemeById(themeId);

    const colors: Record<string, string> = {};
    const labels: Record<string, string> = {};

    // Map theme colors to tier IDs, with custom overrides
    tierOrder.forEach((tierId, index) => {
      // Use custom color if set, otherwise use theme color
      colors[tierId] =
        stateTierColors[tierId] ??
        (theme ? getTierColorHex(theme, tierId, index) : "#1e293b");

      // Use custom label if set, otherwise use theme label or tier ID
      if (stateTierLabels[tierId]) {
        labels[tierId] = stateTierLabels[tierId];
      } else if (theme) {
        const themeTier = theme.tiers.find(
          (t) =>
            !t.isUnranked &&
            (t.name.toLowerCase() === tierId.toLowerCase() || t.index === index)
        );
        labels[tierId] = themeTier?.name ?? tierId;
      } else {
        labels[tierId] = tierId;
      }
    });

    // Unranked tier
    colors["unranked"] =
      stateTierColors["unranked"] ??
      (theme ? getTierColorHex(theme, "unranked") : "#374151");
    labels["unranked"] = stateTierLabels["unranked"] ?? "Unranked";

    return { tierColors: colors, tierLabels: labels };
  }, [selectedThemeId, tierOrder, stateTierLabels, stateTierColors]);

  const handleMoveItem = useCallback(
    (itemId: string, targetTierName: string) => {
      dispatch(moveItemBetweenTiersWithUndo(itemId, targetTierName));
    },
    [dispatch]
  );

  const handleItemClick = useCallback(
    (item: Item) => {
      dispatch(toggleSelection(item.id));
    },
    [dispatch]
  );

  const handleItemDoubleClick = useCallback((item: Item) => {
    setEditingItem(item);
  }, []);

  // Handle file drop onto a tier to create a new item
  const handleFileDrop = useCallback(
    (tierId: string, file: FileDropResult) => {
      dispatch(captureSnapshot("Add Item from File"));

      // Generate a unique ID
      const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Build item based on media type
      const item: Item = {
        id,
        name: file.fileName,
        mediaType: file.mediaType,
      };

      if (file.mediaType === "video") {
        item.videoUrl = file.dataUrl;
      } else if (file.mediaType === "audio") {
        item.audioUrl = file.dataUrl;
      } else {
        item.imageUrl = file.dataUrl;
      }

      dispatch(addItemToTier({ item, tierName: tierId }));
      toast.success(`Added "${file.fileName}" to tier`);
    },
    [dispatch, toast]
  );

  // Handle file drop onto an existing item to update its media
  const handleItemMediaDrop = useCallback(
    (itemId: string, file: FileDropResult) => {
      dispatch(captureSnapshot("Update Item Media"));

      // Build updates based on media type
      const updates: Partial<Item> = {
        mediaType: file.mediaType,
        // Clear other media types
        imageUrl: undefined,
        videoUrl: undefined,
        audioUrl: undefined,
      };

      if (file.mediaType === "video") {
        updates.videoUrl = file.dataUrl;
      } else if (file.mediaType === "audio") {
        updates.audioUrl = file.dataUrl;
      } else {
        updates.imageUrl = file.dataUrl;
      }

      dispatch(updateItem({ itemId, updates }));
      toast.success("Updated item media");
    },
    [dispatch, toast]
  );

  const handleExportPNG = useCallback(async () => {
    const tierBoard = document.querySelector("[data-tier-board]") as HTMLElement;
    if (!tierBoard) {
      toast.error("Could not find tier board to export");
      return;
    }

    setIsExporting(true);
    try {
      await exportElementAsPNG(tierBoard, {
        filename: `${projectName || "tier-list"}.png`,
        scale: 2,
      });
      toast.success("Image downloaded!");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [projectName, toast]);

  const handleCopyImage = useCallback(async () => {
    const tierBoard = document.querySelector("[data-tier-board]") as HTMLElement;
    if (!tierBoard) {
      toast.error("Could not find tier board to copy");
      return;
    }

    setIsExporting(true);
    try {
      const success = await copyElementToClipboard(tierBoard);
      if (success) {
        toast.success("Image copied to clipboard!");
      } else {
        toast.error("Failed to copy - try downloading instead");
      }
    } catch {
      toast.error("Clipboard access denied");
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  const handleCopyLink = useCallback(async () => {
    try {
      const url = generateShareUrl(
        projectName,
        tierOrder,
        stateTierLabels,
        stateTierColors as Record<string, string>,
        tiers
      );
      const success = await copyToClipboard(url);
      if (success) {
        toast.success("Link copied to clipboard!");
      } else {
        toast.error("Failed to copy link");
      }
    } catch {
      toast.error("Failed to generate share link");
    }
  }, [projectName, tierOrder, stateTierLabels, stateTierColors, tiers, toast]);

  // Count total items
  const totalItems = useMemo(() => {
    return Object.values(tiers).flat().length;
  }, [tiers]);

  // Empty state
  if (!tierOrder.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-surface-raised flex items-center justify-center">
          <svg
            className="w-8 h-8 text-text-subtle"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text mb-2">
          Loading your tier list...
        </h2>
        <p className="text-text-muted text-sm max-w-xs">
          Setting up your tiers. This should only take a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddItem(true)}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Add Item
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTierSettings(true)}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          >
            Tiers
          </Button>

          {/* Share dropdown */}
          {totalItems > 0 && (
            <div className="relative group">
              <Button
                variant="secondary"
                size="sm"
                disabled={isExporting}
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                }
              >
                Share
              </Button>
              {/* Dropdown menu */}
              <div className="absolute top-full left-0 mt-1 py-1 bg-surface-raised border border-border rounded-lg shadow-modal opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[160px]">
                <button
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-soft flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PNG
                </button>
                <button
                  onClick={handleCopyImage}
                  disabled={isExporting}
                  className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-soft flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Image
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={handleCopyLink}
                  className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-soft flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-text-muted">
          <span>{totalItems} items</span>
          {selection.length > 0 && (
            <>
              <span className="text-accent">
                {selection.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch(clearSelection())}
              >
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tier Board */}
      <TierBoard
        tiers={tiers}
        tierOrder={tierOrder}
        onMoveItem={handleMoveItem}
        tierColors={tierColors}
        tierLabels={tierLabels}
        selectedItems={selection}
        onItemClick={handleItemClick}
        onItemDoubleClick={handleItemDoubleClick}
        onFileDrop={handleFileDrop}
        onItemMediaDrop={handleItemMediaDrop}
      />

      {/* Hint text */}
      {totalItems === 0 && (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm mb-2">
            Your tier list is empty
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddItem(true)}
          >
            Add your first item
          </Button>
        </div>
      )}

      {totalItems > 0 && (
        <p className="text-center text-text-subtle text-xs">
          Drag items between tiers • Drop files to add • Double-click to edit •{" "}
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="underline hover:text-text-muted"
          >
            Keyboard shortcuts
          </button>
        </p>
      )}

      {/* Modals */}
      <AddItemModal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
      />

      <EditItemModal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
      />

      <TierSettingsModal
        open={showTierSettings}
        onClose={() => setShowTierSettings(false)}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <Modal
        open={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
        title="Keyboard Shortcuts"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-text mb-2">General</h4>
            <div className="space-y-1.5 text-sm">
              <ShortcutRow keys={["⌘", "Z"]} description="Undo" />
              <ShortcutRow keys={["⌘", "⇧", "Z"]} description="Redo" />
              <ShortcutRow keys={["⌘", "N"]} description="Add new item" />
              <ShortcutRow keys={["⌘", "A"]} description="Select all items" />
              <ShortcutRow keys={["Esc"]} description="Deselect all" />
              <ShortcutRow keys={["Delete"]} description="Delete selected" />
              <ShortcutRow keys={["?"]} description="Show shortcuts" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-text mb-2">Head-to-Head</h4>
            <div className="space-y-1.5 text-sm">
              <ShortcutRow keys={["←"]} description="Vote for left item" />
              <ShortcutRow keys={["→"]} description="Vote for right item" />
              <ShortcutRow keys={["Space"]} description="Skip pair" />
              <ShortcutRow keys={["Esc"]} description="Finish & apply" />
            </div>
          </div>
          <p className="text-xs text-text-subtle">
            Tip: Use ⌘ on Mac or Ctrl on Windows/Linux
          </p>
        </div>
      </Modal>
    </div>
  );
};

// Keyboard shortcut display component
const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({
  keys,
  description,
}) => (
  <div className="flex items-center justify-between">
    <span className="text-text-muted">{description}</span>
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="px-1.5 py-0.5 bg-surface rounded border border-border text-xs font-mono"
        >
          {key}
        </kbd>
      ))}
    </div>
  </div>
);
