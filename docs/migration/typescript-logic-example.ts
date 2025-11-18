// TypeScript port of TiercadeCore logic
// Source: TiercadeCore/Sources/TiercadeCore/Logic/TierLogic.swift

import { Item, Items } from './typescript-models-example';

export class TierLogic {
  /**
   * Move item with id to target tier; returns new tiers or original if no-op.
   */
  static moveItem(tiers: Items, itemId: string, targetTierName: string): Items {
    if (!itemId || !targetTierName) return tiers;

    const newTiers = { ...tiers };

    let sourceTier: string | null = null;
    let found: Item | null = null;

    // Find and remove from source tier
    for (const [name, arr] of Object.entries(newTiers)) {
      const idx = arr.findIndex(item => item.id === itemId);
      if (idx !== -1) {
        sourceTier = name;
        found = arr[idx];
        newTiers[name] = [...arr.slice(0, idx), ...arr.slice(idx + 1)];
        break;
      }
    }

    if (!found) return tiers;
    if (sourceTier === targetTierName) return tiers;

    // Add to target tier
    const target = newTiers[targetTierName] ?? [];
    newTiers[targetTierName] = [...target, found];

    return newTiers;
  }

  /**
   * Reorder within one tier from index to index; bounds-safe no-op on invalid.
   */
  static reorderWithin(tiers: Items, tierName: string, from: number, to: number): Items {
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
   * Validate tiers shape (TypeScript typing handles most of this)
   */
  static validateTiersShape(tiers: Items): boolean {
    return true; // TypeScript provides compile-time checking
  }
}

// Example HeadToHead logic port (simplified - full port would be extensive)
export class HeadToHeadLogic {
  /**
   * Vote between two items, updating records
   */
  static vote(
    a: Item,
    b: Item,
    winner: Item,
    records: Map<string, { wins: number; losses: number }>
  ): void {
    if (winner.id === a.id) {
      const aRecord = records.get(a.id) ?? { wins: 0, losses: 0 };
      const bRecord = records.get(b.id) ?? { wins: 0, losses: 0 };
      records.set(a.id, { ...aRecord, wins: aRecord.wins + 1 });
      records.set(b.id, { ...bRecord, losses: bRecord.losses + 1 });
    } else {
      const aRecord = records.get(a.id) ?? { wins: 0, losses: 0 };
      const bRecord = records.get(b.id) ?? { wins: 0, losses: 0 };
      records.set(b.id, { ...bRecord, wins: bRecord.wins + 1 });
      records.set(a.id, { ...aRecord, losses: aRecord.losses + 1 });
    }
  }

  /**
   * Pick random pair from pool
   */
  static pickPair(pool: Item[], rng: () => number): [Item, Item] | null {
    if (pool.length < 2) return null;

    const i = Math.floor(rng() * pool.length);
    let j = Math.floor(rng() * pool.length);
    while (j === i) {
      j = Math.floor(rng() * pool.length);
    }

    return [pool[i], pool[j]];
  }

  // Note: Full HeadToHead port would include:
  // - quickTierPass with quantile cuts
  // - Bayesian ranking metrics
  // - Refinement pair generation
  // - Prior building from existing tiers
  // This is 300+ lines of complex logic - viable but needs careful testing
}

// RandomUtils port
export class RandomUtils {
  static shuffle<T>(array: T[], rng: () => number): T[] {
    const shuffled = [...array];
    let idx = shuffled.length - 1;
    while (idx > 0) {
      const random = Math.floor(rng() * (idx + 1));
      [shuffled[idx], shuffled[random]] = [shuffled[random], shuffled[idx]];
      idx--;
    }
    return shuffled;
  }

  static pickRandomPair<T>(pool: T[], rng: () => number): [T, T] | null {
    if (pool.length < 2) return null;
    const i = Math.floor(rng() * pool.length);
    let j = Math.floor(rng() * pool.length);
    while (j === i) {
      j = Math.floor(rng() * pool.length);
    }
    return [pool[i], pool[j]];
  }
}
