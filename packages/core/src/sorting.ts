// Sorting utilities for tier items.
// Source: TiercadeCore/Sources/TiercadeCore/Logic/Sorting.swift

import type { Item, Items, GlobalSortMode } from "./models";
import { AttributeType } from "./models";
import { compareStrings, compareWithNulls } from "./utils/comparison";

/**
 * Sort items according to the specified global sort mode.
 * Returns original array when mode is custom.
 */
export function sortItems(items: Item[], mode: GlobalSortMode): Item[] {
  switch (mode.type) {
    case "custom":
      return items;
    case "alphabetical":
      return sortAlphabetical(items, mode.ascending);
    case "byAttribute":
      return sortByAttribute(
        items,
        mode.key,
        mode.ascending,
        mode.attributeType
      );
    default: {
      const _exhaustive: never = mode;
      return items;
    }
  }
}

function sortAlphabetical(items: Item[], ascending: boolean): Item[] {
  const copy = [...items];
  copy.sort((lhs, rhs) => {
    const lhsName = lhs.name ?? lhs.id;
    const rhsName = rhs.name ?? rhs.id;
    const comparison = lhsName.localeCompare(rhsName, undefined, {
      sensitivity: "base",
      numeric: true
    });
    if (comparison === 0) return 0;
    const direction = comparison < 0 ? -1 : 1;
    return ascending ? direction : -direction as -1 | 1;
  });
  return copy;
}

function sortByAttribute(
  items: Item[],
  key: string,
  ascending: boolean,
  type: AttributeType
): Item[] {
  const copy = [...items];
  copy.sort((lhs, rhs) => {
    let result: number;
    switch (type) {
      case AttributeType.String:
        result = compareStringAttribute(lhs, rhs, key);
        break;
      case AttributeType.Number:
        result = compareNumberAttribute(lhs, rhs, key);
        break;
      case AttributeType.Bool:
        result = compareBoolAttribute(lhs, rhs, key);
        break;
      case AttributeType.Date:
        result = compareDateAttribute(lhs, rhs, key);
        break;
      default: {
        const _exhaustive: never = type;
        result = 0;
      }
    }

    if (result < 0) {
      return ascending ? -1 : 1;
    }
    if (result > 0) {
      return ascending ? 1 : -1;
    }

    // Stable tie-breaker: by name, then id
    const nameComparison = (lhs.name ?? lhs.id).localeCompare(
      rhs.name ?? rhs.id,
      undefined,
      { sensitivity: "base", numeric: true }
    );
    if (nameComparison !== 0) {
      return nameComparison < 0 ? -1 : 1;
    }
    return compareStrings(lhs.id, rhs.id);
  });

  return copy;
}

function compareStringAttribute(lhs: Item, rhs: Item, key: string): number {
  const lhsVal = extractStringValue(lhs, key);
  const rhsVal = extractStringValue(rhs, key);

  if (lhsVal == null && rhsVal == null) return 0;
  if (lhsVal == null) return 1;
  if (rhsVal == null) return -1;

  return lhsVal.localeCompare(rhsVal, undefined, {
    sensitivity: "base",
    numeric: true
  });
}

function compareNumberAttribute(lhs: Item, rhs: Item, key: string): number {
  const lhsVal = extractNumberValue(lhs, key);
  const rhsVal = extractNumberValue(rhs, key);

  if (lhsVal == null && rhsVal == null) return 0;
  if (lhsVal == null) return 1;
  if (rhsVal == null) return -1;

  if (lhsVal < rhsVal) return -1;
  if (lhsVal > rhsVal) return 1;
  return 0;
}

function compareBoolAttribute(lhs: Item, rhs: Item, key: string): number {
  const lhsVal = extractBoolValue(lhs, key);
  const rhsVal = extractBoolValue(rhs, key);

  if (lhsVal == null && rhsVal == null) return 0;
  if (lhsVal == null) return 1;
  if (rhsVal == null) return -1;

  // false < true
  if (!lhsVal && rhsVal) return -1;
  if (lhsVal && !rhsVal) return 1;
  return 0;
}

function compareDateAttribute(lhs: Item, rhs: Item, key: string): number {
  const lhsVal = extractDateValue(lhs, key);
  const rhsVal = extractDateValue(rhs, key);

  if (lhsVal == null && rhsVal == null) return 0;
  if (lhsVal == null) return 1;
  if (rhsVal == null) return -1;

  const lhsTime = lhsVal.getTime();
  const rhsTime = rhsVal.getTime();
  if (lhsTime < rhsTime) return -1;
  if (lhsTime > rhsTime) return 1;
  return 0;
}

// Value extraction mirrors Swift's extract* helpers

function extractStringValue(item: Item, key: string): string | undefined {
  switch (key) {
    case "name":
      return item.name ?? undefined;
    case "seasonString":
      return item.seasonString ?? undefined;
    case "status":
      return item.status ?? undefined;
    case "description":
      return item.description ?? undefined;
    default:
      return undefined;
  }
}

function extractNumberValue(item: Item, key: string): number | undefined {
  switch (key) {
    case "seasonNumber":
      return item.seasonNumber ?? undefined;
    default:
      return undefined;
  }
}

function extractBoolValue(_item: Item, _key: string): boolean | undefined {
  // Currently Item doesn't expose bool attributes in the Swift model.
  return undefined;
}

function extractDateValue(_item: Item, _key: string): Date | undefined {
  // Currently Item doesn't expose date attributes in the Swift model.
  return undefined;
}

/**
 * Discover sortable attributes present in ≥70% of items across all tiers.
 * Mirrors Sorting.discoverSortableAttributes(in: Items).
 */
export function discoverSortableAttributes(allItems: Items): Record<string, AttributeType> {
  const flatItems = Object.values(allItems).flat();
  if (flatItems.length === 0) return {};

  const totalCount = flatItems.length;
  const threshold = Math.ceil(totalCount * 0.7);

  const attributeCounts: Record<string, number> = {};
  const attributeTypes: Record<string, AttributeType> = {};

  for (const item of flatItems) {
    if (item.name != null) {
      attributeCounts["name"] = (attributeCounts["name"] ?? 0) + 1;
      attributeTypes["name"] = AttributeType.String;
    }
    if (item.status != null) {
      attributeCounts["status"] = (attributeCounts["status"] ?? 0) + 1;
      attributeTypes["status"] = AttributeType.String;
    }
    if (item.description != null) {
      attributeCounts["description"] = (attributeCounts["description"] ?? 0) + 1;
      attributeTypes["description"] = AttributeType.String;
    }
  }

  const result: Record<string, AttributeType> = {};
  for (const [key, count] of Object.entries(attributeCounts)) {
    if (count >= threshold) {
      const type = attributeTypes[key];
      if (type != null) {
        result[key] = type;
      }
    }
  }

  return result;
}
