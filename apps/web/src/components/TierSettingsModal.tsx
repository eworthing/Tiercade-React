import React, { useState, useCallback } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogTrigger,
  Heading,
  Content,
  AlertDialog,
} from "@react-spectrum/s2";
import { TIER_COLOR_PALETTE, TIER_PRESETS } from "@tiercade/theme";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  updateTierLabel,
  updateTierColor,
  addTier,
  removeTier,
  reorderTiers,
  captureSnapshot,
  selectTierOrder,
  selectTierLabels,
  selectTierColors,
  selectTiers,
} from "@tiercade/state";

interface TierSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const TierSettingsModal: React.FC<TierSettingsModalProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const tierOrder = useAppSelector(selectTierOrder);
  const tierLabels = useAppSelector(selectTierLabels);
  const tierColors = useAppSelector(selectTierColors);
  const tiers = useAppSelector(selectTiers);

  const [newTierName, setNewTierName] = useState("");
  const [newTierColor, setNewTierColor] = useState<string>(TIER_COLOR_PALETTE[0]);
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
    const currentIndex = TIER_COLOR_PALETTE.indexOf(newTierColor as typeof TIER_COLOR_PALETTE[number]);
    setNewTierColor(TIER_COLOR_PALETTE[(currentIndex + 1) % TIER_COLOR_PALETTE.length]);
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
    (preset: typeof TIER_PRESETS[number]) => {
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
      <DialogTrigger isOpen={open && !tierToDelete} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <span style={{ display: "none" }}><Button aria-hidden="true">Open</Button></span>
        <Dialog size="L">
          <Heading>Tier Settings</Heading>
          <Content>
            <p style={{ marginBottom: 16, color: "var(--spectrum-gray-700)" }}>
              Customize your tier list structure
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Existing Tiers */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Tiers</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tierOrder.map((tierId, index) => (
                    <div
                      key={tierId}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 8, backgroundColor: "var(--spectrum-gray-100)", border: "1px solid var(--spectrum-gray-300)" }}
                    >
                      {/* Reorder buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          style={{ padding: 2, opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? "not-allowed" : "pointer" }}
                          aria-label="Move up"
                        >
                          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === tierOrder.length - 1}
                          style={{ padding: 2, opacity: index === tierOrder.length - 1 ? 0.3 : 1, cursor: index === tierOrder.length - 1 ? "not-allowed" : "pointer" }}
                          aria-label="Move down"
                        >
                          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Color picker */}
                      <input
                        type="color"
                        value={tierColors[tierId] ?? "#1e293b"}
                        onChange={(e) => handleColorChange(tierId, e.target.value)}
                        style={{ width: 32, height: 32, borderRadius: 4, cursor: "pointer", border: "none", backgroundColor: "transparent" }}
                        title="Change color"
                      />

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
                          style={{ flex: 1, padding: "4px 8px", backgroundColor: "var(--spectrum-gray-50)", border: "1px solid var(--spectrum-gray-400)", borderRadius: 4, fontSize: 14 }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLabel(tierId);
                            setEditingLabelValue(tierLabels[tierId] ?? tierId);
                          }}
                          style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                        >
                          {tierLabels[tierId] ?? tierId}
                        </button>
                      )}

                      {/* Item count */}
                      <span style={{ fontSize: 12, color: "var(--spectrum-gray-600)" }}>
                        {tiers[tierId]?.length ?? 0} items
                      </span>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setTierToDelete(tierId)}
                        disabled={tierOrder.length <= 1}
                        style={{ padding: 6, opacity: tierOrder.length <= 1 ? 0.3 : 1, cursor: tierOrder.length <= 1 ? "not-allowed" : "pointer", color: "var(--spectrum-negative-color-900)" }}
                        aria-label="Delete tier"
                      >
                        <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Tier */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Add New Tier</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="color"
                    value={newTierColor}
                    onChange={(e) => setNewTierColor(e.target.value)}
                    style={{ width: 40, height: 40, borderRadius: 4, cursor: "pointer", border: "none", backgroundColor: "transparent" }}
                    title="Tier color"
                  />
                  <TextField
                    label=" "
                    placeholder="Tier name..."
                    value={newTierName}
                    onChange={setNewTierName}
                  />
                  <Button
                    variant="accent"
                    onPress={handleAddTier}
                    isDisabled={!newTierName.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Presets */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Quick Presets</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {TIER_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="secondary"
                      size="S"
                      onPress={() => handleApplyPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Content>
        </Dialog>
      </DialogTrigger>

      <DialogTrigger isOpen={!!tierToDelete} onOpenChange={(isOpen) => !isOpen && setTierToDelete(null)}>
        <span style={{ display: "none" }}><Button aria-hidden="true">Open</Button></span>
        <AlertDialog
          title="Delete Tier"
          variant="destructive"
          primaryActionLabel="Delete"
          cancelLabel="Cancel"
          onPrimaryAction={handleDeleteTier}
          onCancel={() => setTierToDelete(null)}
        >
          {tierToDeleteInfo
            ? `Are you sure you want to delete "${tierToDeleteInfo.label}"? ${
                tierToDeleteInfo.itemCount > 0
                  ? `${tierToDeleteInfo.itemCount} item(s) will be moved to Unranked.`
                  : ""
              }`
            : ""}
        </AlertDialog>
      </DialogTrigger>
    </>
  );
};
