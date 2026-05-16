import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import {
  TierBoard,
  SortFilterBar,
  PresentationControls,
  StreamingOverlay,
  type FileDropResult,
} from "@tiercade/ui";
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogTrigger,
  Heading,
  Content,
  IllustratedMessage,
  Link,
  Text,
  Badge,
} from "@react-spectrum/s2";
import Addproject from "@react-spectrum/s2/illustrations/linear/Addproject";
import {
  moveItemBetweenTiersWithUndo,
  loadDefaultProject,
  clearSelection,
  captureSnapshot,
  moveItemsBetweenTiers,
  deleteItems,
  selectTheme,
  // Memoized selectors
  selectTiers,
  selectTierOrder,
  selectSelection,
  selectTotalItemCount,
  selectSelectedThemeId,
  selectProjectName,
  selectSortMode,
  selectFilters,
} from "@tiercade/state";
import {
  DEFAULT_THEME_ID,
} from "@tiercade/theme";
import type { Item } from "@tiercade/core";
import { isCelebrationTier, UNRANKED_TIER_ID } from "@tiercade/core";
import { ItemModal } from "../components/ItemModal";
import { TierSettingsModal } from "../components/TierSettingsModal";
import { BatchActionBar } from "../components/BatchActionBar";
import { TierBoardToolbar } from "../components/TierBoardToolbar";
import { CelebrationEffect } from "../components/CelebrationEffect";
import {
  generateShareUrl,
  copyToClipboard,
} from "../utils/urlSharing";

// Custom hooks
import { useTierBoardKeyboard } from "../hooks/useTierBoardKeyboard";
import { useExport } from "../hooks/useExport";
import { usePresentationHandlers } from "../hooks/usePresentationHandlers";
import { useShareImport } from "../hooks/useShareImport";
import { useTierDisplay } from "../hooks/useTierDisplay";
import { useTierFilter } from "../hooks/useTierFilter";
import { useItemInteraction } from "../hooks/useItemInteraction";

