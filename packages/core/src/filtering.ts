// Filtering utilities for tier items.

import type { Item, Items, MediaType } from "./models";

/**
 * Filter configuration for tier items.
 */
export interface ItemFilters {
  /** Text search across name, description, status */
  searchText?: string;
  /** Filter by media type (image, gif, video, audio) */
  mediaTypes?: MediaType[];
  /** Filter by status values */
  statuses?: string[];
  /** Show only items with media */
  hasMedia?: boolean;
  /** Show only items without media */
  noMedia?: boolean;
}

/**
 * Check if any filters are active.
 */
export function hasActiveFilters(filters: ItemFilters): boolean {
  return !!(
    (filters.searchText && filters.searchText.trim().length > 0) ||
    (filters.mediaTypes && filters.mediaTypes.length > 0) ||
    (filters.statuses && filters.statuses.length > 0) ||
    filters.hasMedia ||
    filters.noMedia
  );
}

/**
 * Filter a single item against the filter configuration.
 */
export function itemMatchesFilters(item: Item, filters: ItemFilters): boolean {
  // Text search
  if (filters.searchText && filters.searchText.trim().length > 0) {
    const searchLower = filters.searchText.toLowerCase().trim();
    const nameMatch = item.name?.toLowerCase().includes(searchLower) ?? false;
    const descMatch = item.description?.toLowerCase().includes(searchLower) ?? false;
    const statusMatch = item.status?.toLowerCase().includes(searchLower) ?? false;
    const idMatch = item.id.toLowerCase().includes(searchLower);

    if (!nameMatch && !descMatch && !statusMatch && !idMatch) {
      return false;
    }
  }

  // Media type filter
  if (filters.mediaTypes && filters.mediaTypes.length > 0) {
    const itemMediaType = getItemMediaType(item);
    if (!itemMediaType || !filters.mediaTypes.includes(itemMediaType)) {
      return false;
    }
  }

  // Status filter
  if (filters.statuses && filters.statuses.length > 0) {
    if (!item.status || !filters.statuses.includes(item.status)) {
      return false;
    }
  }

  // Has media filter
  if (filters.hasMedia) {
    if (!itemHasMedia(item)) {
      return false;
    }
  }

  // No media filter
  if (filters.noMedia) {
    if (itemHasMedia(item)) {
      return false;
    }
  }

  return true;
}

/**
 * Filter an array of items.
 */
export function filterItems(items: Item[], filters: ItemFilters): Item[] {
  if (!hasActiveFilters(filters)) {
    return items;
  }
  return items.filter((item) => itemMatchesFilters(item, filters));
}

/**
 * Filter all tiers, returning filtered Items structure.
 */
export function filterAllTiers(tiers: Items, filters: ItemFilters): Items {
  if (!hasActiveFilters(filters)) {
    return tiers;
  }

  const result: Items = {};
  for (const [tierName, items] of Object.entries(tiers)) {
    result[tierName] = filterItems(items, filters);
  }
  return result;
}

/**
 * Get the media type of an item based on its URLs.
 */
function getItemMediaType(item: Item): MediaType | null {
  if (item.mediaType) {
    return item.mediaType;
  }

  if (item.videoUrl) return "video";
  if (item.audioUrl) return "audio";
  if (item.imageUrl) {
    // Check if it's a GIF
    if (item.imageUrl.toLowerCase().includes(".gif") ||
        item.imageUrl.startsWith("data:image/gif")) {
      return "gif";
    }
    return "image";
  }

  return null;
}

/**
 * Check if an item has any media.
 */
function itemHasMedia(item: Item): boolean {
  return !!(item.imageUrl || item.videoUrl || item.audioUrl);
}

/**
 * Discover unique statuses across all items.
 */
export function discoverStatuses(tiers: Items): string[] {
  const statuses = new Set<string>();

  for (const items of Object.values(tiers)) {
    for (const item of items) {
      if (item.status) {
        statuses.add(item.status);
      }
    }
  }

  return Array.from(statuses).sort();
}

/**
 * Count items matching filters per tier.
 */
export function countFilteredItems(tiers: Items, filters: ItemFilters): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const [tierName, items] of Object.entries(tiers)) {
    counts[tierName] = filterItems(items, filters).length;
  }

  return counts;
}
