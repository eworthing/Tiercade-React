// Head-to-head logic core types and basic helpers.
// Full implementation will mirror TiercadeCore HeadToHead.swift and its internals.

import type { Item, Items } from "./models";
import { pickRandomPair } from "./randomUtils";

export interface HeadToHeadRecord {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface HeadToHeadMetrics {
  wins: number;
  comparisons: number;
  winRate: number;
  wilsonLB: number;
  wilsonUB: number;
  nameKey: string;
  id: string;
}

export interface Prior {
  alpha: number;
  beta: number;
}

export interface RefinementCutContext {
  quantCuts: number[];
  refinedCuts: number[];
  primaryCuts: number[];
  totalComparisons: number;
  requiredComparisons: number;
  churn: number;
  itemCount: number;
}

export interface HeadToHeadFrontier {
  index: number;
  upperRange: [number, number];
  lowerRange: [number, number];
}

export type HeadToHeadMode = "quick" | "done";

export interface HeadToHeadArtifacts {
  mode: HeadToHeadMode;
  tierNames: string[];
  rankable: Item[];
  undersampled: Item[];
  provisionalCuts: number[];
  frontier: HeadToHeadFrontier[];
  warmUpComparisons: number;
}

export interface HeadToHeadQuickResult {
  tiers: Items;
  artifacts: HeadToHeadArtifacts | null;
  suggestedPairs: [Item, Item][];
}

export const UNRANKED_TIER_ID = "unranked";

// Tunable constants (port of HeadToHeadLogic.Tun)
export const Tun = {
  maximumTierCount: 20,
  minimumComparisonsPerItem: 2,
  frontierWidth: 2,
  zQuick: 1.0,
  zStd: 1.28,
  zRefineEarly: 1.0,
  softOverlapEps: 0.01,
  confBonusBeta: 0.1,
  maxSuggestedPairs: 6,
  hysteresisMaxChurnSoft: 0.12,
  hysteresisMaxChurnHard: 0.25,
  hysteresisRampBoost: 0.5,
  minWilsonRangeForSplit: 0.015,
  epsTieTop: 0.012,
  epsTieBottom: 0.01,
  maxBottomTieWidth: 4,
  ubBottomCeil: 0.2
} as const;

/**
 * Two-phase tiering entry point (quick pass).
 * Partial implementation matching Swift HeadToHeadLogic.quickTierPass
 * (excluding refinement suggestions for now).
 */
export function quickTierPass(
  pool: Item[],
  records: Map<string, HeadToHeadRecord>,
  tierOrder: string[],
  baseTiers: Items
): HeadToHeadQuickResult {
  if (pool.length === 0) {
    return { tiers: baseTiers, artifacts: null, suggestedPairs: [] };
  }

  const tierNames = normalizedTierNames(tierOrder);
  if (tierNames.length === 0) {
    return { tiers: baseTiers, artifacts: null, suggestedPairs: [] };
  }

  const { rankable, undersampled } = partitionByComparisons(
    pool,
    records,
    Tun.minimumComparisonsPerItem
  );

  let tiers = clearedTiers(baseTiers, pool, tierNames);

  if (rankable.length === 0) {
    return quickResultForUndersampled(
      tiers,
      undersampled,
      baseTiers,
      tierOrder,
      records
    );
  }

  const priors = buildPriors(baseTiers, tierOrder);
  const metrics = metricsDictionary(rankable, records, Tun.zQuick, priors);
  const ordered = orderedItems(rankable, metrics);
  const operativeNames = operativeTierNames(tierNames);
  const tierCount = operativeNames.length;

  const cuts = quantileCuts(ordered.length, tierCount);
  assignByCuts(ordered, cuts, operativeNames, tiers);
  sortTierMembers(tiers, metrics, operativeNames);

  appendUndersampled(undersampled, tiers, records, priors);

  const artifacts = makeQuickArtifacts(
    ordered,
    undersampled,
    operativeNames,
    cuts,
    metrics
  );

  const limit = suggestedPairLimit(artifacts);
  const suggested = refinementPairs(artifacts, records, limit);

  return {
    tiers,
    artifacts,
    suggestedPairs: suggested
  };
}

/**
 * Generates suggested pairs for refinement based on artifacts and frontier.
 * Full implementation matching HeadToHeadLogic.refinementPairs.
 */
export function refinementPairs(
  artifacts: HeadToHeadArtifacts,
  records: Map<string, HeadToHeadRecord>,
  limit: number
): [Item, Item][] {
  if (
    artifacts.mode === "done" ||
    artifacts.rankable.length === 0 ||
    artifacts.frontier.length === 0 ||
    limit <= 0
  ) {
    return [];
  }

  const metrics = metricsDictionary(
    artifacts.rankable,
    records,
    Tun.zQuick
  );
  const ordered = orderedItems(artifacts.rankable, metrics);

  const seen = new Set<PairKey>();
  const results = forcedBoundaryPairs(ordered, metrics, limit, seen);

  if (results.length >= limit) {
    return results.slice(0, limit);
  }

  const candidates = frontierCandidatePairs(artifacts, metrics, seen);
  const remaining = Math.max(0, limit - results.length);
  const additional = candidates.slice(0, remaining).map((c) => c.pair);

  return [...results, ...additional];
}

function suggestedPairLimit(artifacts: HeadToHeadArtifacts): number {
  const cutsNeeded = Math.max(artifacts.tierNames.length - 1, 1);
  return Math.max(Tun.maxSuggestedPairs, cutsNeeded);
}

// Additional refinement helpers

export function averageComparisons(
  artifacts: HeadToHeadArtifacts,
  records: Map<string, HeadToHeadRecord>
): number {
  if (artifacts.rankable.length === 0) return 0;
  let total = 0;
  for (const item of artifacts.rankable) {
    const record = records.get(item.id);
    total += record?.total ?? 0;
  }
  return total / artifacts.rankable.length;
}

export function totalComparisons(
  ordered: Item[],
  metrics: Record<string, HeadToHeadMetrics>
): number {
  let total = 0;
  for (const item of ordered) {
    const metric = metrics[item.id];
    total += metric?.comparisons ?? 0;
  }
  return total;
}

export function bottomClusterStart(
  ordered: Item[],
  metrics: Record<string, HeadToHeadMetrics>
): number | null {
  if (ordered.length < 2) return null;
  const n = ordered.length;
  const maxWidth = Math.min(Tun.maxBottomTieWidth, n);
  const tail = ordered.slice(n - maxWidth, n);

  for (let i = 0; i < tail.length; i += 1) {
    const item = tail[i]!;
    const metric = metrics[item.id];
    if (metric && metric.wilsonUB > Tun.ubBottomCeil) {
      const globalIndex = n - maxWidth + i;
      return globalIndex;
    }
  }

  return null;
}

export function mergeCutsPreferRefined(
  primary: number[],
  tierCount: number,
  itemCount: number,
  metrics: Record<string, HeadToHeadMetrics>,
  ordered: Item[]
): number[] {
  const needed = tierCount - 1;
  if (primary.length >= needed) {
    return primary.slice(0, needed);
  }

  const quant = quantileCuts(itemCount, tierCount);
  const merged = new Set([...primary, ...quant]);
  const sorted = Array.from(merged).sort((a, b) => a - b);

  return sorted.slice(0, needed);
}

export function adjustedRefinedCuts(
  primaryCuts: number[],
  quantCuts: number[],
  tierCount: number,
  ordered: Item[],
  metrics: Record<string, HeadToHeadMetrics>
): number[] {
  if (primaryCuts.length === 0) return quantCuts;

  let refined = mergeCutsPreferRefined(
    primaryCuts,
    tierCount,
    ordered.length,
    metrics,
    ordered
  );

  if (refined.length >= tierCount - 1) {
    const start = bottomClusterStart(ordered, metrics);
    if (start !== null) {
      const lastIndex = refined.length - 1;
      const previousCut = lastIndex > 0 ? refined[lastIndex - 1]! : 0;
      if (start > previousCut && start < ordered.length) {
        refined[lastIndex] = start;
        refined = Array.from(new Set(refined)).sort((a, b) => a - b);
      }
    }
  }

  return refined.length === 0 ? quantCuts : refined;
}

interface RefinementComputation {
  metrics: Record<string, HeadToHeadMetrics>;
  ordered: Item[];
  totalComparisons: number;
  quantCuts: number[];
  refinedCuts: number[];
  primaryCuts: number[];
  overlapEps: number;
  averageComparisons: number;
  zRefine: number;
}

export function makeRefinementComputation(
  artifacts: HeadToHeadArtifacts,
  records: Map<string, HeadToHeadRecord>,
  tierCount: number,
  requiredComparisons: number
): RefinementComputation {
  const average = averageComparisons(artifacts, records);
  const zRefine = average < 3.0 ? Tun.zRefineEarly : Tun.zStd;
  const metrics = metricsDictionary(artifacts.rankable, records, zRefine);
  const ordered = orderedItems(artifacts.rankable, metrics);
  const total = totalComparisons(ordered, metrics);
  const quantCuts = quantileCuts(ordered.length, tierCount);
  const overlapEps = total >= requiredComparisons ? Tun.softOverlapEps : 0.0;
  const primary = dropCuts(ordered, metrics, tierCount, overlapEps);
  const refined = adjustedRefinedCuts(
    primary,
    quantCuts,
    tierCount,
    ordered,
    metrics
  );

  return {
    metrics,
    ordered,
    totalComparisons: total,
    quantCuts,
    refinedCuts: refined,
    primaryCuts: primary,
    overlapEps,
    averageComparisons: average,
    zRefine
  };
}

export function makeRefinedArtifacts(
  artifacts: HeadToHeadArtifacts,
  ordered: Item[],
  cuts: number[],
  _metrics: Record<string, HeadToHeadMetrics>
): HeadToHeadArtifacts {
  return {
    tierNames: artifacts.tierNames,
    rankable: ordered,
    undersampled: artifacts.undersampled,
    provisionalCuts: cuts,
    frontier: buildAudits(ordered.length, cuts, Tun.frontierWidth),
    warmUpComparisons: artifacts.warmUpComparisons,
    mode: "done"
  };
}

/**
 * Finalization entry point applying refinement results.
 * Full implementation matching HeadToHeadLogic.finalizeTiers.
 */
export function finalizeTiers(
  artifacts: HeadToHeadArtifacts,
  records: Map<string, HeadToHeadRecord>,
  tierOrder: string[],
  baseTiers: Items
): { tiers: Items; updatedArtifacts: HeadToHeadArtifacts } {
  if (artifacts.rankable.length === 0) {
    return { tiers: baseTiers, updatedArtifacts: artifacts };
  }

  const tierNames = normalizedTierNames(tierOrder);
  const tiers = clearedTiers(
    baseTiers,
    [...artifacts.rankable, ...artifacts.undersampled],
    tierNames
  );

  const tierCount = artifacts.tierNames.length;
  const computation = makeRefinementComputation(
    artifacts,
    records,
    tierCount,
    artifacts.warmUpComparisons
  );

  const quantMap = tierMapForCuts(
    computation.ordered,
    computation.quantCuts,
    tierCount
  );
  const refinedMap = tierMapForCuts(
    computation.ordered,
    computation.refinedCuts,
    tierCount
  );
  const churn = churnFraction(quantMap, refinedMap, computation.ordered);

  const context: RefinementCutContext = {
    quantCuts: computation.quantCuts,
    refinedCuts: computation.refinedCuts,
    primaryCuts: computation.primaryCuts,
    totalComparisons: computation.totalComparisons,
    requiredComparisons: artifacts.warmUpComparisons,
    churn,
    itemCount: computation.ordered.length
  };

  const cuts = selectRefinedCuts(context);

  assignByCuts(computation.ordered, cuts, artifacts.tierNames, tiers);
  sortTierMembers(tiers, computation.metrics, artifacts.tierNames);

  if (artifacts.undersampled.length > 0) {
    const undersampledMetrics = metricsDictionary(
      artifacts.undersampled,
      records,
      Tun.zStd
    );
    tiers[UNRANKED_TIER_ID] = orderedItems(
      artifacts.undersampled,
      undersampledMetrics
    );
  }

  const updated = makeRefinedArtifacts(
    artifacts,
    computation.ordered,
    cuts,
    computation.metrics
  );

  return { tiers, updatedArtifacts: updated };
}

/**
 * Pick a random pair from a pool, rerolling duplicate indices.
 * Mirrors HeadToHeadLogic.pickPair (delegates to RandomUtils.pickRandomPair).
 */
export function pickPair(
  pool: Item[],
  rng: () => number
): [Item, Item] | null {
  return pickRandomPair(pool, rng);
}

/**
 * Returns all unique unordered pairs from the pool, shuffled with the given RNG.
 * Mirrors HeadToHeadLogic.pairings.
 */
export function pairings(
  pool: Item[],
  rng: () => number
): [Item, Item][] {
  if (pool.length < 2) {
    return [];
  }
  const combinations: [Item, Item][] = [];
  for (let i = 0; i < pool.length - 1; i += 1) {
    const left = pool[i];
    for (let j = i + 1; j < pool.length; j += 1) {
      combinations.push([left, pool[j]]);
    }
  }
  if (combinations.length <= 1) {
    return combinations;
  }

  const shuffled = [...combinations];
  let idx = shuffled.length - 1;
  while (idx > 0) {
    const random = Math.floor(rng() * (idx + 1));
    const tmp = shuffled[idx];
    shuffled[idx] = shuffled[random];
    shuffled[random] = tmp;
    idx -= 1;
  }
  return shuffled;
}

/**
 * Tally a vote between two contenders, updating win/loss records.
 * Mirrors HeadToHeadLogic.vote.
 */
export function vote(
  a: Item,
  b: Item,
  winner: Item,
  records: Map<string, HeadToHeadRecord>
): void {
  const ensureRecord = (id: string): HeadToHeadRecord => {
    const existing = records.get(id);
    if (existing) {
      return existing;
    }
    const created: HeadToHeadRecord = {
      wins: 0,
      losses: 0,
      total: 0,
      winRate: 0
    };
    records.set(id, created);
    return created;
  };

  if (winner.id === a.id) {
    const recA = ensureRecord(a.id);
    const recB = ensureRecord(b.id);
    recA.wins += 1;
    recB.losses += 1;
  } else {
    const recA = ensureRecord(a.id);
    const recB = ensureRecord(b.id);
    recB.wins += 1;
    recA.losses += 1;
  }

  // Recompute total/winRate for updated records.
  const recompute = (id: string): void => {
    const rec = records.get(id);
    if (!rec) return;
    rec.total = rec.wins + rec.losses;
    rec.winRate = rec.total === 0 ? 0 : rec.wins / rec.total;
  };
  recompute(a.id);
  recompute(b.id);
}

// --- Internal math helpers ported from HeadToHead+Internals.swift ---

export function wilsonLowerBound(
  wins: number,
  total: number,
  z: number
): number {
  if (total <= 0) return 0;
  const p = wins / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = p + z2 / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  return Math.max(0, (center - margin) / denominator);
}

export function wilsonUpperBound(
  wins: number,
  total: number,
  z: number
): number {
  if (total <= 0) return 0;
  const p = wins / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = p + z2 / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  return Math.min(1, (center + margin) / denominator);
}

export function tierMapForCuts(
  ordered: Item[],
  cuts: number[],
  tierCount: number
): Record<string, number> {
  const map: Record<string, number> = {};
  let tierIndex = 0;
  let cursor = 0;
  ordered.forEach((item, index) => {
    while (cursor < cuts.length && index >= cuts[cursor]!) {
      tierIndex += 1;
      cursor += 1;
    }
    map[item.id] = Math.min(tierIndex + 1, tierCount);
  });
  return map;
}

export function churnFraction(
  oldMap: Record<string, number>,
  newMap: Record<string, number>,
  universe: Item[]
): number {
  if (universe.length === 0) return 0;
  let moved = 0;
  for (const item of universe) {
    const oldTier = oldMap[item.id] ?? 0;
    const newTier = newMap[item.id] ?? 0;
    if (oldTier !== newTier) {
      moved += 1;
    }
  }
  return moved / universe.length;
}

export function dropCuts(
  ordered: Item[],
  metrics: Record<string, HeadToHeadMetrics>,
  tierCount: number,
  overlapEps: number
): number[] {
  if (tierCount <= 1 || ordered.length < 2) return [];
  const scored: Array<{ index: number; score: number }> = [];

  for (let i = 0; i < ordered.length - 1; i += 1) {
    const upper = metrics[ordered[i]!.id];
    const lower = metrics[ordered[i + 1]!.id];
    if (!upper || !lower) continue;

    const raw = upper.wilsonLB - lower.wilsonUB + overlapEps;
    const delta = Math.max(0, raw);
    if (delta <= 0) continue;

    const minComparisons = Math.min(upper.comparisons, lower.comparisons);
    const maxComparisons = Math.max(upper.comparisons, lower.comparisons);
    const confidence = minComparisons + Tun.confBonusBeta * maxComparisons;
    const score = delta * Math.log1p(Math.max(confidence, 0));
    if (score > 0) {
      scored.push({ index: i + 1, score });
    }
  }

  if (scored.length === 0) return [];
  const sorted = scored.sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, tierCount - 1).map((s) => s.index);
  return Array.from(new Set(top)).sort((a, b) => a - b);
}