export const TierBoardPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Use memoized selectors
  const tiers = useAppSelector(selectTiers);
  const tierOrder = useAppSelector(selectTierOrder);
  const selection = useAppSelector(selectSelection);
  const selectedThemeId = useAppSelector(selectSelectedThemeId);
  const projectName = useAppSelector(selectProjectName);
  const totalItems = useAppSelector(selectTotalItemCount);

  // Modal/UI state
  const [showAddItem, setShowAddItem] = useState(false);
  const [showTierSettings, setShowTierSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showStreamingPanel, setShowStreamingPanel] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTier, setCelebrationTier] = useState<string | null>(null);

  // Custom hooks — each owns one concern
  useTierBoardKeyboard({
    onAddItem: () => setShowAddItem(true),
    onShowHelp: () => setShowKeyboardHelp(true),
  });

  const { isExporting, exportAsPNG, copyToClipboard: copyImageToClipboard } = useExport({
    defaultFilename: projectName || "tier-list",
  });

  const presentation = usePresentationHandlers();
  useShareImport();

  const { tierColors, tierLabels } = useTierDisplay();

  const {
    processedTiers,
    filteredItems,
    handleSortModeChange,
    handleSearchChange,
    handleMediaTypeToggle,
    handleClearFilters,
  } = useTierFilter();

  const {
    onItemClick: handleItemClick,
    onFileDrop: handleFileDrop,
    onItemMediaDrop: handleItemMediaDrop,
  } = useItemInteraction(dispatch);

  // Also read sortMode and filters for SortFilterBar props
  const sortMode = useAppSelector(selectSortMode);
  const filters = useAppSelector(selectFilters);

  // Initialize default theme on first load
  useEffect(() => {
    if (!selectedThemeId) {
      dispatch(selectTheme(DEFAULT_THEME_ID));
    }
  }, [dispatch, selectedThemeId]);

  // Load default project on mount if no tier data exists
  useEffect(() => {
    const hasTierData = tierOrder.length > 0;
    const hasTierItems = Object.keys(tiers).length > 0;

    if (!hasTierData && !hasTierItems) {
      dispatch(loadDefaultProject());
    }
  }, [dispatch, tierOrder.length, tiers]);

  const handleItemDoubleClick = useCallback((item: Item) => {
    setEditingItem(item);
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = generateShareUrl(
      projectName,
      tierOrder,
      tierLabels,
      tierColors as Record<string, string>,
      tiers
    );
    await copyToClipboard(url);
  }, [projectName, tierOrder, tierLabels, tierColors, tiers]);

  // Batch operation handlers
  const handleBatchMoveToTier = useCallback(
    (targetTierName: string) => {
      if (selection.length === 0) return;
      dispatch(captureSnapshot("Batch Move"));
      dispatch(moveItemsBetweenTiers({ itemIds: selection, targetTierName }));
    },
    [dispatch, selection]
  );

  const handleBatchDelete = useCallback(() => {
    if (selection.length === 0) return;
    dispatch(captureSnapshot("Batch Delete"));
    dispatch(deleteItems(selection));
  }, [dispatch, selection]);

  // Enhanced move handler for celebrations
  const handleMoveItemWithCelebration = useCallback(
    (itemId: string, targetTierName: string) => {
      dispatch(moveItemBetweenTiersWithUndo(itemId, targetTierName));

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
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 64 }}>
        <IllustratedMessage>
          <Addproject />
          <Heading>Loading your tier list…</Heading>
          <Content>
            <Text>Setting up your tiers. This should only take a moment.</Text>
          </Content>
        </IllustratedMessage>
      </div>
    );
  }

  const chromaKeyClass = presentation.chromaKey !== "none" ? `chroma-${presentation.chromaKey}` : "";

  return (
    <div className={chromaKeyClass} style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: presentation.isPresenting ? "100vh" : undefined }}>
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
        isExporting={isExporting}
        isPresenting={presentation.isPresenting}
        onAddItem={() => setShowAddItem(true)}
        onTierSettings={() => setShowTierSettings(true)}
        onExportPNG={exportAsPNG}
        onCopyImage={copyImageToClipboard}
        onCopyLink={handleCopyLink}
        onStreamMode={() => setShowStreamingPanel(true)}
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
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px 24px",
          borderRadius: 16,
          border: "1px dashed #24263a",
          background: "radial-gradient(ellipse at center, rgba(56,189,248,0.03), transparent 60%)",
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            border: "1.5px dashed #38bdf8",
            background: "rgba(56,189,248,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}>
            <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 600,
            color: "#e2e4e8",
            marginBottom: 8,
          }}>
            Ready to rank?
          </span>
          <span style={{
            fontSize: 15,
            color: "#8b90a0",
            marginBottom: 20,
          }}>
            Drop images, add items, or browse templates.
          </span>
          <Button variant="accent" onPress={() => setShowAddItem(true)}>
            Add your first item
          </Button>
        </div>
      )}

      {totalItems > 0 && (
        <Text>
          Drag items between tiers • Drop files to add • Double-click to edit •{" "}
          <Link isQuiet onPress={() => setShowKeyboardHelp(true)}>
            Keyboard shortcuts
          </Link>
        </Text>
      )}

      {/* Modals */}
      <ItemModal open={showAddItem} onClose={() => setShowAddItem(false)} mode="add" />
      <ItemModal open={!!editingItem} onClose={() => setEditingItem(null)} item={editingItem} mode="edit" />
      <TierSettingsModal open={showTierSettings} onClose={() => setShowTierSettings(false)} />

      {/* Keyboard Shortcuts Help Dialog */}
      <DialogTrigger isOpen={showKeyboardHelp} onOpenChange={(open) => !open && setShowKeyboardHelp(false)}>
        <span style={{ display: "none" }}><Button aria-hidden="true">Open</Button></span>
        <Dialog size="S">
          <Heading>Keyboard Shortcuts</Heading>
          <Content>
            <KeyboardShortcutsContent />
          </Content>
        </Dialog>
      </DialogTrigger>

      {/* Streaming Panel Dialog */}
      <DialogTrigger isOpen={showStreamingPanel} onOpenChange={(open) => !open && setShowStreamingPanel(false)}>
        <span style={{ display: "none" }}><Button aria-hidden="true">Open</Button></span>
        <Dialog size="S">
          <Heading>Stream Mode</Heading>
          <Content>
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
          </Content>
        </Dialog>
      </DialogTrigger>

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedCount={selection.length}
        tierOrder={tierOrder}
        tierLabels={tierLabels}
        tierColors={tierColors}
        onMoveToTier={handleBatchMoveToTier}
        onDelete={handleBatchDelete}
        onClear={() => dispatch(clearSelection())}
      />
    </div>
  );
};

// ============================================================================
// Keyboard Shortcuts Content (local to page — no export needed)
// ============================================================================

const KeyboardShortcutsContent: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div>
      <Heading level={4}>General</Heading>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
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
      <Heading level={4}>Head-to-Head</Heading>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
        <ShortcutRow keys={["←"]} description="Vote for left item" />
        <ShortcutRow keys={["→"]} description="Vote for right item" />
        <ShortcutRow keys={["Space"]} description="Skip pair" />
        <ShortcutRow keys={["Esc"]} description="Finish & apply" />
      </div>
    </div>
    <Text>Tip: Use ⌘ on Mac or Ctrl on Windows/Linux</Text>
  </div>
);

const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <Text>{description}</Text>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {keys.map((key, i) => (
        <Badge key={i} variant="neutral" fillStyle="outline">
          {key}
        </Badge>
      ))}
    </div>
  </div>
);
