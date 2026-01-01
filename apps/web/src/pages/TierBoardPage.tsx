import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import {
  TierBoard,
  Button,
  Modal,
  SortFilterBar,
  PresentationControls,
  StreamingOverlay,
  type FileDropResult,
} from "@tiercade/ui";
import {
  moveItemBetweenTiersWithUndo,
  loadDefaultProject,
  selectTheme,
  toggleSelection,
  clearSelection,
  loadProject,
  captureSnapshot,
  addItemToTier,
  updateItem,
  setSortMode,
  setSearchFilter,
  toggleMediaTypeFilter,
  clearFilters,
  // Memoized selectors
  selectTiers,
  selectTierOrder,
  selectSelection,
  selectTierLabels,
  selectTierColors,
  selectProjectName,
  selectSortMode,
  selectFilters,
  selectSelectedThemeId,
  selectTotalItemCount,
} from "@tiercade/state";
import {
  DEFAULT_THEME_ID,
  findThemeById,
  getTierColorHex,
  EFFECTS,
} from "@tiercade/theme";
import type { Item, GlobalSortMode, MediaType, Items } from "@tiercade/core";
import { sortItems, filterAllTiers, isCelebrationTier, UNRANKED_TIER_ID } from "@tiercade/core";
import { ItemModal } from "../components/ItemModal";
import { TierSettingsModal } from "../components/TierSettingsModal";
import {
  generateShareUrl,
  getShareDataFromUrl,
  clearShareDataFromUrl,
  copyToClipboard,
} from "../utils/urlSharing";

// Import new hooks
import { useTierBoardKeyboard } from "../hooks/useTierBoardKeyboard";
import { useExport } from "../hooks/useExport";
import { usePresentationHandlers } from "../hooks/usePresentationHandlers";

