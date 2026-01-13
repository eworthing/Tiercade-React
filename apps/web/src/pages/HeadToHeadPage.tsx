import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  startHeadToHead,
  voteCurrentPair,
  skipPair,
  finishHeadToHead,
  selectHeadToHeadCurrentPair,
  selectHeadToHeadDeferredPairs,
  selectHeadToHeadIsActive,
  selectHeadToHeadPairsQueue,
  selectHeadToHeadPhase,
  selectHeadToHeadProgress,
  selectHeadToHeadSkippedCount,
  selectTotalItemCount,
} from "@tiercade/state";
import { Button, AlertDialog, DialogTrigger } from "@react-spectrum/s2";
import type { Item } from "@tiercade/core";

interface ComparisonCardProps {
  item: Item;
  side: "left" | "right";
  shortcut: 1 | 2;
  onClick: () => void;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ item, side, shortcut, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const fallbackLabel = shortcut === 1 ? "A" : "B";
  const itemName = item.name ?? item.id;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`h2h-card-${side}`}
      aria-label={`Select ${itemName} as winner (press ${shortcut} or ${side === "left" ? "left arrow" : "right arrow"})`}
      style={{
        position: "relative",
        backgroundColor: "var(--spectrum-gray-100)",
        border: hovered ? "2px solid var(--spectrum-blue-700)" : "2px solid var(--spectrum-gray-300)",
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
        transition: "all 200ms ease",
        cursor: "pointer",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1)" : "none"
      }}
    >
      {item.imageUrl ? (
        <div style={{
          width: 128,
          height: 128,
          margin: "0 auto 16px",
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: "var(--spectrum-gray-200)"
        }}>
          <img
            src={item.imageUrl}
            alt={itemName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div style={{
          width: 128,
          height: 128,
          margin: "0 auto 16px",
          borderRadius: 8,
          backgroundColor: "var(--spectrum-gray-200)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{ fontSize: 30, color: "var(--spectrum-gray-700)" }}>{fallbackLabel}</span>
        </div>
      )}
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        color: hovered ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-900)",
        transition: "color 150ms ease"
      }}>
        {itemName}
      </h3>
      {item.seasonString && (
        <p style={{ fontSize: 14, color: "var(--spectrum-gray-700)", marginTop: 4 }}>{item.seasonString}</p>
      )}
      <div
        style={{
          position: "absolute",
          top: 12,
          [side === "left" ? "left" : "right"]: 12,
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: hovered ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-200)",
          border: hovered ? "1px solid var(--spectrum-blue-700)" : "1px solid var(--spectrum-gray-300)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: hovered ? "white" : "var(--spectrum-gray-700)",
          transition: "all 150ms ease"
        }}
      >
        {shortcut}
      </div>
    </button>
  );
};

