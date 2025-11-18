import { describe, expect, it } from "@jest/globals";
import type { Item } from "../src/models";
import { pickPair, pairings, vote } from "../src/headToHead";

class SequenceRNG {
  private readonly values: number[];

  private index = 0;

  constructor(values: number[]) {
    if (values.length === 0) {
      throw new Error("SequenceRNG requires at least one value");
    }
    this.values = values;
  }

  next(): number {
    const value = this.values[this.index];
    this.index = (this.index + 1) % this.values.length;
    return value;
  }
}

function makePool(): Item[] {
  return [
    { id: "alpha", name: "Alpha" },
    { id: "beta", name: "Beta" },
    { id: "gamma", name: "Gamma" }
  ];
}

describe("HeadToHead basic helpers", () => {
  it("pickPair avoids duplicate indices", () => {
    const pool = makePool();
    const sequence = new SequenceRNG([0.0, 0.0]);
    const pair = pickPair(pool, () => sequence.next());
    expect(pair?.[0].id).toBe("alpha");
    expect(pair?.[1].id).toBe("beta");
  });

  it("pickPair requires at least two items", () => {
    const single: Item[] = [{ id: "solo", name: "Solo" }];
    const pair = pickPair(single, () => 0.1);
    expect(pair).toBeNull();
  });

  it("pairings produce all unique combinations", () => {
    const pool = makePool();
    const sequence = new SequenceRNG([0.3, 0.7, 0.2, 0.5]);
    const results = pairings(pool, () => sequence.next());
    const keys = new Set(
      results.map(([a, b]) => [a.id, b.id].sort().join("|"))
    );
    expect(results.length).toBe(3);
    expect(keys).toEqual(
      new Set(["alpha|beta", "alpha|gamma", "beta|gamma"])
    );
  });

  it("vote tallies wins and losses for both contenders", () => {
    const pool = makePool();
    const records = new Map<string, { wins: number; losses: number; total: number; winRate: number }>();

    vote(pool[0], pool[1], pool[0], records);
    vote(pool[1], pool[2], pool[2], records);

    expect(records.get(pool[0].id)?.wins).toBe(1);
    expect(records.get(pool[0].id)?.losses).toBe(0);
    expect(records.get(pool[1].id)?.wins).toBe(0);
    expect(records.get(pool[1].id)?.losses).toBe(2);
    expect(records.get(pool[2].id)?.wins).toBe(1);
    expect(records.get(pool[2].id)?.losses).toBe(0);
  });
}
);

