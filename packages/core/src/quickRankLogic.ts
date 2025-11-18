// QuickRankLogic – thin wrapper around TierLogic for quick assignments.
// Source: TiercadeCore/Sources/TiercadeCore/Logic/QuickRankLogic.swift

import type { Items } from "./models";
import { moveItem } from "./tierLogic";

/**
 * Returns updated items after assigning an item by id into a tier.
 * If item already in target tier or not found, returns original tiers.
 */
export function assign(tiers: Items, itemId: string, tierName: string): Items {
  return moveItem(tiers, itemId, tierName);
}

