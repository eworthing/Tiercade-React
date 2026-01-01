import React, { useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  startHeadToHead,
  voteCurrentPair,
  skipPair,
  finishHeadToHead,
  selectHeadToHeadProgress,
  selectHeadToHeadSkippedCount,
} from "@tiercade/state";
import { Button } from "@tiercade/ui";

export const HeadToHeadPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isActive = useAppSelector((state) => state.headToHead.isActive);
  const currentPair = useAppSelector((state) => state.headToHead.currentPair);
  const pairsQueue = useAppSelector((state) => state.headToHead.pairsQueue);
  const deferredPairs = useAppSelector((state) => state.headToHead.deferredPairs);
  const phase = useAppSelector((state) => state.headToHead.phase);
  const pool = useAppSelector((state) => state.headToHead.pool);
  const tiers = useAppSelector((state) => state.tier.tiers);
  const progress = useAppSelector(selectHeadToHeadProgress);
  const skippedCount = useAppSelector(selectHeadToHeadSkippedCount);

  // Calculate total items available
  const totalItems = useMemo(() => {
    return Object.values(tiers).flat().length;
  }, [tiers]);

  const handleStart = useCallback(() => {
    dispatch(startHeadToHead());
  }, [dispatch]);

  const handleVoteLeft = useCallback(() => {
    if (!currentPair) return;
    dispatch(voteCurrentPair(currentPair[0].id));
  }, [dispatch, currentPair]);

  const handleVoteRight = useCallback(() => {
    if (!currentPair) return;
    dispatch(voteCurrentPair(currentPair[1].id));
  }, [dispatch, currentPair]);

  const handleSkip = useCallback(() => {
    // Properly defer the pair for later instead of fake voting
    if (!currentPair) return;
    dispatch(skipPair());
  }, [dispatch, currentPair]);

  const handleFinish = useCallback(() => {
    dispatch(finishHeadToHead());
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive || !currentPair) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "1":
          e.preventDefault();
          handleVoteLeft();
          break;
        case "ArrowRight":
        case "2":
          e.preventDefault();
          handleVoteRight();
          break;
        case " ":
          e.preventDefault();
          handleSkip();
          break;
        case "Escape":
          e.preventDefault();
          handleFinish();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentPair, handleVoteLeft, handleVoteRight, handleSkip, handleFinish]);

  // Empty state - not enough items
  if (totalItems < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-surface-raised flex items-center justify-center">
          <svg
            className="w-8 h-8 text-text-subtle"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text mb-2">
          Need More Items
        </h2>
        <p className="text-text-muted text-sm max-w-xs mb-4">
          Head-to-Head comparison requires at least 2 items in your tier list.
          Add more items to get started.
        </p>
        <Button variant="secondary" onClick={() => navigate("/")}>
          Go to Board
        </Button>
      </div>
    );
  }

  // Idle state - not started
  if (!isActive) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text mb-2">Head-to-Head</h1>
          <p className="text-text-muted max-w-md mx-auto">
            Compare items one-on-one to intelligently rank your tier list.
            Simply pick the winner in each matchup.
          </p>
        </div>

        {/* Start Card */}
        <div className="max-w-md mx-auto bg-surface-raised border border-border rounded-xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text mb-2">
            Ready to Compare
          </h2>
          <p className="text-text-muted text-sm mb-6">
            You have <span className="text-accent font-medium">{totalItems} items</span> to rank.
            This will take approximately {Math.ceil((totalItems * (totalItems - 1)) / 2 / 10)} minutes.
          </p>
          <Button variant="primary" onClick={handleStart}>
            Start Comparing
          </Button>
        </div>

        {/* How it works */}
        <div className="max-w-lg mx-auto">
          <h3 className="text-sm font-medium text-text-muted mb-3 text-center">
            How it works
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3">
              <div className="text-2xl mb-2">1</div>
              <p className="text-xs text-text-muted">
                Compare two items at a time
              </p>
            </div>
            <div className="p-3">
              <div className="text-2xl mb-2">2</div>
              <p className="text-xs text-text-muted">
                Pick the winner each round
              </p>
            </div>
            <div className="p-3">
              <div className="text-2xl mb-2">3</div>
              <p className="text-xs text-text-muted">
                Items get sorted into tiers
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active comparison state
  if (currentPair) {
    const [itemA, itemB] = currentPair;
    const isReviewingDeferred = pairsQueue.length === 0 && deferredPairs.length > 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                phase === "quick"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-purple-500/20 text-purple-400"
              }`}>
                {phase === "quick" ? "Quick Pass" : "Refinement"}
              </span>
              {isReviewingDeferred && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                  Reviewing Skipped
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-text-muted">
              {skippedCount > 0 && (
                <span className="text-amber-400">
                  {skippedCount} skipped
                </span>
              )}
              <span>
                {progress.remaining} remaining
              </span>
            </div>
          </div>
          <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text">
            Which do you prefer?
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Use arrow keys or click to vote • Space to skip (decide later) • Esc to finish
          </p>
        </div>

        {/* Comparison cards */}
        <div className="grid grid-cols-2 gap-6">
          {/* Item A */}
          <button
            onClick={handleVoteLeft}
            className="group relative bg-surface-raised border-2 border-border hover:border-accent rounded-xl p-6 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {itemA.imageUrl ? (
              <div className="w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden bg-surface">
                <img
                  src={itemA.imageUrl}
                  alt={itemA.name ?? itemA.id}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 mx-auto mb-4 rounded-lg bg-surface flex items-center justify-center">
                <span className="text-3xl text-text-muted">A</span>
              </div>
            )}
            <h3 className="text-lg font-semibold text-text group-hover:text-accent transition-colors">
              {itemA.name ?? itemA.id}
            </h3>
            {itemA.seasonString && (
              <p className="text-sm text-text-muted mt-1">{itemA.seasonString}</p>
            )}
            <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-bold text-text-muted group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-colors">
              1
            </div>
          </button>

          {/* Item B */}
          <button
            onClick={handleVoteRight}
            className="group relative bg-surface-raised border-2 border-border hover:border-accent rounded-xl p-6 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {itemB.imageUrl ? (
              <div className="w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden bg-surface">
                <img
                  src={itemB.imageUrl}
                  alt={itemB.name ?? itemB.id}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 mx-auto mb-4 rounded-lg bg-surface flex items-center justify-center">
                <span className="text-3xl text-text-muted">B</span>
              </div>
            )}
            <h3 className="text-lg font-semibold text-text group-hover:text-accent transition-colors">
              {itemB.name ?? itemB.id}
            </h3>
            {itemB.seasonString && (
              <p className="text-sm text-text-muted mt-1">{itemB.seasonString}</p>
            )}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-bold text-text-muted group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-colors">
              2
            </div>
          </button>
        </div>

        {/* VS badge */}
        <div className="flex justify-center -mt-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-surface-raised border-2 border-border flex items-center justify-center">
            <span className="text-sm font-bold text-text-muted">VS</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip this pair
          </Button>
          <Button variant="danger" size="sm" onClick={handleFinish}>
            End & Apply Results
          </Button>
        </div>
      </div>
    );
  }

  // Completed state - no more pairs
  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-text mb-2">
          All Done!
        </h2>
        <p className="text-text-muted">
          You've compared all the items. Apply the results to update your tier list.
        </p>
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="secondary" onClick={handleStart}>
          Start Over
        </Button>
        <Button variant="primary" onClick={handleFinish}>
          Apply Results
        </Button>
      </div>
    </div>
  );
};
