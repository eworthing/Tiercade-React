// TypeScript port of RandomUtils.swift
// Source: TiercadeCore/Sources/TiercadeCore/Utilities/RandomUtils.swift

export interface SeededRNG {
  next(): number;
}

/**
 * Create a deterministic RNG matching SeededRNG (Lehmer LCG / MINSTD).
 */
export function createSeededRNG(seed: number): SeededRNG {
  let state = Math.abs(seed) % 2147483647;
  if (state === 0) {
    state = 1;
  }

  return {
    next(): number {
      const a = 16807;
      const m = 2147483647;
      const prod = (state * a) % m;
      state = prod;
      return (state - 1) / (m - 1);
    }
  };
}

/**
 * Pick a random pair from an array using an injected RNG.
 * Returns null when fewer than 2 elements are available.
 */
export function pickRandomPair<T>(
  arr: T[],
  rng: () => number
): [T, T] | null {
  const pool = arr;
  if (pool.length < 2) {
    return null;
  }

  const i = Math.floor(rng() * pool.length);
  let j = Math.floor(rng() * pool.length);
  if (j === i) {
    j = (j + 1) % pool.length;
  }

  return [pool[i], pool[j]];
}

