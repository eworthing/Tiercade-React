import type { ThunkAction } from "@reduxjs/toolkit";
import type { AnyAction } from "redux";
import type { RootState } from "./store";
import type { HeadToHeadRecord } from "@tiercade/core";
import { quickTierPass, pairings } from "@tiercade/core";
import {
  setActive,
  setPool,
  setPhase,
  setArtifacts,
  setPairsQueue,
  setCurrentPair,
  setRecords
} from "./headToHeadSlice";
import { setTiers } from "./tierSlice";
import { captureSnapshot } from "./undoRedoThunks";

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

/**
 * Starts a Head-to-Head session using the current tier board.
 * This uses quickTierPass for an initial tiering pass and a simple
 * pairings-based queue (warm start heuristics to be ported later).
 */
export const startHeadToHead = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  const tiers = state.tier.tiers;
  const tierOrder = state.tier.tierOrder;

  const unranked = tiers["unranked"] ?? [];
  const orderedPool = [
    ...unranked,
    ...tierOrder.flatMap((name) => tiers[name] ?? [])
  ];

  if (orderedPool.length < 2) {
    return;
  }

  const recordsObj = state.headToHead.records;
  const records = new Map<string, HeadToHeadRecord>(
    Object.entries(recordsObj)
  );

  const quick = quickTierPass(orderedPool, records, tierOrder, tiers);

  dispatch(setActive(true));
  dispatch(setPool(orderedPool));
  dispatch(setPhase("quick"));
  dispatch(setArtifacts(quick.artifacts ?? null));

  // For now, derive an initial comparison queue from all pairings.
  const pairList = pairings(orderedPool, Math.random);
  if (pairList.length === 0) {
    return;
  }

  const [first, ...rest] = pairList;
  dispatch(setPairsQueue(rest));
  dispatch(setCurrentPair(first));
};

/**
 * Votes on the current pair and advances to the next one.
 * winnerId should be the id of the winning item in the current pair.
 */
export const voteCurrentPair =
  (winnerId: string): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const { isActive, currentPair, pairsQueue, records: recordsObj } =
      state.headToHead;

    if (!isActive || !currentPair) {
      return;
    }

    const [a, b] = currentPair;

    // Validate winnerId matches one of the items - don't silently default
    let winner: typeof a;
    if (winnerId === a.id) {
      winner = a;
    } else if (winnerId === b.id) {
      winner = b;
    } else {
      console.error(`[HeadToHead] Invalid winner ID: ${winnerId}. Expected ${a.id} or ${b.id}`);
      return;
    }

    const records = new Map<string, HeadToHeadRecord>(
      Object.entries(recordsObj)
    );

    // Apply vote via shared core logic
    const { vote } = require("@tiercade/core") as typeof import("@tiercade/core");
    vote(a, b, winner, records);

    const updatedRecordsObj: Record<string, HeadToHeadRecord> = {};
    for (const [key, value] of records.entries()) {
      updatedRecordsObj[key] = value;
    }

    // Advance queue
    const [next, ...rest] = pairsQueue;
    dispatch(setPairsQueue(rest ?? []));
    dispatch(setCurrentPair(next ?? null));

    // Persist updated records via Redux action (not direct mutation)
    dispatch(setRecords(updatedRecordsObj));
  };

/**
 * Finishes Head-to-Head by applying quick-tier results back to the tier board.
 * For now, this reuses quickTierPass; refinement is not yet wired.
 */
export const finishHeadToHead = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  const { pool, records: recordsObj } = state.headToHead;
  const tiers = state.tier.tiers;
  const tierOrder = state.tier.tierOrder;

  if (pool.length === 0) {
    dispatch(setActive(false));
    dispatch(setCurrentPair(null));
    dispatch(setPairsQueue([]));
    return;
  }

  const records = new Map<string, HeadToHeadRecord>(
    Object.entries(recordsObj)
  );
  const quick = quickTierPass(pool, records, tierOrder, tiers);

  // Capture snapshot before applying Head-to-Head results
  dispatch(captureSnapshot("Apply Head-to-Head Results"));
  dispatch(setTiers(quick.tiers));
  dispatch(setActive(false));
  dispatch(setCurrentPair(null));
  dispatch(setPairsQueue([]));
};