export const HeadToHeadPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isActive = useAppSelector(selectHeadToHeadIsActive);
  const currentPair = useAppSelector(selectHeadToHeadCurrentPair);
  const pairsQueue = useAppSelector(selectHeadToHeadPairsQueue);
  const deferredPairs = useAppSelector(selectHeadToHeadDeferredPairs);
  const phase = useAppSelector(selectHeadToHeadPhase);
  const totalItems = useAppSelector(selectTotalItemCount);
  const progress = useAppSelector(selectHeadToHeadProgress);
  const skippedCount = useAppSelector(selectHeadToHeadSkippedCount);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

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
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore keyboard shortcuts when a modal/dialog is open
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) {
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
          setShowEndConfirm(true);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentPair, handleVoteLeft, handleVoteRight, handleSkip]);

  // Empty state - not enough items
  if (totalItems < 2) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        textAlign: "center"
      }}>
        <div style={{
          width: 64,
          height: 64,
          marginBottom: 16,
          borderRadius: "50%",
          backgroundColor: "var(--spectrum-gray-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <svg
            style={{ width: 32, height: 32, color: "var(--spectrum-gray-600)" }}
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
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--spectrum-gray-900)", marginBottom: 8 }}>
          Need More Items
        </h2>
        <p style={{ color: "var(--spectrum-gray-700)", fontSize: 14, maxWidth: 280, marginBottom: 16 }}>
          Head-to-Head comparison requires at least 2 items in your tier list.
          Add more items to get started.
        </p>
        <Button variant="secondary" onPress={() => navigate("/")}>
          Go to Board
        </Button>
      </div>
    );
  }

  // Idle state - not started
  if (!isActive) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }} data-testid="h2h-page">
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--spectrum-gray-900)", marginBottom: 8 }} data-testid="h2h-heading">
            Head-to-Head
          </h1>
          <p style={{ color: "var(--spectrum-gray-700)", maxWidth: 448, margin: "0 auto" }}>
            Compare items one-on-one to intelligently rank your tier list.
            Simply pick the winner in each matchup.
          </p>
        </div>

        {/* Start Card */}
        <div style={{
          maxWidth: 448,
          margin: "0 auto",
          backgroundColor: "var(--spectrum-gray-100)",
          border: "1px solid var(--spectrum-gray-300)",
          borderRadius: 12,
          padding: 24,
          textAlign: "center"
        }}>
          <div style={{
            width: 64,
            height: 64,
            margin: "0 auto 16px",
            borderRadius: "50%",
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg
              style={{ width: 32, height: 32, color: "var(--spectrum-blue-700)" }}
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
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--spectrum-gray-900)", marginBottom: 8 }}>
            Ready to Compare
          </h2>
          <p style={{ color: "var(--spectrum-gray-700)", fontSize: 14, marginBottom: 24 }}>
            You have <span style={{ color: "var(--spectrum-blue-700)", fontWeight: 500 }}>{totalItems} items</span> to rank.
            This will take approximately {Math.ceil((totalItems * (totalItems - 1)) / 2 / 10)} minutes.
          </p>
          <Button variant="accent" onPress={handleStart} data-testid="h2h-start">
            Start Comparing
          </Button>
        </div>

        {/* How it works */}
        <div style={{ maxWidth: 512, margin: "0 auto" }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--spectrum-gray-700)", marginBottom: 12, textAlign: "center" }}>
            How it works
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, textAlign: "center" }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8, color: "var(--spectrum-gray-900)" }}>1</div>
              <p style={{ fontSize: 12, color: "var(--spectrum-gray-700)" }}>
                Compare two items at a time
              </p>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8, color: "var(--spectrum-gray-900)" }}>2</div>
              <p style={{ fontSize: 12, color: "var(--spectrum-gray-700)" }}>
                Pick the winner each round
              </p>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8, color: "var(--spectrum-gray-900)" }}>3</div>
              <p style={{ fontSize: 12, color: "var(--spectrum-gray-700)" }}>
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
      <div style={{ maxWidth: 768, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }} data-testid="h2h-page">
        {/* Progress bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span data-testid="h2h-phase" style={{
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: phase === "quick"
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(147, 51, 234, 0.2)",
                color: phase === "quick"
                  ? "var(--spectrum-blue-800)"
                  : "var(--spectrum-purple-800)"
              }}>
                {phase === "quick" ? "Quick Pass" : "Refinement"}
              </span>
              {isReviewingDeferred && (
                <span data-testid="h2h-reviewing-skipped" style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: "rgba(245, 158, 11, 0.2)",
                  color: "var(--spectrum-orange-800)"
                }}>
                  Reviewing Skipped
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--spectrum-gray-700)" }}>
              {skippedCount > 0 && (
                <span data-testid="h2h-skipped-count" style={{ color: "var(--spectrum-orange-700)" }}>
                  {skippedCount} skipped
                </span>
              )}
              <span data-testid="h2h-remaining-count">
                {progress.remaining} remaining
              </span>
            </div>
          </div>
          <div style={{
            height: 8,
            backgroundColor: "var(--spectrum-gray-100)",
            borderRadius: 9999,
            overflow: "hidden"
          }} data-testid="h2h-progress-bar">
            <div
              style={{
                height: "100%",
                backgroundColor: "var(--spectrum-blue-700)",
                transition: "width 300ms ease-out",
                width: `${progress.percentage}%`
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--spectrum-gray-900)" }}>
            Which do you prefer?
          </h2>
          <p style={{ color: "var(--spectrum-gray-700)", fontSize: 14, marginTop: 4 }}>
            Use arrow keys or click to vote • Space to skip (decide later) • Esc to finish
          </p>
        </div>

        {/* Comparison cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <ComparisonCard
            item={itemA}
            side="left"
            shortcut={1}
            onClick={handleVoteLeft}
          />
          <ComparisonCard
            item={itemB}
            side="right"
            shortcut={2}
            onClick={handleVoteRight}
          />
        </div>

        {/* VS badge */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: -16, position: "relative", zIndex: 10 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "var(--spectrum-gray-100)",
            border: "2px solid var(--spectrum-gray-300)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--spectrum-gray-700)" }}>VS</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <Button variant="secondary" fillStyle="outline" size="S" onPress={handleSkip} data-testid="h2h-skip">
            Skip this pair
          </Button>
          <Button variant="negative" size="S" onPress={() => setShowEndConfirm(true)} data-testid="h2h-apply">
            End & Apply Results
          </Button>
        </div>

        <DialogTrigger isOpen={showEndConfirm} onOpenChange={(open) => !open && setShowEndConfirm(false)}>
          <span style={{ display: "none" }}><Button aria-hidden="true">Open</Button></span>
          <AlertDialog
            title="End Session?"
            variant="confirmation"
            primaryActionLabel="End & Apply"
            cancelLabel="Cancel"
            onPrimaryAction={() => {
              setShowEndConfirm(false);
              handleFinish();
            }}
            onCancel={() => setShowEndConfirm(false)}
          >
            {`You have ${progress.remaining} comparisons remaining. Ending now will apply results based on completed comparisons only.`}
          </AlertDialog>
        </DialogTrigger>
      </div>
    );
  }

  // Completed state - no more pairs
  return (
    <div style={{ maxWidth: 448, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: 24 }} data-testid="h2h-page">
      <div style={{
        width: 80,
        height: 80,
        margin: "0 auto",
        borderRadius: "50%",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <svg
          style={{ width: 40, height: 40, color: "var(--spectrum-green-700)" }}
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
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--spectrum-gray-900)", marginBottom: 8 }}>
          All Done!
        </h2>
        <p style={{ color: "var(--spectrum-gray-700)" }}>
          You've compared all the items. Apply the results to update your tier list.
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <Button variant="secondary" onPress={handleStart}>
          Start Over
        </Button>
        <Button variant="accent" onPress={handleFinish} data-testid="h2h-apply">
          Apply Results
        </Button>
      </div>
    </div>
  );
};
