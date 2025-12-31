import React, { useState, useCallback } from "react";
import { Modal, Button, Input, ConfirmDialog } from "@tiercade/ui";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  updateTierLabel,
  updateTierColor,
  addTier,
  removeTier,
  reorderTiers,
  captureSnapshot,
} from "@tiercade/state";

interface TierSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

// Preset tier configurations
const PRESETS = [
  {
    name: "S-A-B-C-D-F",
    tiers: [
      { id: "S", label: "S", color: "#FF6B6B" },
      { id: "A", label: "A", color: "#FFA94D" },
      { id: "B", label: "B", color: "#FFE066" },
      { id: "C", label: "C", color: "#69DB7C" },
      { id: "D", label: "D", color: "#74C0FC" },
      { id: "F", label: "F", color: "#B197FC" },
    ],
  },
  {
    name: "1-2-3-4-5",
    tiers: [
      { id: "1", label: "1st", color: "#FFD700" },
      { id: "2", label: "2nd", color: "#C0C0C0" },
      { id: "3", label: "3rd", color: "#CD7F32" },
      { id: "4", label: "4th", color: "#69DB7C" },
      { id: "5", label: "5th", color: "#74C0FC" },
    ],
  },
  {
    name: "Gold-Silver-Bronze",
    tiers: [
      { id: "gold", label: "Gold", color: "#FFD700" },
      { id: "silver", label: "Silver", color: "#C0C0C0" },
      { id: "bronze", label: "Bronze", color: "#CD7F32" },
    ],
  },
];

// Common tier colors
const COLOR_PALETTE = [
  "#FF6B6B", // Red
  "#FFA94D", // Orange
  "#FFE066", // Yellow
  "#69DB7C", // Green
  "#74C0FC", // Blue
  "#B197FC", // Purple
  "#F783AC", // Pink
  "#63E6BE", // Teal
  "#868E96", // Gray
];

