import React, { useState, useCallback } from "react";
import {
  ActionButton,
  Badge,
  Button,
  ButtonGroup,
  Picker,
  PickerItem,
  Text,
  TextField,
  Dialog,
  DialogTrigger,
  Heading,
  Content,
  AlertDialog,
} from "@react-spectrum/s2";
import ChevronUp from "@react-spectrum/s2/icons/ChevronUp";
import ChevronDown from "@react-spectrum/s2/icons/ChevronDown";
import Delete from "@react-spectrum/s2/icons/Delete";
import Edit from "@react-spectrum/s2/icons/Edit";
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
            <Text>Customize your tier list structure</Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Existing Tiers */}
              <div>
                <Heading level={3}>Tiers</Heading>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tierOrder.map((tierId, index) => (
                    <div
                      key={tierId}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 8, backgroundColor: "var(--spectrum-gray-100)", border: "1px solid var(--spectrum-gray-300)" }}
                    >
                      {/* Reorder buttons */}
                      <ButtonGroup aria-label="Reorder tier" orientation="vertical">
                        <ActionButton
                          isQuiet
                          onPress={() => handleMoveUp(index)}
                          isDisabled={index === 0}
                          aria-label="Move up"
                        >
                          <ChevronUp />
                        </ActionButton>
                        <ActionButton
                          isQuiet
                          onPress={() => handleMoveDown(index)}
                          isDisabled={index === tierOrder.length - 1}
                          aria-label="Move down"
                        >
                          <ChevronDown />
                        </ActionButton>
                      </ButtonGroup>

                      {/* Color picker */}
                      <Picker
                        aria-label="Tier color"
                        selectedKey={tierColors[tierId] ?? "#1e293b"}
                        onSelectionChange={(key) => handleColorChange(tierId, String(key))}
                      >
                        {TIER_COLOR_PALETTE.map((color) => (
                          <PickerItem key={color} id={color}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                aria-hidden="true"
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 3,
                                  backgroundColor: color,
                                  border: "1px solid var(--spectrum-gray-400)",
                                }}
                              />
                              {color.toUpperCase()}
                            </div>
                          </PickerItem>
                        ))}
                      </Picker>

                      {/* Label */}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                        {editingLabel === tierId ? (
                          <TextField
                            aria-label="Tier label"
                            value={editingLabelValue}
                            onChange={setEditingLabelValue}
                            onBlur={handleLabelSave}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleLabelSave();
                              if (e.key === "Escape") {
                                setEditingLabel(null);
                                setEditingLabelValue("");
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <>
                            <Text>{tierLabels[tierId] ?? tierId}</Text>
                            <ActionButton
                              isQuiet
                              onPress={() => {
                                setEditingLabel(tierId);
                                setEditingLabelValue(tierLabels[tierId] ?? tierId);
                              }}
                              aria-label="Edit tier label"
                            >
                              <Edit />
                            </ActionButton>
                          </>
                        )}
                      </div>

                      {/* Item count */}
                      <Badge variant="neutral" fillStyle="subtle">
                        {tiers[tierId]?.length ?? 0}
                      </Badge>

                      {/* Delete button */}
                      <ActionButton
                        onPress={() => setTierToDelete(tierId)}
                        isDisabled={tierOrder.length <= 1}
                        aria-label="Delete tier"
                      >
                        <Delete />
                      </ActionButton>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Tier */}
              <div>
                <Heading level={3}>Add New Tier</Heading>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Picker
                    label="Color"
                    selectedKey={newTierColor}
                    onSelectionChange={(key) => setNewTierColor(String(key))}
                  >
                    {TIER_COLOR_PALETTE.map((color) => (
                      <PickerItem key={color} id={color}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            aria-hidden="true"
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 3,
                              backgroundColor: color,
                              border: "1px solid var(--spectrum-gray-400)",
                            }}
                          />
                          {color.toUpperCase()}
                        </div>
                      </PickerItem>
                    ))}
                  </Picker>

                  <TextField
                    label="Name"
                    placeholder="Tier name…"
                    value={newTierName}
                    onChange={setNewTierName}
                  />
                  <Button variant="accent" onPress={handleAddTier} isDisabled={!newTierName.trim()}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Presets */}
              <div>
                <Heading level={3}>Quick Presets</Heading>
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
