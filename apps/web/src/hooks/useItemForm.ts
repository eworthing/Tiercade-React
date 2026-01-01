import { useState, useCallback, useEffect, useMemo } from "react";
import type { Item, MediaType } from "@tiercade/core";

interface ItemFormValues {
  name: string;
  mediaUrl: string | null;
  mediaType: MediaType;
  seasonString: string;
  description: string;
}

interface UseItemFormOptions {
  /** Initial values for edit mode */
  initialItem?: Item | null;
}

interface UseItemFormResult {
  /** Current form values */
  values: ItemFormValues;
  /** Form error message */
  error: string | null;
  /** Update the name field */
  setName: (name: string) => void;
  /** Update the season string field */
  setSeasonString: (seasonString: string) => void;
  /** Update the description field */
  setDescription: (description: string) => void;
  /** Handle media upload change */
  handleMediaChange: (url: string | null, type: MediaType) => void;
  /** Validate the form and return whether it's valid */
  validate: () => boolean;
  /** Reset the form to initial/empty state */
  reset: () => void;
  /** Clear the error */
  clearError: () => void;
  /** Check if form has changes from initial values */
  hasChanges: boolean;
}

/**
 * Custom hook for item form state management
 *
 * Used by both Add and Edit item modals to share form logic
 */
export function useItemForm({
  initialItem = null,
}: UseItemFormOptions = {}): UseItemFormResult {
  const [name, setName] = useState("");
  const [seasonString, setSeasonString] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [error, setError] = useState<string | null>(null);

  // Update form when initialItem changes (for edit mode)
  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name ?? "");
      setSeasonString(initialItem.seasonString ?? "");
      setDescription(initialItem.description ?? "");
      // Determine media type and URL from item
      if (initialItem.videoUrl) {
        setMediaUrl(initialItem.videoUrl);
        setMediaType("video");
      } else if (initialItem.audioUrl) {
        setMediaUrl(initialItem.audioUrl);
        setMediaType("audio");
      } else if (initialItem.imageUrl) {
        setMediaUrl(initialItem.imageUrl);
        setMediaType(initialItem.mediaType === "gif" ? "gif" : "image");
      } else {
        setMediaUrl(null);
        setMediaType("image");
      }
      setError(null);
    } else {
      // Reset for add mode
      setName("");
      setSeasonString("");
      setDescription("");
      setMediaUrl(null);
      setMediaType("image");
      setError(null);
    }
  }, [initialItem]);

  const handleMediaChange = useCallback((url: string | null, type: MediaType) => {
    setMediaUrl(url);
    setMediaType(type);
  }, []);

  const validate = useCallback((): boolean => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return false;
    }
    setError(null);
    return true;
  }, [name]);

  const reset = useCallback(() => {
    setName("");
    setSeasonString("");
    setDescription("");
    setMediaUrl(null);
    setMediaType("image");
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if form has changes from initial values (memoized for performance)
  const hasChanges = useMemo(() => {
    if (!initialItem) {
      return name.trim() !== "" || seasonString.trim() !== "" || description.trim() !== "" || mediaUrl !== null;
    }

    const trimmedName = name.trim();
    const trimmedSeasonString = seasonString.trim();
    const trimmedDescription = description.trim();
    const oldMediaUrl = initialItem.videoUrl ?? initialItem.audioUrl ?? initialItem.imageUrl ?? null;
    const oldMediaType = initialItem.mediaType ?? "image";

    return (
      trimmedName !== (initialItem.name ?? "") ||
      trimmedSeasonString !== (initialItem.seasonString ?? "") ||
      trimmedDescription !== (initialItem.description ?? "") ||
      mediaUrl !== oldMediaUrl ||
      mediaType !== oldMediaType
    );
  }, [name, seasonString, description, mediaUrl, mediaType, initialItem]);

  return {
    values: {
      name,
      mediaUrl,
      mediaType,
      seasonString,
      description,
    },
    error,
    setName,
    setSeasonString,
    setDescription,
    handleMediaChange,
    validate,
    reset,
    clearError,
    hasChanges,
  };
}