export const TierSettingsModal: React.FC<TierSettingsModalProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const tierOrder = useAppSelector((state) => state.tier.tierOrder);
  const tierLabels = useAppSelector((state) => state.tier.tierLabels);
  const tierColors = useAppSelector((state) => state.tier.tierColors);
  const tiers = useAppSelector((state) => state.tier.tiers);

  const [newTierName, setNewTierName] = useState("");
  const [newTierColor, setNewTierColor] = useState(COLOR_PALETTE[0]);
  const [tierToDelete, setTierToDelete] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState("");

  const handleAddTier = useCallback(() => {
    const trimmedName = newTierName.trim();
    if (!trimmedName) return;

    // Generate a unique ID
    const id = `tier-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

    dispatch(captureSnapshot("Add Tier"));
    dispatch(
      addTier({
        tierId: id,
        label: trimmedName,
        color: newTierColor,
      })
    );

    setNewTierName("");
    // Cycle to next color
    const currentIndex = COLOR_PALETTE.indexOf(newTierColor);
    setNewTierColor(COLOR_PALETTE[(currentIndex + 1) % COLOR_PALETTE.length]);
  }, [dispatch, newTierName, newTierColor]);

  const handleDeleteTier = useCallback(() => {
    if (!tierToDelete) return;

    dispatch(captureSnapshot("Remove Tier"));
    dispatch(removeTier(tierToDelete));
    setTierToDelete(null);
  }, [dispatch, tierToDelete]);

  const handleColorChange = useCallback(
    (tierId: string, color: string) => {
      dispatch(captureSnapshot("Change Tier Color"));
      dispatch(updateTierColor({ tierId, color }));
    },
    [dispatch]
  );

  const handleLabelSave = useCallback(() => {
    if (!editingLabel) return;

    const trimmedLabel = editingLabelValue.trim();
    if (trimmedLabel && trimmedLabel !== tierLabels[editingLabel]) {
      dispatch(captureSnapshot("Rename Tier"));
      dispatch(updateTierLabel({ tierId: editingLabel, label: trimmedLabel }));
    }

    setEditingLabel(null);
    setEditingLabelValue("");
  }, [dispatch, editingLabel, editingLabelValue, tierLabels]);

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const newOrder = [...tierOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      dispatch(captureSnapshot("Reorder Tiers"));
      dispatch(reorderTiers(newOrder));
    },
    [dispatch, tierOrder]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= tierOrder.length - 1) return;
      const newOrder = [...tierOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      dispatch(captureSnapshot("Reorder Tiers"));
      dispatch(reorderTiers(newOrder));
    },
    [dispatch, tierOrder]
  );

  const handleApplyPreset = useCallback(
    (preset: typeof PRESETS[0]) => {
      dispatch(captureSnapshot("Apply Tier Preset"));
      // This is a simplified implementation - in production you'd want
      // to handle existing items and tiers more carefully
      preset.tiers.forEach((tier, index) => {
        if (!tierOrder.includes(tier.id)) {
          dispatch(
            addTier({
              tierId: tier.id,
              label: tier.label,
              color: tier.color,
              insertAt: index,
            })
          );
        } else {
          dispatch(updateTierLabel({ tierId: tier.id, label: tier.label }));
          dispatch(updateTierColor({ tierId: tier.id, color: tier.color }));
        }
      });
    },
    [dispatch, tierOrder]
  );

  const tierToDeleteInfo = tierToDelete
    ? {
        label: tierLabels[tierToDelete] ?? tierToDelete,
        itemCount: tiers[tierToDelete]?.length ?? 0,
      }
    : null;

  return (
    <>
      <Modal
        open={open && !tierToDelete}
        onClose={onClose}
        title="Tier Settings"
        description="Customize your tier list structure"
        size="lg"
      >
        <div className="space-y-6">
          {/* Existing Tiers */}
          <div>
            <h3 className="text-sm font-medium text-text mb-3">Tiers</h3>
            <div className="space-y-2">
              {tierOrder.map((tierId, index) => (
                <div
                  key={tierId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised border border-border"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-0.5 text-text-subtle hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === tierOrder.length - 1}
                      className="p-0.5 text-text-subtle hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Color picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={tierColors[tierId] ?? "#1e293b"}
                      onChange={(e) => handleColorChange(tierId, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                      title="Change color"
                    />
                  </div>

                  {/* Label */}
                  {editingLabel === tierId ? (
                    <input
                      type="text"
                      value={editingLabelValue}
                      onChange={(e) => setEditingLabelValue(e.target.value)}
                      onBlur={handleLabelSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleLabelSave();
                        if (e.key === "Escape") {
                          setEditingLabel(null);
                          setEditingLabelValue("");
                        }
                      }}
                      className="flex-1 px-2 py-1 bg-surface border border-border rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLabel(tierId);
                        setEditingLabelValue(tierLabels[tierId] ?? tierId);
                      }}
                      className="flex-1 text-left text-text hover:text-accent transition-colors"
                    >
                      {tierLabels[tierId] ?? tierId}
                    </button>
                  )}

                  {/* Item count */}
                  <span className="text-xs text-text-subtle">
                    {tiers[tierId]?.length ?? 0} items
                  </span>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => setTierToDelete(tierId)}
                    disabled={tierOrder.length <= 1}
                    className="p-1.5 text-text-subtle hover:text-danger disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Delete tier"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Tier */}
          <div>
            <h3 className="text-sm font-medium text-text mb-3">Add New Tier</h3>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newTierColor}
                onChange={(e) => setNewTierColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                title="Tier color"
              />
              <Input
                placeholder="Tier name..."
                value={newTierName}
                onChange={(e) => setNewTierName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTier();
                }}
                className="flex-1"
              />
              <Button
                variant="primary"
                onClick={handleAddTier}
                disabled={!newTierName.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Presets */}
          <div>
            <h3 className="text-sm font-medium text-text mb-3">Quick Presets</h3>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-raised border border-border text-text-muted hover:text-text hover:border-text-subtle transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!tierToDelete}
        onConfirm={handleDeleteTier}
        onCancel={() => setTierToDelete(null)}
        title="Delete Tier"
        message={
          tierToDeleteInfo
            ? `Are you sure you want to delete "${tierToDeleteInfo.label}"? ${
                tierToDeleteInfo.itemCount > 0
                  ? `${tierToDeleteInfo.itemCount} item(s) will be moved to Unranked.`
                  : ""
              }`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
};
