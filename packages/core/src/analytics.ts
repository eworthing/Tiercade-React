/**
 * Analytics helpers for tier list analysis
 * Provides statistics and insights about tier distributions
 */

import type { Items, Item } from "./models";

export interface TierDistribution {
  tierName: string;
  itemCount: number;
  percentage: number;
}

export interface TierAnalytics {
  totalItems: number;
  totalTiers: number;
  distribution: TierDistribution[];
  averageItemsPerTier: number;
  largestTier: { name: string; count: number };
  smallestTier: { name: string; count: number };
  emptyTiers: string[];
}

export interface ItemSeasonStats {
  totalSeasons: number;
  seasonsRepresented: Set<string>;
  mostCommonSeason: string | null;
  seasonDistribution: Record<string, number>;
}

/**
 * Calculate tier distribution statistics
 * Single-pass algorithm: collects counts and tracks min/max/empty in one iteration
 */
export function analyzeTierDistribution(
  tiers: Items,
  tierOrder: string[]
): TierAnalytics {
  const distribution: TierDistribution[] = [];
  const emptyTiers: string[] = [];
  let totalItems = 0;
  let largest = { name: "", count: 0 };
  let smallest = { name: "", count: Infinity };

  // Single pass: collect counts, track min/max/empty simultaneously
  for (const tierName of tierOrder) {
    const items = tiers[tierName] || [];
    const count = items.length;
    totalItems += count;
    distribution.push({
      tierName,
      itemCount: count,
      percentage: 0, // Calculated after total is known
    });

    if (count === 0) {
      emptyTiers.push(tierName);
    } else {
      if (count > largest.count) {
        largest = { name: tierName, count };
      }
      if (count < smallest.count) {
        smallest = { name: tierName, count };
      }
    }
  }

  // Add unranked if it exists and has items
  const unranked = tiers["unranked"] || [];
  if (unranked.length > 0) {
    const count = unranked.length;
    totalItems += count;
    distribution.push({
      tierName: "unranked",
      itemCount: count,
      percentage: 0,
    });
    if (count > largest.count) {
      largest = { name: "unranked", count };
    }
    if (count < smallest.count) {
      smallest = { name: "unranked", count };
    }
  }

  // Calculate percentages (unavoidable second pass, but simple)
  if (totalItems > 0) {
    for (const tier of distribution) {
      tier.percentage = (tier.itemCount / totalItems) * 100;
    }
  }

  // Handle edge case: no non-empty tiers
  if (smallest.count === Infinity) {
    smallest = { name: "", count: 0 };
  }

  return {
    totalItems,
    totalTiers: tierOrder.length,
    distribution,
    averageItemsPerTier: tierOrder.length > 0 ? totalItems / tierOrder.length : 0,
    largestTier: largest,
    smallestTier: smallest,
    emptyTiers,
  };
}

/**
 * Analyze season distribution across all items
 */
export function analyzeSeasonDistribution(tiers: Items): ItemSeasonStats {
  const seasonCounts: Record<string, number> = {};
  const seasonsSet = new Set<string>();

  // Collect all items
  const allItems: Item[] = Object.values(tiers).flat();

  for (const item of allItems) {
    const season =
      item.seasonString || (item.seasonNumber?.toString() ?? null);
    if (season) {
      seasonsSet.add(season);
      seasonCounts[season] = (seasonCounts[season] || 0) + 1;
    }
  }

  // Find most common season
  let mostCommonSeason: string | null = null;
  let maxCount = 0;
  for (const [season, count] of Object.entries(seasonCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonSeason = season;
    }
  }

  return {
    totalSeasons: seasonsSet.size,
    seasonsRepresented: seasonsSet,
    mostCommonSeason,
    seasonDistribution: seasonCounts,
  };
}

/**
 * Generate a text summary of tier analytics
 */
export function generateAnalyticsSummary(analytics: TierAnalytics): string {
  const lines: string[] = [];

  lines.push(`Total Items: ${analytics.totalItems}`);
  lines.push(`Total Tiers: ${analytics.totalTiers}`);
  lines.push(
    `Average Items per Tier: ${analytics.averageItemsPerTier.toFixed(1)}`
  );
  lines.push("");

  lines.push("Tier Distribution:");
  for (const tier of analytics.distribution) {
    lines.push(
      `  ${tier.tierName}: ${tier.itemCount} items (${tier.percentage.toFixed(1)}%)`
    );
  }

  if (analytics.emptyTiers.length > 0) {
    lines.push("");
    lines.push(`Empty Tiers: ${analytics.emptyTiers.join(", ")}`);
  }

  lines.push("");
  lines.push(
    `Largest Tier: ${analytics.largestTier.name} (${analytics.largestTier.count} items)`
  );
  lines.push(
    `Smallest Tier: ${analytics.smallestTier.name} (${analytics.smallestTier.count} items)`
  );

  return lines.join("\n");
}

/**
 * Check if tier list is balanced (no tier has more than 2x the average)
 */
export function isTierListBalanced(analytics: TierAnalytics): boolean {
  if (analytics.totalItems === 0) return true;

  const threshold = analytics.averageItemsPerTier * 2;
  return analytics.distribution.every((tier) => tier.itemCount <= threshold);
}

/**
 * Get tier balance score (0-100, higher is more balanced)
 */
export function getTierBalanceScore(analytics: TierAnalytics): number {
  if (analytics.totalItems === 0 || analytics.totalTiers === 0) return 100;

  // Calculate standard deviation of tier sizes
  const mean = analytics.averageItemsPerTier;
  const variance =
    analytics.distribution.reduce((sum, tier) => {
      const diff = tier.itemCount - mean;
      return sum + diff * diff;
    }, 0) / analytics.totalTiers;

  const stdDev = Math.sqrt(variance);

  // Normalize to 0-100 scale (lower stdDev = higher score)
  // A perfectly balanced list has stdDev = 0
  // stdDev equal to mean would be quite unbalanced
  const maxStdDev = mean;
  const normalizedStdDev = Math.min(stdDev / maxStdDev, 1);
  const score = Math.round((1 - normalizedStdDev) * 100);

  return Math.max(0, Math.min(100, score));
}