export function selectRefinedCuts(context: RefinementCutContext): number[] {
  const decisionsSoFar = context.totalComparisons;
  const required = Math.max(context.requiredComparisons, 1);

  if (decisionsSoFar < required) {
    return context.quantCuts;
  }

  const ramp = Math.min(1, decisionsSoFar / required);
  const softOK = context.churn <= Tun.hysteresisMaxChurnSoft;
  const hardOK =
    context.churn <= Tun.hysteresisMaxChurnHard * ramp;
  const smallN = context.itemCount <= 16;
  const canUseRefined =
    context.primaryCuts.length > 0 && (smallN || softOK || hardOK);

  if (!canUseRefined || context.refinedCuts.length === 0) {
    return context.quantCuts;
  }
  return context.refinedCuts;
}

export function priorMeanForTier(
  name: string,
  index: number,
  total: number
): number {
  const defaults: Record<string, number> = {
    S: 0.85,
    A: 0.75,
    B: 0.65,
    C: 0.55,
    D: 0.45,
    E: 0.4,
    F: 0.35
  };
  const existing = defaults[name];
  if (existing != null) return existing;
  const top = 0.85;
  const bottom = 0.35;
  const denom = Math.max(1, total - 1);
  return top - ((top - bottom) * index) / denom;
}

