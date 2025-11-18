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
 */
export function analyzeTierDistribution(
  tiers: Items,
  tierOrder: string[]
): TierAnalytics {
  const distribution: TierDistribution[] = [];
  let totalItems = 0;

  // Calculate counts for each tier
  for (const tierName of tierOrder) {
    const items = tiers[tierName] || [];
    totalItems += items.length;
    distribution.push({
      tierName,
      itemCount: items.length,
      percentage: 0, // Will calculate after we know total
    });
  }

  // Add unranked if it exists and has items
  const unranked = tiers["unranked"] || [];
  if (unranked.length > 0) {
    totalItems += unranked.length;
    distribution.push({
      tierName: "unranked",
      itemCount: unranked.length,
      percentage: 0,
    });
  }

  // Calculate percentages
  for (const tier of distribution) {
    tier.percentage = totalItems > 0 ? (tier.itemCount / totalItems) * 100 : 0;
  }

  // Find largest and smallest tiers
  const nonEmpty = distribution.filter((t) => t.itemCount > 0);
  const largest = nonEmpty.reduce(
    (max, tier) => (tier.itemCount > max.itemCount ? tier : max),
    nonEmpty[0] || { tierName: "", itemCount: 0 }
  );
  const smallest = nonEmpty.reduce(
    (min, tier) => (tier.itemCount < min.itemCount ? tier : min),
    nonEmpty[0] || { tierName: "", itemCount: 0 }
  );

  const emptyTiers = distribution
    .filter((t) => t.itemCount === 0)
    .map((t) => t.tierName);

  return {
    totalItems,
    totalTiers: tierOrder.length,
    distribution,
    averageItemsPerTier: tierOrder.length > 0 ? totalItems / tierOrder.length : 0,
    largestTier: { name: largest.tierName, count: largest.itemCount },
    smallestTier: { name: smallest.tierName, count: smallest.itemCount },
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
