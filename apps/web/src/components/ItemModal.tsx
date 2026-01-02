import React, { useCallback, useState } from "react";
import { Modal, Button, Input, MediaUpload, ConfirmDialog } from "@tiercade/ui";
import { generateId } from "@tiercade/core";
import { MAX_IMAGE_SIZE_KB, MAX_VIDEO_SIZE_KB } from "@tiercade/core";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useItemForm } from "../hooks/useItemForm";
import {
  addItemToUnranked,
  updateItem,
  deleteItem,
  captureSnapshot,
} from "@tiercade/state";
import type { Item, MediaType } from "@tiercade/core";

interface ItemModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Item to edit (null for add mode) */
  item?: Item | null;
  /** Mode of the modal - determined by presence of item if not specified */
  mode?: "add" | "edit";
}

/**
 * Unified modal for adding and editing items
 *
 * Replaces AddItemModal and EditItemModal with a single component
 */
export const ItemModal: React.FC<ItemModalProps> = ({
  open,
  onClose,
  item = null,
  mode: explicitMode,
}) => {
  const dispatch = useAppDispatch();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Determine mode from item presence if not explicitly set
  const mode = explicitMode ?? (item ? "edit" : "add");
  const isEditMode = mode === "edit";

  const {
    values,
    error,
    setName,
    setSeasonString,
    setDescription,
    handleMediaChange,
    validate,
    reset,
    hasChanges,
  } = useItemForm({ initialItem: item });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      const trimmedName = values.name.trim();
      const trimmedSeasonString = values.seasonString.trim();
      const trimmedDescription = values.description.trim();

      if (isEditMode && item) {
        // Edit mode - update existing item
        if (!hasChanges) {
          onClose();
          return;
        }

        dispatch(captureSnapshot("Edit Item"));

        // Build updates based on media type
        const updates: Partial<Item> = {
          name: trimmedName,
          seasonString: trimmedSeasonString || undefined,
          description: trimmedDescription || undefined,
          mediaType: values.mediaUrl ? values.mediaType : undefined,
          // Clear other media types when changing
          imageUrl: undefined,
          videoUrl: undefined,
          audioUrl: undefined,
        };

        if (values.mediaUrl) {
          if (values.mediaType === "video") {
            updates.videoUrl = values.mediaUrl;
          } else if (values.mediaType === "audio") {
            updates.audioUrl = values.mediaUrl;
          } else {
            updates.imageUrl = values.mediaUrl;
          }
        }

        dispatch(updateItem({ itemId: item.id, updates }));
      } else {
        // Add mode - create new item
        dispatch(captureSnapshot("Add Item"));

        const newItem: Item = {
          id: generateId("item"),
          name: trimmedName,
        };

        if (trimmedSeasonString) {
          newItem.seasonString = trimmedSeasonString;
        }
        if (trimmedDescription) {
          newItem.description = trimmedDescription;
        }

        if (values.mediaUrl) {
          newItem.mediaType = values.mediaType;
          if (values.mediaType === "video") {
            newItem.videoUrl = values.mediaUrl;
          } else if (values.mediaType === "audio") {
            newItem.audioUrl = values.mediaUrl;
          } else {
            newItem.imageUrl = values.mediaUrl;
          }
        }

        dispatch(addItemToUnranked(newItem));
      }

      reset();
      onClose();
    },
    [dispatch, item, isEditMode, values, validate, hasChanges, reset, onClose]
  );

  const handleDelete = useCallback(() => {
    if (!item) return;

    dispatch(captureSnapshot("Delete Item"));
    dispatch(deleteItem(item.id));

    setShowDeleteConfirm(false);
    onClose();
  }, [dispatch, item, onClose]);

  const handleClose = useCallback(() => {
    reset();
    setShowDeleteConfirm(false);
    onClose();
  }, [reset, onClose]);

  const title = isEditMode ? "Edit Item" : "Add Item";
  const description = isEditMode ? undefined : "Add a new item to your tier list";
  const submitLabel = isEditMode ? "Save Changes" : "Add Item";

  // Don't render edit modal without an item
  if (isEditMode && !item) return null;

  return (
    <>
      <Modal
        open={open && !showDeleteConfirm}
        onClose={handleClose}
        title={title}
        description={description}
        size="md"
        className="!bg-slate-950/90 !backdrop-blur-2xl !border-white/10 !shadow-2xl overflow-hidden ring-1 ring-white/5"
        footer={
          isEditMode ? (
            <div className="flex items-center justify-end w-full gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="mr-auto text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/20 text-white font-medium tracking-wide rounded-xl border-t border-white/10"
              >
                {submitLabel}
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/20 text-white font-medium tracking-wide rounded-xl border-t border-white/10"
              >
                {submitLabel}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Item Name"
            placeholder="Enter item name..."
            value={values.name}
            onChange={(e) => setName(e.target.value)}
            error={error ?? undefined}
            autoFocus
            className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/20 focus:!ring-purple-500/50 focus:!border-purple-500/50 hover:!border-white/20 !rounded-xl transition-all"
          />

          <Input
            label="Season / Subtitle"
            placeholder="e.g., Season 1, (2019)..."
            value={values.seasonString}
            onChange={(e) => setSeasonString(e.target.value)}
            className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/20 focus:!ring-purple-500/50 focus:!border-purple-500/50 hover:!border-white/20 !rounded-xl transition-all"
          />

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 pl-1">
              Notes
            </label>
            <textarea
              placeholder="Add notes about this item..."
              value={values.description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-3 !bg-white/5 border !border-white/10 !rounded-xl !text-white placeholder:!text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all hover:border-white/20"
              rows={3}
            />
          </div>

          <MediaUpload
            value={values.mediaUrl}
            mediaType={values.mediaType as any}
            onChange={handleMediaChange}
            maxSizeKB={MAX_IMAGE_SIZE_KB}
            maxVideoSizeKB={MAX_VIDEO_SIZE_KB}
            allowVideo={true}
            className="rounded-xl overflow-hidden"
            dropzoneClassName="!bg-white/5 !border-white/10 hover:!border-purple-500/50 hover:!bg-white/10 transition-all !rounded-xl !text-white/60"
          />

          {/* Hidden submit button for form submission on Enter */}
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {isEditMode && item && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          title="Delete Item"
          message={`Are you sure you want to delete "${item.name ?? item.id}"? This action can be undone.`}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </>
  );
};

ItemModal.displayName = "ItemModal";
