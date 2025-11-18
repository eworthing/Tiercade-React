import { describe, expect, it } from "@jest/globals";
import type { Item, Items } from "../src/models";
import {
  HeadToHeadRecord,
  quickTierPass,
  type HeadToHeadQuickResult
} from "../src/headToHead";

function makeItem(id: string, name: string): Item {
  return {
    id,
    name,
    seasonString: undefined,
    seasonNumber: undefined,
    status: undefined,
    description: undefined,
    imageUrl: undefined,
    videoUrl: undefined
  };
}

function makeRecord(wins: number, losses: number): HeadToHeadRecord {
  const total = wins + losses;
  return {
    wins,
    losses,
    total,
    winRate: total === 0 ? 0 : wins / total
  };
}

function sampleDataset(): {
  pool: Item[];
  records: Map<string, HeadToHeadRecord>;
  tierOrder: string[];
  baseTiers: Items;
} {
  const alpha = makeItem("alpha", "Alpha");
  const beta = makeItem("beta", "Beta");
  const gamma = makeItem("gamma", "Gamma");
  const delta = makeItem("delta", "Delta");

  const records = new Map<string, HeadToHeadRecord>([
    ["alpha", makeRecord(6, 1)],
    ["beta", makeRecord(4, 3)],
    ["gamma", makeRecord(2, 1)],
    ["delta", makeRecord(0, 1)]
  ]);

  const baseTiers: Items = {
    S: [alpha],
    A: [beta],
    B: [gamma],
    C: [],
    unranked: [delta]
  };

  return {
    pool: [alpha, beta, gamma, delta],
    records,
    tierOrder: ["S", "A", "B", "C"],
    baseTiers
  };
}

describe("HeadToHead quickTierPass", () => {
  it("produces artifacts and updated tiers for rankable pool", () => {
    const dataset = sampleDataset();
    const result: HeadToHeadQuickResult = quickTierPass(
      dataset.pool,
      dataset.records,
      dataset.tierOrder,
      dataset.baseTiers
    );

    const tiers = result.tiers;
    expect(tiers["S"]?.some((i) => i.id === "alpha")).toBe(true);
    expect(tiers["A"]?.some((i) => i.id === "beta")).toBe(true);
    expect(tiers["B"]?.some((i) => i.id === "gamma")).toBe(true);
    expect((tiers["unranked"] ?? []).map((i) => i.id)).toEqual(["delta"]);

    const artifacts = result.artifacts;
    expect(artifacts).not.toBeNull();
    if (!artifacts) return;

    expect(artifacts.tierNames).toEqual(["S", "A", "B", "C"]);
    expect(artifacts.rankable.map((i) => i.id)).toEqual([
      "alpha",
      "beta",
      "gamma"
    ]);
    expect(artifacts.frontier.length).toBeGreaterThanOrEqual(0);
    expect(artifacts.mode).toBe("quick");
  });
});

