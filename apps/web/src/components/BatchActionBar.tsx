import React, { useState } from "react";
import {
  ActionBar,
  Button,
  DialogTrigger,
  AlertDialog,
  MenuTrigger,
  Menu,
  MenuItem,
} from "@react-spectrum/s2";

interface BatchActionBarProps {
  selectedCount: number;
  tierOrder: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string>;
  onMoveToTier: (tierName: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  tierOrder,
  tierLabels,
  onMoveToTier,
  onDelete,
  onClear,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleMoveToTier = (tierName: string) => {
    onMoveToTier(tierName);
  };

  return (
    <>
      <ActionBar
        selectedItemCount={selectedCount}
        onClearSelection={onClear}
        isEmphasized
        data-testid="batch-action-bar"
      >
        <MenuTrigger>
          <Button variant="secondary" size="S">
            Move to…
          </Button>
          <Menu
            aria-label="Move selected items"
            onAction={(key) => handleMoveToTier(String(key))}
          >
            {tierOrder.map((tierId) => (
              <MenuItem key={tierId} id={tierId}>
                {tierLabels[tierId] ?? tierId}
              </MenuItem>
            ))}
            <MenuItem id="unranked">Unranked</MenuItem>
          </Menu>
        </MenuTrigger>

        <Button variant="negative" fillStyle="outline" size="S" onPress={() => setShowDeleteConfirm(true)}>
          Delete
        </Button>
      </ActionBar>

      <DialogTrigger
        isOpen={showDeleteConfirm}
        onOpenChange={(isOpen) => !isOpen && setShowDeleteConfirm(false)}
      >
        <span style={{ display: "none" }}>
          <Button aria-hidden="true">Open</Button>
        </span>
        <AlertDialog
          title="Delete selected items"
          variant="destructive"
          primaryActionLabel="Delete"
          cancelLabel="Cancel"
          onPrimaryAction={() => {
            onDelete();
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        >
          {`Delete ${selectedCount} selected ${selectedCount === 1 ? "item" : "items"}? This can be undone.`}
        </AlertDialog>
      </DialogTrigger>
    </>
  );
};

BatchActionBar.displayName = "BatchActionBar";
