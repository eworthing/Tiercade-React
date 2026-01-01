/**
 * Tier-related constants
 *
 * Centralized constants to avoid magic strings scattered across the codebase
 */

/** The tier ID that triggers celebration effects */
export const CELEBRATION_TIER_ID = "S";

/** The tier ID for unranked items */
export const UNRANKED_TIER_ID = "unranked";

/** Default tier order for new projects */
export const DEFAULT_TIER_ORDER = ["S", "A", "B", "C", "D", "F"] as const;

/** All tier IDs including unranked */
export const ALL_TIER_IDS = [...DEFAULT_TIER_ORDER, UNRANKED_TIER_ID] as const;

/** Default display labels for tiers */
export const DEFAULT_TIER_LABELS: Record<string, string> = {
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  F: "F",
  unranked: "Unranked",
};

/** Check if a tier ID is the celebration tier (case-insensitive) */
export function isCelebrationTier(tierName: string): boolean {
  return tierName.toLowerCase() === CELEBRATION_TIER_ID.toLowerCase();
}

/** Check if a tier ID is the unranked tier */
export function isUnrankedTier(tierName: string): boolean {
  return tierName === UNRANKED_TIER_ID;
}
