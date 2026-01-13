import React, { useCallback, useState } from "react";
import { MediaUpload, type MediaType as UIMediaType } from "@tiercade/ui";
import {
  Button,
  TextField,
  TextArea,
  Dialog,
  DialogTrigger,
  Heading,
  Content,
  ButtonGroup,
  AlertDialog,
} from "@react-spectrum/s2";
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
    (e?: React.FormEvent) => {
      e?.preventDefault();

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
      <DialogTrigger isOpen={open && !showDeleteConfirm} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <span style={{ display: "none" }}><Button aria-hidden="true">Open</Button></span>
        <Dialog size="M">
          <Heading>{title}</Heading>
          <Content>
            {description && (
              <p style={{ marginBottom: 16, color: "var(--spectrum-gray-700)" }}>
                {description}
              </p>
            )}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <TextField
                label="Item Name"
                placeholder="Enter item name..."
                value={values.name}
                onChange={setName}
                errorMessage={error ?? undefined}
                isInvalid={!!error}
                autoFocus
              />

              <TextField
                label="Season / Subtitle"
                placeholder="e.g., Season 1, (2019)..."
                value={values.seasonString}
                onChange={setSeasonString}
              />

              <TextArea
                label="Notes"
                placeholder="Add notes about this item..."
                value={values.description}
                onChange={setDescription}
              />

              <MediaUpload
                value={values.mediaUrl}
                mediaType={values.mediaType as UIMediaType | undefined}
                onChange={handleMediaChange}
                maxSizeKB={MAX_IMAGE_SIZE_KB}
                maxVideoSizeKB={MAX_VIDEO_SIZE_KB}
                allowVideo={true}
              />

              {/* Hidden submit button for form submission on Enter */}
              <button type="submit" style={{ display: "none" }} />
            </form>
          </Content>
          <ButtonGroup>
            {isEditMode && (
              <Button variant="negative" fillStyle="outline" onPress={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
            )}
            <Button variant="secondary" onPress={handleClose}>
              Cancel
            </Button>
            <Button variant="accent" onPress={() => handleSubmit()}>
              {submitLabel}
            </Button>
          </ButtonGroup>
        </Dialog>
      </DialogTrigger>

      {isEditMode && item && (
        <DialogTrigger isOpen={showDeleteConfirm} onOpenChange={(isOpen) => !isOpen && setShowDeleteConfirm(false)}>
          <span style={{ display: "none" }}><Button aria-hidden="true">Open</Button></span>
          <AlertDialog
            title="Delete Item"
            variant="destructive"
            primaryActionLabel="Delete"
            cancelLabel="Cancel"
            onPrimaryAction={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          >
            {`Are you sure you want to delete "${item.name ?? item.id}"? This action can be undone.`}
          </AlertDialog>
        </DialogTrigger>
      )}
    </>
  );
};

ItemModal.displayName = "ItemModal";
