import { describe, expect, it } from "@jest/globals";
import { createSeededRNG, pickRandomPair } from "../src/randomUtils";

describe("RandomUtils", () => {
  it("Seeded RNG yields deterministic sequences", () => {
    const rngA = createSeededRNG(42);
    const rngB = createSeededRNG(42);

    for (let i = 0; i < 5; i += 1) {
      expect(rngA.next()).toBe(rngB.next());
    }
  });

  it("Seed normalization avoids zero-state lock", () => {
    const rng = createSeededRNG(0);
    const first = rng.next();
    expect(first).toBeGreaterThan(0);
  });

  it("pickRandomPair returns null for insufficient elements", () => {
    const pair = pickRandomPair([1], () => 0.5);
    expect(pair).toBeNull();
  });

  it("pickRandomPair rerolls duplicate index", () => {
    const sequence = new SequenceRNG([0.0, 0.0]);
    const pair = pickRandomPair(["a", "b", "c"], () => sequence.next());
    expect(pair?.[0]).toBe("a");
    expect(pair?.[1]).toBe("b");
  });
});

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