export function buildPriors(
  currentTiers: Items,
  tierOrder: string[],
  strength = 6
): Record<string, Prior> {
  const output: Record<string, Prior> = {};
  tierOrder.forEach((name, index) => {
    const members = currentTiers[name];
    if (!members || members.length === 0) return;
    const mean = priorMeanForTier(name, index, tierOrder.length);
    const alpha = Math.max(0, mean * strength);
    const beta = Math.max(0, (1 - mean) * strength);
    members.forEach((item) => {
      output[item.id] = { alpha, beta };
    });
  });
  return output;
}

export function metricsDictionary(
  items: Item[],
  records: Map<string, HeadToHeadRecord>,
  z: number,
  priors?: Record<string, Prior>
): Record<string, HeadToHeadMetrics> {
  const dict: Record<string, HeadToHeadMetrics> = {};
  const usePriors = priors !== undefined;

  for (const item of items) {
    const record = records.get(item.id) ?? {
      wins: 0,
      losses: 0,
      total: 0,
      winRate: 0
    };

    const trimmedName = item.name?.trim();
    const keySource =
      trimmedName && trimmedName.length > 0 ? trimmedName : item.id;

    if (usePriors) {
      const prior = priors![item.id] ?? { alpha: 0, beta: 0 };
      const effectiveWins = record.wins + prior.alpha;
      const effectiveLosses = record.losses + prior.beta;
      const effectiveTotal = effectiveWins + effectiveLosses;

      dict[item.id] = {
        wins: record.wins,
        comparisons: record.total,
        winRate: record.total === 0 ? 0 : record.wins / record.total,
        wilsonLB: wilsonLowerBound(effectiveWins, effectiveTotal, z),
        wilsonUB: wilsonUpperBound(effectiveWins, effectiveTotal, z),
        nameKey: keySource.toLowerCase(),
        id: item.id
      };
    } else {
      dict[item.id] = {
        wins: record.wins,
        comparisons: record.total,
        winRate: record.winRate,
        wilsonLB: wilsonLowerBound(record.wins, record.total, z),
        wilsonUB: wilsonUpperBound(record.wins, record.total, z),
        nameKey: keySource.toLowerCase(),
        id: item.id
      };
    }
  }

  return dict;
}

