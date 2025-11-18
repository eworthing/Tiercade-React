import React from "react";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import { startHeadToHead, voteCurrentPair, finishHeadToHead } from "@tiercade/state";

export const HeadToHeadPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const isActive = useAppSelector((state) => state.headToHead.isActive);
  const currentPair = useAppSelector((state) => state.headToHead.currentPair);

  const handleStart = () => {
    dispatch(startHeadToHead());
  };

  const handleVoteLeft = () => {
    if (!currentPair) return;
    dispatch(voteCurrentPair(currentPair[0].id));
  };

  const handleVoteRight = () => {
    if (!currentPair) return;
    dispatch(voteCurrentPair(currentPair[1].id));
  };

  const handleFinish = () => {
    dispatch(finishHeadToHead());
  };

  return (
    <div className="space-y-4 text-slate-300">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 mb-1">Head-to-Head</h1>
        <p className="text-sm text-slate-400">
          Uses shared @tiercade/core head-to-head logic and @tiercade/state.
        </p>
      </div>
      <button
        type="button"
        onClick={handleStart}
        className="inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-400"
      >
        {isActive ? "Restart Session" : "Start Session"}
      </button>
      {isActive && (
        <button
          type="button"
          onClick={handleFinish}
          className="inline-flex items-center rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Apply Results
        </button>
      )}
      {currentPair && (
        <div className="mt-4 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm">
          <div className="text-slate-200 mb-1">Current pair</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleVoteLeft}
              className="rounded-md bg-slate-800 px-2 py-1 hover:bg-slate-700"
            >
              {currentPair[0].name ?? currentPair[0].id}
            </button>
            <span className="text-slate-500">vs</span>
            <button
              type="button"
              onClick={handleVoteRight}
              className="rounded-md bg-slate-800 px-2 py-1 hover:bg-slate-700"
            >
              {currentPair[1].name ?? currentPair[1].id}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
