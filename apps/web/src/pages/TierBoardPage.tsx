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
  Menu,
  MenuItem,
  MenuTrigger,
  Text,
  Badge,
  ToastQueue,
} from "@react-spectrum/s2";
import Add from "@react-spectrum/s2/icons/Add";
import Settings from "@react-spectrum/s2/icons/Settings";
import Share from "@react-spectrum/s2/icons/Share";
import Download from "@react-spectrum/s2/icons/Download";
import Copy from "@react-spectrum/s2/icons/Copy";
import LinkIcon from "@react-spectrum/s2/icons/Link";
import MovieCamera from "@react-spectrum/s2/icons/MovieCamera";
import Addproject from "@react-spectrum/s2/illustrations/linear/Addproject";
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
  moveItemsBetweenTiers,
  deleteItems,
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
import { BatchActionBar } from "../components/BatchActionBar";
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

  // Load default project on mount if no tier data exists.
  useEffect(() => {
    const hasTierData = tierOrder.length > 0;
    const hasTierItems = Object.keys(tiers).length > 0;

    if (!hasTierData && !hasTierItems) {
      dispatch(loadDefaultProject());
    }
  }, [dispatch, tierOrder.length, tiers]);

  // Check for shared tier list in URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const hasShareParam = url.searchParams.has("share");
    if (!hasShareParam) return;

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
      ToastQueue.positive("Shared tier list loaded!");
    } else {
      clearShareDataFromUrl();
      ToastQueue.negative("Could not load shared tier list — the link may be corrupted.");
    }
  }, [dispatch]); // dispatch is stable

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
        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
          <IllustratedMessage>
            <Addproject />
            <Heading>Your tier list is empty</Heading>
            <Content>
              <Text>Add items to start ranking.</Text>
            </Content>
          <Button variant="accent" onPress={() => setShowAddItem(true)}>
            Add your first item
          </Button>
          </IllustratedMessage>
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

      {/* Modals - using unified ItemModal */}
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

      {/* Batch Action Bar - appears when items are selected */}
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
// Extracted Sub-components
// ============================================================================

interface TierBoardToolbarProps {
  totalItems: number;
  isExporting: boolean;
  isPresenting: boolean;
  onAddItem: () => void;
  onTierSettings: () => void;
  onExportPNG: () => void;
  onCopyImage: () => void;
  onCopyLink: () => void;
  onStreamMode: () => void;
}

const TierBoardToolbar: React.FC<TierBoardToolbarProps> = ({
  totalItems,
  isExporting,
  isPresenting,
  onAddItem,
  onTierSettings,
  onExportPNG,
  onCopyImage,
  onCopyLink,
  onStreamMode,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <ButtonGroup>
        <Button variant="accent" size="S" onPress={onAddItem}>
          <Add /> Add item
        </Button>
        <Button variant="secondary" size="S" onPress={onTierSettings}>
          <Settings /> Tiers
        </Button>

        {totalItems > 0 && (
          <MenuTrigger>
            <Button variant="secondary" size="S" isDisabled={isExporting}>
              <Share /> Share
            </Button>
            <Menu
              aria-label="Share"
              onAction={(key) => {
                const action = String(key);
                if (action === "download") onExportPNG();
                if (action === "copy-image") onCopyImage();
                if (action === "copy-link") onCopyLink();
              }}
            >
              <MenuItem id="download">
                <Download /> Download PNG
              </MenuItem>
              <MenuItem id="copy-image">
                <Copy /> Copy image
              </MenuItem>
              <MenuItem id="copy-link">
                <LinkIcon /> Copy link
              </MenuItem>
            </Menu>
          </MenuTrigger>
        )}

        <Button
          variant={isPresenting ? "accent" : "secondary"}
          size="S"
          onPress={onStreamMode}
        >
          <MovieCamera /> {isPresenting ? "Live" : "Stream"}
        </Button>
      </ButtonGroup>

      <Badge variant="neutral" fillStyle="subtle">
        {totalItems} items
      </Badge>
    </div>
  );
};

TierBoardToolbar.displayName = "TierBoardToolbar";

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
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100 }}>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute",
            inset: 0,
            filter: "blur(48px)",
            backgroundColor: "rgba(234, 179, 8, 0.3)",
            borderRadius: "50%"
          }} />
          <div style={{ fontSize: 48, animation: "bounce 1s infinite" }}>⭐</div>
        </div>
      </div>
      {CELEBRATION_PARTICLES.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: "absolute",
            fontSize: 24,
            left: particle.left,
            top: particle.top,
            animation: `confetti ${particle.duration}s ease-out forwards`,
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