export function orderedItems(
  items: Item[],
  metrics: Record<string, HeadToHeadMetrics>
): Item[] {
  const copy = [...items];
  copy.sort((lhs, rhs) => {
    const left = metrics[lhs.id];
    const right = metrics[rhs.id];
    if (!left || !right) {
      return lhs.id < rhs.id ? -1 : lhs.id > rhs.id ? 1 : 0;
    }
    if (left.wilsonLB !== right.wilsonLB) {
      return left.wilsonLB > right.wilsonLB ? -1 : 1;
    }
    if (left.comparisons !== right.comparisons) {
      return left.comparisons > right.comparisons ? -1 : 1;
    }
    if (left.wins !== right.wins) {
      return left.wins > right.wins ? -1 : 1;
    }
    if (left.nameKey !== right.nameKey) {
      return left.nameKey < right.nameKey ? -1 : 1;
    }
    if (left.id !== right.id) {
      return left.id < right.id ? -1 : 1;
    }
    return 0;
  });
  return copy;
}

export function quantileCuts(
  count: number,
  tierCount: number
): number[] {
  if (tierCount <= 1 || count <= 1) return [];
  const cuts: number[] = [];
  for (let i = 1; i < tierCount; i += 1) {
    const position = Math.round((i * count) / tierCount);
    if (position > 0 && position < count) {
      cuts.push(position);
    }
  }
  return Array.from(new Set(cuts)).sort((a, b) => a - b);
}