export const TierBoardPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Use memoized selectors
  const tiers = useAppSelector(selectTiers);
  const tierOrder = useAppSelector(selectTierOrder);
  const selection = useAppSelector(selectSelection);
  const selectedThemeId = useAppSelector(selectSelectedThemeId);
  const stateTierLabels = useAppSelector(selectTierLabels);
  const stateTierColors = useAppSelector(selectTierColors);
  const projectName = useAppSelector(selectProjectName);
  const sortMode = useAppSelector(selectSortMode);
  const filters = useAppSelector(selectFilters);
  const totalItems = useAppSelector(selectTotalItemCount);

  // Modal states
  const [showAddItem, setShowAddItem] = useState(false);
  const [showTierSettings, setShowTierSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showStreamingPanel, setShowStreamingPanel] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTier, setCelebrationTier] = useState<string | null>(null);

  // Use custom hooks
  useTierBoardKeyboard({
    onAddItem: () => setShowAddItem(true),
    onShowHelp: () => setShowKeyboardHelp(true),
  });

  const { isExporting, exportAsPNG, copyToClipboard: copyImageToClipboard } = useExport({
    defaultFilename: projectName || "tier-list",
  });

  const presentation = usePresentationHandlers();

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
      clearShareDataFromUrl();
    }
  }, []); // Only run once on mount

  // Compute tier colors and labels from theme + custom overrides
  const { tierColors, tierLabels } = useMemo(() => {
    const themeId = selectedThemeId ?? DEFAULT_THEME_ID;
    const theme = findThemeById(themeId);

    const colors: Record<string, string> = {};
    const labels: Record<string, string> = {};

    tierOrder.forEach((tierId, index) => {
      colors[tierId] =
        stateTierColors[tierId] ??
        (theme ? getTierColorHex(theme, tierId, index) : "#1e293b");

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

    colors[UNRANKED_TIER_ID] =
      stateTierColors[UNRANKED_TIER_ID] ??
      (theme ? getTierColorHex(theme, UNRANKED_TIER_ID) : "#374151");
    labels[UNRANKED_TIER_ID] = stateTierLabels[UNRANKED_TIER_ID] ?? "Unranked";

    return { tierColors: colors, tierLabels: labels };
  }, [selectedThemeId, tierOrder, stateTierLabels, stateTierColors]);

  const handleItemClick = useCallback(
    (item: Item) => {
      dispatch(toggleSelection(item.id));
    },
    [dispatch]
  );

  const handleItemDoubleClick = useCallback((item: Item) => {
    setEditingItem(item);
  }, []);

  const handleFileDrop = useCallback(
    (tierId: string, file: FileDropResult) => {
      dispatch(captureSnapshot("Add Item from File"));

      const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
    },
    [dispatch]
  );

  const handleItemMediaDrop = useCallback(
    (itemId: string, file: FileDropResult) => {
      dispatch(captureSnapshot("Update Item Media"));

      const updates: Partial<Item> = {
        mediaType: file.mediaType,
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
    },
    [dispatch]
  );

  const handleCopyLink = useCallback(async () => {
    const url = generateShareUrl(
      projectName,
      tierOrder,
      stateTierLabels,
      stateTierColors as Record<string, string>,
      tiers
    );
    await copyToClipboard(url);
  }, [projectName, tierOrder, stateTierLabels, stateTierColors, tiers]);

  // Apply filtering and sorting
  const processedTiers = useMemo((): Items => {
    const filtered = filterAllTiers(tiers, filters);

    if (sortMode.type === "custom") {
      return filtered;
    }

    const sorted: Items = {};
    for (const [tierName, items] of Object.entries(filtered)) {
      sorted[tierName] = sortItems(items, sortMode);
    }
    return sorted;
  }, [tiers, filters, sortMode]);

  const filteredItems = useMemo(() => {
    return Object.values(processedTiers).flat().length;
  }, [processedTiers]);

  // Sort/filter handlers
  const handleSortModeChange = useCallback(
    (mode: GlobalSortMode) => {
      dispatch(setSortMode(mode));
    },
    [dispatch]
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      dispatch(setSearchFilter(search));
    },
    [dispatch]
  );

  const handleMediaTypeToggle = useCallback(
    (mediaType: MediaType) => {
      dispatch(toggleMediaTypeFilter(mediaType));
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // Enhanced move handler for celebrations
  const handleMoveItemWithCelebration = useCallback(
    (itemId: string, targetTierName: string) => {
      dispatch(moveItemBetweenTiersWithUndo(itemId, targetTierName));

      // Trigger celebration using constant instead of magic string
      if (
        presentation.isPresenting &&
        presentation.celebrateSTier &&
        isCelebrationTier(targetTierName)
      ) {
        setCelebrationTier(targetTierName);
        setShowCelebration(true);
      }
    },
    [dispatch, presentation.isPresenting, presentation.celebrateSTier]
  );

  // Get current queue item as full Item object
  const currentQueueItemObj = useMemo(() => {
    if (!presentation.currentQueueItem) return null;
    for (const items of Object.values(tiers)) {
      const found = items.find((item) => item.id === presentation.currentQueueItem);
      if (found) return found;
    }
    return null;
  }, [presentation.currentQueueItem, tiers]);

  // Count ranked items
  const rankedItemsCount = useMemo(() => {
    let count = 0;
    for (const [tierName, items] of Object.entries(tiers)) {
      if (tierName !== UNRANKED_TIER_ID) {
        count += items.length;
      }
    }
    return count;
  }, [tiers]);

  // Empty state
  if (!tierOrder.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-surface-raised flex items-center justify-center">
          <svg className="w-8 h-8 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text mb-2">Loading your tier list...</h2>
        <p className="text-text-muted text-sm max-w-xs">Setting up your tiers. This should only take a moment.</p>
      </div>
    );
  }

  const chromaKeyClass = presentation.chromaKey !== "none" ? `chroma-${presentation.chromaKey}` : "";

  return (
    <div className={`space-y-4 ${presentation.isPresenting ? "min-h-screen" : ""} ${chromaKeyClass}`}>
      {/* Streaming Overlay */}
      <StreamingOverlay
        isPresenting={presentation.isPresenting}
        currentItem={currentQueueItemObj}
        showCurrentItem={presentation.showCurrentItem}
        totalItems={totalItems}
        rankedItems={rankedItemsCount}
        showProgress={presentation.showProgress}
        watermarkText={presentation.watermarkText}
        showWatermark={presentation.showWatermark}
        queueRemaining={presentation.itemQueue.length}
      />

      {/* S-tier Celebration */}
      {showCelebration && celebrationTier && (
        <CelebrationEffect
          onComplete={() => {
            setShowCelebration(false);
            setCelebrationTier(null);
          }}
        />
      )}

      {/* Toolbar */}
      <TierBoardToolbar
        totalItems={totalItems}
        selectionCount={selection.length}
        isExporting={isExporting}
        isPresenting={presentation.isPresenting}
        onAddItem={() => setShowAddItem(true)}
        onTierSettings={() => setShowTierSettings(true)}
        onExportPNG={exportAsPNG}
        onCopyImage={copyImageToClipboard}
        onCopyLink={handleCopyLink}
        onStreamMode={() => setShowStreamingPanel(true)}
        onClearSelection={() => dispatch(clearSelection())}
      />

      {/* Sort and Filter Bar */}
      {totalItems > 0 && (
        <SortFilterBar
          sortMode={sortMode}
          filters={filters}
          onSortModeChange={handleSortModeChange}
          onSearchChange={handleSearchChange}
          onMediaTypeToggle={handleMediaTypeToggle}
          onClearFilters={handleClearFilters}
          totalItems={totalItems}
          filteredItems={filteredItems}
        />
      )}

      {/* Tier Board */}
      <TierBoard
        tiers={processedTiers}
        tierOrder={tierOrder}
        onMoveItem={handleMoveItemWithCelebration}
        tierColors={tierColors}
        tierLabels={tierLabels}
        selectedItems={selection}
        onItemClick={handleItemClick}
        onItemDoubleClick={handleItemDoubleClick}
        onFileDrop={handleFileDrop}
        onItemMediaDrop={handleItemMediaDrop}
        itemScale={presentation.isPresenting ? presentation.itemScale : 1}
        revealMode={presentation.isPresenting && presentation.revealMode}
        revealedItems={presentation.revealedItems}
        onItemReveal={presentation.handleItemReveal}
      />

      {/* Empty state hint */}
      {totalItems === 0 && (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm mb-2">Your tier list is empty</p>
          <Button variant="primary" onClick={() => setShowAddItem(true)}>
            Add your first item
          </Button>
        </div>
      )}

      {totalItems > 0 && (
        <p className="text-center text-text-subtle text-xs">
          Drag items between tiers • Drop files to add • Double-click to edit •{" "}
          <button onClick={() => setShowKeyboardHelp(true)} className="underline hover:text-text-muted">
            Keyboard shortcuts
          </button>
        </p>
      )}

      {/* Modals - using unified ItemModal */}
      <ItemModal open={showAddItem} onClose={() => setShowAddItem(false)} mode="add" />
      <ItemModal open={!!editingItem} onClose={() => setEditingItem(null)} item={editingItem} mode="edit" />
      <TierSettingsModal open={showTierSettings} onClose={() => setShowTierSettings(false)} />

      {/* Keyboard Shortcuts Help Modal */}
      <Modal open={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} title="Keyboard Shortcuts" size="sm">
        <KeyboardShortcutsContent />
      </Modal>

      {/* Streaming Panel Modal */}
      <Modal open={showStreamingPanel} onClose={() => setShowStreamingPanel(false)} title="Stream Mode" size="sm">
        <PresentationControls
          isPresenting={presentation.isPresenting}
          chromaKey={presentation.chromaKey}
          revealMode={presentation.revealMode}
          showProgress={presentation.showProgress}
          celebrateSTier={presentation.celebrateSTier}
          itemScale={presentation.itemScale}
          queueLength={presentation.itemQueue.length}
          currentQueueItem={presentation.currentQueueItem}
          watermarkText={presentation.watermarkText}
          showWatermark={presentation.showWatermark}
          onTogglePresentation={presentation.handleTogglePresentation}
          onChromaKeyChange={presentation.handleChromaKeyChange}
          onRevealModeChange={presentation.handleRevealModeChange}
          onShowProgressChange={presentation.handleShowProgressChange}
          onCelebrateSTierChange={presentation.handleCelebrateSTierChange}
          onItemScaleChange={presentation.handleItemScaleChange}
          onDrawNext={presentation.handleDrawNext}
          onShuffleQueue={presentation.handleShuffleQueue}
          onStartQueue={presentation.handleStartQueue}
          onWatermarkTextChange={presentation.handleWatermarkTextChange}
          onShowWatermarkChange={presentation.handleShowWatermarkChange}
        />
      </Modal>
    </div>
  );
};

// ============================================================================
// Extracted Sub-components
// ============================================================================

interface TierBoardToolbarProps {
  totalItems: number;
  selectionCount: number;
  isExporting: boolean;
  isPresenting: boolean;
  onAddItem: () => void;
  onTierSettings: () => void;
  onExportPNG: () => void;
  onCopyImage: () => void;
  onCopyLink: () => void;
  onStreamMode: () => void;
  onClearSelection: () => void;
}

const TierBoardToolbar: React.FC<TierBoardToolbarProps> = ({
  totalItems,
  selectionCount,
  isExporting,
  isPresenting,
  onAddItem,
  onTierSettings,
  onExportPNG,
  onCopyImage,
  onCopyLink,
  onStreamMode,
  onClearSelection,
}) => (
  <div className="flex items-center justify-between gap-4 flex-wrap">
    <div className="flex items-center gap-2">
      <Button variant="primary" size="sm" onClick={onAddItem} icon={<PlusIcon />}>
        Add Item
      </Button>
      <Button variant="secondary" size="sm" onClick={onTierSettings} icon={<SettingsIcon />}>
        Tiers
      </Button>

      {totalItems > 0 && (
        <div className="relative group">
          <Button variant="secondary" size="sm" disabled={isExporting} icon={<ShareIcon />}>
            Share
          </Button>
          <div className="absolute top-full left-0 mt-1 py-1 bg-surface-raised border border-border rounded-lg shadow-modal opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[160px]">
            <DropdownButton onClick={onExportPNG} disabled={isExporting} icon={<DownloadIcon />}>
              Download PNG
            </DropdownButton>
            <DropdownButton onClick={onCopyImage} disabled={isExporting} icon={<ClipboardIcon />}>
              Copy Image
            </DropdownButton>
            <div className="border-t border-border my-1" />
            <DropdownButton onClick={onCopyLink} icon={<LinkIcon />}>
              Copy Link
            </DropdownButton>
          </div>
        </div>
      )}

      <Button variant={isPresenting ? "primary" : "secondary"} size="sm" onClick={onStreamMode} icon={<VideoIcon />}>
        {isPresenting ? "Live" : "Stream"}
      </Button>
    </div>

    <div className="flex items-center gap-4 text-sm text-text-muted">
      <span>{totalItems} items</span>
      {selectionCount > 0 && (
        <>
          <span className="text-accent">{selectionCount} selected</span>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
        </>
      )}
    </div>
  </div>
);

TierBoardToolbar.displayName = "TierBoardToolbar";

const DropdownButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ onClick, disabled, icon, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-soft flex items-center gap-2 disabled:opacity-50"
  >
    {icon}
    {children}
  </button>
);

const KeyboardShortcutsContent: React.FC = () => (
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
    <p className="text-xs text-text-subtle">Tip: Use ⌘ on Mac or Ctrl on Windows/Linux</p>
  </div>
);

const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
  <div className="flex items-center justify-between">
    <span className="text-text-muted">{description}</span>
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <kbd key={i} className="px-1.5 py-0.5 bg-surface rounded border border-border text-xs font-mono">
          {key}
        </kbd>
      ))}
    </div>
  </div>
);

// ============================================================================
// Icons (extracted to reduce JSX noise)
// ============================================================================

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

// ============================================================================
// Celebration Effect
// ============================================================================

const CELEBRATION_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 5) % 100}%`,
  top: `${((i * 7) + 10) % 100}%`,
  duration: 1 + (i % 3) * 0.3,
  delay: (i % 5) * 0.1,
  emoji: ["⭐", "✨", "🌟"][i % 3],
}));

const CelebrationEffect: React.FC<{ onComplete: () => void }> = React.memo(({ onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, EFFECTS.CELEBRATION_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-0 fade-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-yellow-500/30 rounded-full animate-pulse" />
          <div className="text-6xl animate-bounce">⭐</div>
        </div>
      </div>
      {CELEBRATION_PARTICLES.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-2xl"
          style={{
            left: particle.left,
            top: particle.top,
            animation: `float ${particle.duration}s ease-out forwards`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
});

CelebrationEffect.displayName = "CelebrationEffect";
