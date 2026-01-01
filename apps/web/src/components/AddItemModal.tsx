import React, { useState, useCallback } from "react";
import { Modal, Button, Input, MediaUpload, type MediaType } from "@tiercade/ui";
import { generateId } from "@tiercade/core";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { addItemToUnranked, captureSnapshot } from "@tiercade/state";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [error, setError] = useState<string | null>(null);

  const handleMediaChange = useCallback((url: string | null, type: MediaType) => {
    setMediaUrl(url);
    setMediaType(type);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Name is required");
        return;
      }

      const id = generateId("item");

      // Capture snapshot for undo
      dispatch(captureSnapshot("Add Item"));

      // Build item based on media type
      const item: {
        id: string;
        name: string;
        imageUrl?: string;
        videoUrl?: string;
        mediaType?: MediaType;
      } = {
        id,
        name: trimmedName,
      };

      if (mediaUrl) {
        if (mediaType === "video") {
          item.videoUrl = mediaUrl;
        } else {
          item.imageUrl = mediaUrl;
        }
        item.mediaType = mediaType;
      }

      // Add the item
      dispatch(addItemToUnranked(item));

      // Reset form and close
      setName("");
      setMediaUrl(null);
      setMediaType("image");
      onClose();
    },
    [dispatch, name, mediaUrl, mediaType, onClose]
  );

  const handleClose = useCallback(() => {
    setName("");
    setMediaUrl(null);
    setMediaType("image");
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

        <MediaUpload
          value={mediaUrl}
          mediaType={mediaType}
          onChange={handleMediaChange}
          maxSizeKB={500}
          maxVideoSizeKB={5000}
          allowVideo={true}
        />

        {/* Hidden submit button for form submission on Enter */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
};
