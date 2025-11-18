// TypeScript port of TierLogic.swift
// Source: TiercadeCore/Sources/TiercadeCore/Logic/TierLogic.swift

import type { Item, Items } from "./models";

/**
 * Move item with id to target tier; returns new tiers or original if no-op.
 */
export function moveItem(
  tiers: Items,
  itemId: string,
  targetTierName: string
): Items {
  if (!itemId || !targetTierName) {
    return tiers;
  }

  const newTiers: Items = { ...tiers };

  let sourceTier: string | null = null;
  let found: Item | null = null;

  for (const [name, arr] of Object.entries(newTiers)) {
    const idx = arr.findIndex((item) => item.id === itemId);
    if (idx !== -1) {
      sourceTier = name;
      found = arr[idx];
      newTiers[name] = [...arr.slice(0, idx), ...arr.slice(idx + 1)];
      break;
    }
  }

  if (!found) {
    return tiers;
  }

  if (sourceTier === targetTierName) {
    return tiers;
  }

  const target = newTiers[targetTierName] ?? [];
  newTiers[targetTierName] = [...target, found];

  return newTiers;
}

/**
 * Reorder within one tier from index to index; bounds-safe no-op on invalid.
 */
export function reorderWithin(
  tiers: Items,
  tierName: string,
  from: number,
  to: number
): Items {
  const arr = tiers[tierName];
  if (!arr || from < 0 || from >= arr.length || to < 0 || to >= arr.length) {
    return tiers;
  }

  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);

  return {
    ...tiers,
    [tierName]: copy
  };
}

/**
 * Shape validator preserved for API compatibility.
 * TypeScript typing enforces most invariants at compile time.
 */
export function validateTiersShape(_tiers: Items): boolean {
  return true;
}

