import React, { useState, useCallback, useEffect } from "react";
import { Modal, Button, Input, ImageUpload, ConfirmDialog } from "@tiercade/ui";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { updateItem, deleteItem, captureSnapshot } from "@tiercade/state";
import type { Item } from "@tiercade/core";

interface EditItemModalProps {
  open: boolean;
  onClose: () => void;
  item: Item | null;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  open,
  onClose,
  item,
}) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update form when item changes
  useEffect(() => {
    if (item) {
      setName(item.name ?? "");
      setImageUrl(item.imageUrl ?? null);
      setError(null);
    }
  }, [item]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!item) return;

      setError(null);

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Name is required");
        return;
      }

      // Check if anything changed
      const hasChanges =
        trimmedName !== (item.name ?? "") ||
        imageUrl !== (item.imageUrl ?? null);

      if (!hasChanges) {
        onClose();
        return;
      }

      // Capture snapshot for undo
      dispatch(captureSnapshot("Edit Item"));

      // Update the item
      dispatch(
        updateItem({
          itemId: item.id,
          updates: {
            name: trimmedName,
            imageUrl: imageUrl ?? undefined,
          },
        })
      );

      onClose();
    },
    [dispatch, item, name, imageUrl, onClose]
  );

  const handleDelete = useCallback(() => {
    if (!item) return;

    // Capture snapshot for undo
    dispatch(captureSnapshot("Delete Item"));

    // Delete the item
    dispatch(deleteItem(item.id));

    setShowDeleteConfirm(false);
    onClose();
  }, [dispatch, item, onClose]);

  const handleClose = useCallback(() => {
    setError(null);
    setShowDeleteConfirm(false);
    onClose();
  }, [onClose]);

  if (!item) return null;

  return (
    <>
      <Modal
        open={open && !showDeleteConfirm}
        onClose={handleClose}
        title="Edit Item"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            placeholder="Enter item name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error ?? undefined}
            autoFocus
          />

          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            maxSizeKB={500}
          />

          {/* Hidden submit button for form submission on Enter */}
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Item"
        message={`Are you sure you want to delete "${item.name ?? item.id}"? This action can be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
};
