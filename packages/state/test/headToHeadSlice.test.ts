import { describe, expect, it } from "@jest/globals";
import type { Item } from "@tiercade/core";
import type { HeadToHeadArtifacts } from "@tiercade/core";
import {
  headToHeadReducer,
  reset,
  setPool,
  setPairsQueue,
  setCurrentPair,
  setPhase,
  setArtifacts,
  setSuggestedPairs
} from "../src/headToHeadSlice";

function makeItem(id: string, name: string): Item {
  return { id, name };
}

describe("headToHeadSlice", () => {
  it("resets to initial state", () => {
    const mutated = headToHeadReducer(
      undefined,
      setPool([makeItem("alpha", "Alpha")])
    );
    const resetState = headToHeadReducer(mutated, reset());
    expect(resetState.pool).toEqual([]);
    expect(resetState.isActive).toBe(false);
  });

  it("sets pool and pairs queue", () => {
    const pool = [makeItem("alpha", "Alpha"), makeItem("beta", "Beta")];
    const withPool = headToHeadReducer(undefined, setPool(pool));
    expect(withPool.pool).toEqual(pool);

    const pair: [Item, Item] = [pool[0], pool[1]];
    const withQueue = headToHeadReducer(withPool, setPairsQueue([pair]));
    expect(withQueue.pairsQueue.length).toBe(1);
    expect(withQueue.totalComparisons).toBe(1);
    expect(withQueue.completedComparisons).toBe(0);
  });

  it("updates current pair, phase, artifacts, and suggested pairs", () => {
    const pool = [makeItem("alpha", "Alpha"), makeItem("beta", "Beta")];
    const pair: [Item, Item] = [pool[0], pool[1]];
    let state = headToHeadReducer(undefined, setCurrentPair(pair));
    expect(state.currentPair).toEqual(pair);

    state = headToHeadReducer(state, setPhase("refinement"));
    expect(state.phase).toBe("refinement");

    const artifacts: HeadToHeadArtifacts = {
      mode: "quick",
      tierNames: ["S", "A"],
      rankable: pool,
      undersampled: [],
      provisionalCuts: [1],
      frontier: [],
      warmUpComparisons: 4
    };

    state = headToHeadReducer(state, setArtifacts(artifacts));
    expect(state.artifacts).toEqual(artifacts);

    state = headToHeadReducer(state, setSuggestedPairs([pair]));
    expect(state.suggestedPairs).toEqual([pair]);
  });
});

