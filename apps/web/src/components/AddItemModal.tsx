import React, { useState, useCallback } from "react";
import { Modal, Button, Input, ImageUpload } from "@tiercade/ui";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { addItemToUnranked } from "@tiercade/state";
import { captureSnapshot } from "@tiercade/state";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Name is required");
        return;
      }

      // Generate a unique ID
      const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Capture snapshot for undo
      dispatch(captureSnapshot("Add Item"));

      // Add the item
      dispatch(
        addItemToUnranked({
          id,
          name: trimmedName,
          imageUrl: imageUrl ?? undefined,
        })
      );

      // Reset form and close
      setName("");
      setImageUrl(null);
      onClose();
    },
    [dispatch, name, imageUrl, onClose]
  );

  const handleClose = useCallback(() => {
    setName("");
    setImageUrl(null);
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Item"
      description="Add a new item to your tier list"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Add Item
          </Button>
        </>
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
  );
};