export function buildAudits(
  orderedCount: number,
  cuts: number[],
  width: number
): HeadToHeadFrontier[] {
  return cuts.map((cut) => {
    const upperStart = Math.max(0, cut - width);
    const upperEnd = cut;
    const lowerStart = cut;
    const lowerEnd = Math.min(orderedCount, cut + width);
    return {
      index: cut,
      upperRange: [upperStart, upperEnd],
      lowerRange: [lowerStart, lowerEnd]
    };
  });
}

export function warmUpComparisons(
  rankableCount: number,
  tierCount: number
): number {
  return Math.max(
    Math.ceil(1.5 * rankableCount),
    2 * tierCount
  );
}

export function quickResultForUndersampled(
  tiers: Items,
  undersampled: Item[],
  baseTiers: Items,
  tierOrder: string[],
  records: Map<string, HeadToHeadRecord>
): HeadToHeadQuickResult {
  if (undersampled.length === 0) {
    return { tiers, artifacts: null, suggestedPairs: [] };
  }

  const updatedTiers: Items = { ...tiers };
  const priors = buildPriors(baseTiers, tierOrder);
  const metrics = metricsDictionary(
    undersampled,
    records,
    Tun.zQuick,
    priors
  );
  updatedTiers[UNRANKED_TIER_ID] = orderedItems(undersampled, metrics);

  return { tiers: updatedTiers, artifacts: null, suggestedPairs: [] };
}

export function appendUndersampled(
  undersampled: Item[],
  tiers: Items,
  records: Map<string, HeadToHeadRecord>,
  priors: Record<string, Prior>
): void {
  if (undersampled.length === 0) return;
  const metrics = metricsDictionary(
    undersampled,
    records,
    Tun.zQuick,
    priors
  );
  tiers[UNRANKED_TIER_ID] = orderedItems(undersampled, metrics);
}

export function makeQuickArtifacts(
  ordered: Item[],
  undersampled: Item[],
  operativeNames: string[],
  cuts: number[],
  metrics: Record<string, HeadToHeadMetrics>
): HeadToHeadArtifacts {
  const frontier = buildAudits(
    ordered.length,
    cuts,
    Tun.frontierWidth
  );
  return {
    tierNames: operativeNames,
    rankable: ordered,
    undersampled,
    provisionalCuts: cuts,
    frontier,
    warmUpComparisons: warmUpComparisons(
      ordered.length,
      operativeNames.length
    ),
    mode: "quick"
  };
}

export function normalizedTierNames(
  tierOrder: string[]
): string[] {
  return tierOrder
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function clearedTiers(
  base: Items,
  pool: Item[],
  tierNames: string[]
): Items {
  const updated: Items = { ...base };
  const poolIds = new Set(pool.map((i) => i.id));

  // reset operative tiers
  for (const name of tierNames) {
    updated[name] = [];
  }

  // remove pool items from non-operative tiers except unranked
  for (const key of Object.keys(updated)) {
    if (key === UNRANKED_TIER_ID) continue;
    if (!tierNames.includes(key)) {
      const arr = updated[key] ?? [];
      updated[key] = arr.filter((item) => !poolIds.has(item.id));
    }
  }

  // scrub unranked from pool items
  if (updated[UNRANKED_TIER_ID]) {
    updated[UNRANKED_TIER_ID] = updated[UNRANKED_TIER_ID]!.filter(
      (item) => !poolIds.has(item.id)
    );
  }

  return updated;
}

export function operativeTierNames(
  tierNames: string[]
): string[] {
  if (tierNames.length < 2) return tierNames;
  return tierNames.slice(0, Tun.maximumTierCount);
}

export function partitionByComparisons(
  pool: Item[],
  records: Map<string, HeadToHeadRecord>,
  minimumComparisons: number
): { rankable: Item[]; undersampled: Item[] } {
  const rankable: Item[] = [];
  const undersampled: Item[] = [];
  for (const item of pool) {
    const record = records.get(item.id);
    const total = record?.total ?? 0;
    if (total >= minimumComparisons) {
      rankable.push(item);
    } else {
      undersampled.push(item);
    }
  }
  return { rankable, undersampled };
}

export function assignByCuts(
  ordered: Item[],
  cuts: number[],
  tierNames: string[],
  tiers: Items
): void {
  let tierIndex = 0;
  let cursor = 0;
  for (let index = 0; index < ordered.length; index += 1) {
    const item = ordered[index]!;
    while (cursor < cuts.length && index >= cuts[cursor]!) {
      tierIndex += 1;
      cursor += 1;
    }
    const name = tierNames[Math.min(tierIndex, tierNames.length - 1)]!;
    if (!tiers[name]) {
      tiers[name] = [];
    }
    tiers[name]!.push(item);
  }
}

export function sortTierMembers(
  tiers: Items,
  metrics: Record<string, HeadToHeadMetrics>,
  tierNames: string[]
): void {
  for (const name of tierNames) {
    const members = tiers[name];
    if (members) {
      tiers[name] = orderedItems(members, metrics);
    }
  }
}

// --- Refinement Support Functions ---

interface PairKey {
  a: string;
  b: string;
}

function makePairKey(a: Item, b: Item): PairKey {
  return a.id < b.id ? { a: a.id, b: b.id } : { a: b.id, b: a.id };
}

function pairKeyEqual(k1: PairKey, k2: PairKey): boolean {
  return k1.a === k2.a && k1.b === k2.b;
}

interface CandidatePair {
  pair: [Item, Item];
  closeness: number;
  minComparisons: number;
}

function slice(items: Item[], range: [number, number]): Item[] {
  return items.slice(range[0], range[1]);
}

export function topBoundaryComparisons(
  ordered: Item[],
  metrics: Record<string, HeadToHeadMetrics>,
  epsilon: number
): [Item, Item][] {
  if (ordered.length < 2) return [];
  const pairs: [Item, Item][] = [];

  for (let i = 0; i < ordered.length - 1; i += 1) {
    const upper = ordered[i]!;
    const lower = ordered[i + 1]!;
    const upperMetrics = metrics[upper.id];
    const lowerMetrics = metrics[lower.id];
    if (!upperMetrics || !lowerMetrics) continue;

    const delta = upperMetrics.wilsonLB - lowerMetrics.wilsonUB;
    if (delta >= 0 && delta <= epsilon) {
      pairs.push([upper, lower]);
    }
  }

  return pairs;
}

export function bottomBoundaryComparisons(
  ordered: Item[],
  metrics: Record<string, HeadToHeadMetrics>,
  epsilon: number
): [Item, Item][] {
  if (ordered.length < 2) return [];
  const n = ordered.length;
  const maxWidth = Math.min(Tun.maxBottomTieWidth, n);
  const tail = ordered.slice(n - maxWidth, n);
  const pairs: [Item, Item][] = [];

  for (let i = 0; i < tail.length - 1; i += 1) {
    const upper = tail[i]!;
    const lower = tail[i + 1]!;
    const upperMetrics = metrics[upper.id];
    const lowerMetrics = metrics[lower.id];
    if (!upperMetrics || !lowerMetrics) continue;

    if (upperMetrics.wilsonUB > Tun.ubBottomCeil) continue;

    const delta = upperMetrics.wilsonLB - lowerMetrics.wilsonUB;
    if (delta >= 0 && delta <= epsilon) {
      pairs.push([upper, lower]);
    }
  }

  return pairs;
}

export function forcedBoundaryPairs(
  ordered: Item[],
  metrics: Record<string, HeadToHeadMetrics>,
  limit: number,
  seen: Set<PairKey>
): [Item, Item][] {
  const results: [Item, Item][] = [];

  function appendIfNew(pair: [Item, Item]): void {
    const key = makePairKey(pair[0], pair[1]);
    let found = false;
    for (const existing of seen) {
      if (pairKeyEqual(existing, key)) {
        found = true;
        break;
      }
    }
    if (!found) {
      seen.add(key);
      results.push(pair);
    }
  }

  for (const pair of topBoundaryComparisons(ordered, metrics, Tun.epsTieTop)) {
    appendIfNew(pair);
    if (results.length >= limit) return results;
  }

  for (const pair of bottomBoundaryComparisons(ordered, metrics, Tun.epsTieBottom)) {
    appendIfNew(pair);
    if (results.length >= limit) return results;
  }

  return results;
}

export function frontierCandidatePairs(
  artifacts: HeadToHeadArtifacts,
  metrics: Record<string, HeadToHeadMetrics>,
  seen: Set<PairKey>
): CandidatePair[] {
  const candidates: CandidatePair[] = [];

  for (const boundary of artifacts.frontier) {
    const upperBand = slice(artifacts.rankable, boundary.upperRange);
    const lowerBand = slice(artifacts.rankable, boundary.lowerRange);
    if (upperBand.length === 0 || lowerBand.length === 0) continue;

    for (const upperItem of upperBand) {
      for (const lowerItem of lowerBand) {
        if (upperItem.id === lowerItem.id) continue;
        const upperMetrics = metrics[upperItem.id];
        const lowerMetrics = metrics[lowerItem.id];
        if (!upperMetrics || !lowerMetrics) continue;

        const key = makePairKey(upperItem, lowerItem);
        let found = false;
        for (const existing of seen) {
          if (pairKeyEqual(existing, key)) {
            found = true;
            break;
          }
        }
        if (found) continue;

        seen.add(key);
        const closeness = Math.abs(upperMetrics.wilsonLB - lowerMetrics.wilsonUB);
        const minComparisons = Math.min(upperMetrics.comparisons, lowerMetrics.comparisons);
        candidates.push({
          pair: [upperItem, lowerItem],
          closeness,
          minComparisons
        });
      }
    }
  }

  // Sort candidates by closeness, then by minComparisons, then by item IDs
  return candidates.sort((a, b) => {
    if (a.closeness !== b.closeness) return a.closeness - b.closeness;
    if (a.minComparisons !== b.minComparisons) return a.minComparisons - b.minComparisons;
    const leftIds = a.pair[0].id + a.pair[1].id;
    const rightIds = b.pair[0].id + b.pair[1].id;
    return leftIds < rightIds ? -1 : leftIds > rightIds ? 1 : 0;
  });
}

// --- Warm Start Support Functions ---

interface WarmStartPreparation {
  tiersByName: Record<string, Item[]>;
  unranked: Item[];
  anchors: Item[];
}

class WarmStartQueueBuilder {
  private target: number;
  private queue: [Item, Item][] = [];
  private counts: Map<string, number> = new Map();
  private seen: Set<PairKey> = new Set();

  constructor(pool: Item[], target: number) {
    this.target = target;
    for (const item of pool) {
      this.counts.set(item.id, 0);
    }
  }

  get isSatisfied(): boolean {
    for (const count of this.counts.values()) {
      if (count < this.target) return false;
    }
    return true;
  }

  enqueue(first: Item, second: Item): void {
    if (first.id === second.id) return;
    const key = makePairKey(first, second);
    let found = false;
    for (const existing of this.seen) {
      if (pairKeyEqual(existing, key)) {
        found = true;
        break;
      }
    }
    if (found) return;

    if (this.needsMore(first) || this.needsMore(second)) {
      this.queue.push([first, second]);
      this.seen.add(key);
      this.counts.set(first.id, (this.counts.get(first.id) ?? 0) + 1);
      this.counts.set(second.id, (this.counts.get(second.id) ?? 0) + 1);
    }
  }

  enqueueBoundaryPairs(
    tierOrder: string[],
    tiersByName: Record<string, Item[]>,
    frontierWidth: number
  ): boolean {
    if (tierOrder.length < 2) return this.isSatisfied;

    for (let index = 0; index < tierOrder.length - 1; index += 1) {
      const tierName = tierOrder[index]!;
      const nextTierName = tierOrder[index + 1]!;
      const upper = tiersByName[tierName];
      const lower = tiersByName[nextTierName];
      if (!upper || upper.length === 0 || !lower || lower.length === 0) continue;

      const upperTail = upper.slice(Math.max(0, upper.length - frontierWidth));
      const lowerHead = lower.slice(0, Math.min(frontierWidth, lower.length));

      for (const upperItem of upperTail) {
        for (const lowerItem of lowerHead) {
          this.enqueue(upperItem, lowerItem);
          if (this.isSatisfied) return true;
        }
      }
    }

    return this.isSatisfied;
  }

  enqueueUnranked(unranked: Item[], anchors: Item[]): boolean {
    if (anchors.length === 0) return this.isSatisfied;

    for (const item of unranked) {
      let added = 0;
      for (const anchor of anchors) {
        this.enqueue(item, anchor);
        if (this.isSatisfied) return true;
        added += 1;
        if (added >= 2) break;
      }
    }

    return this.isSatisfied;
  }

  enqueueAdjacentPairs(tiersByName: Record<string, Item[]>): boolean {
    for (const items of Object.values(tiersByName)) {
      if (items.length < 2) continue;

      for (let index = 0; index < items.length - 1; index += 1) {
        this.enqueue(items[index]!, items[index + 1]!);
        if (this.isSatisfied) return true;
      }
    }

    return this.isSatisfied;
  }

  enqueueFallback(pool: Item[]): void {
    if (this.isSatisfied) return;
    const fallbackPairs = pairings(pool, Math.random);

    for (const pair of fallbackPairs) {
      this.enqueue(pair[0], pair[1]);
      if (this.isSatisfied) return;
    }
  }

  getQueue(): [Item, Item][] {
    return this.queue;
  }

  private needsMore(item: Item): boolean {
    return (this.counts.get(item.id) ?? 0) < this.target;
  }
}

export function prepareWarmStart(
  pool: Item[],
  tierOrder: string[],
  currentTiers: Items,
  metrics: Record<string, HeadToHeadMetrics>
): WarmStartPreparation {
  const poolById = new Map(pool.map((item) => [item.id, item]));
  const tiersByName: Record<string, Item[]> = {};
  const accounted = new Set<string>();

  for (const name of tierOrder) {
    const members = (currentTiers[name] ?? [])
      .map((item) => poolById.get(item.id))
      .filter((item): item is Item => item !== undefined);
    const orderedMembers = orderedItems(members, metrics);
    tiersByName[name] = orderedMembers;
    for (const item of orderedMembers) {
      accounted.add(item.id);
    }
  }

  let unranked = (currentTiers[UNRANKED_TIER_ID] ?? [])
    .map((item) => poolById.get(item.id))
    .filter((item): item is Item => item !== undefined);
  for (const item of unranked) {
    accounted.add(item.id);
  }

  const loose = pool.filter((item) => !accounted.has(item.id));
  unranked = [...unranked, ...loose];

  const frontierWidth = Math.max(1, Tun.frontierWidth);
  const anchors: Item[] = [];

  for (let index = 0; index < tierOrder.length - 1; index += 1) {
    const tierName = tierOrder[index]!;
    const nextTierName = tierOrder[index + 1]!;
    const upper = tiersByName[tierName];
    const lower = tiersByName[nextTierName];
    if (!upper || upper.length === 0 || !lower || lower.length === 0) continue;

    const upperTail = upper.slice(Math.max(0, upper.length - frontierWidth));
    const lowerHead = lower.slice(0, Math.min(frontierWidth, lower.length));
    anchors.push(...upperTail, ...lowerHead);
  }

  if (anchors.length === 0) {
    anchors.push(...pool);
  }

  return {
    tiersByName,
    unranked,
    anchors
  };
}

/**
 * Generate an initial comparison queue using warm-start heuristics.
 * Full implementation matching HeadToHeadLogic.initialComparisonQueueWarmStart.
 */
export function initialComparisonQueueWarmStart(
  pool: Item[],
  records: Map<string, HeadToHeadRecord>,
  tierOrder: string[],
  currentTiers: Items,
  targetComparisonsPerItem: number
): [Item, Item][] {
  if (pool.length < 2 || targetComparisonsPerItem <= 0) {
    return [];
  }

  const priors = buildPriors(currentTiers, tierOrder);
  const metrics = metricsDictionary(pool, records, Tun.zQuick, priors);
  const preparation = prepareWarmStart(pool, tierOrder, currentTiers, metrics);

  const builder = new WarmStartQueueBuilder(pool, targetComparisonsPerItem);
  const frontierWidth = Math.max(1, Tun.frontierWidth);

  if (
    builder.enqueueBoundaryPairs(
      tierOrder,
      preparation.tiersByName,
      frontierWidth
    )
  ) {
    return builder.getQueue();
  }

  if (builder.enqueueUnranked(preparation.unranked, preparation.anchors)) {
    return builder.getQueue();
  }

  if (builder.enqueueAdjacentPairs(preparation.tiersByName)) {
    return builder.getQueue();
  }

  builder.enqueueFallback(pool);
  return builder.getQueue();
}
