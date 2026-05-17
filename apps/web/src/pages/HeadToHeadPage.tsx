import React, { useState } from "react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useHeadToHeadHandlers } from "../hooks/useHeadToHeadHandlers";
import {
  selectHeadToHeadCurrentPair,
  selectHeadToHeadDeferredPairs,
  selectHeadToHeadIsActive,
  selectHeadToHeadPairsQueue,
  selectHeadToHeadPhase,
  selectHeadToHeadProgress,
  selectHeadToHeadSkippedCount,
  selectTotalItemCount,
} from "@tiercade/state";
import { AlertDialog, Badge, Button, DialogTrigger, Heading, ProgressBar, Text } from "@react-spectrum/s2";
import type { Item } from "@tiercade/core";
import { Button as AriaButton } from "react-aria-components";
import { focusRing, style } from "@react-spectrum/s2/style" with { type: "macro" };

const centered = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: 12,
});

const pageStack = style({
  display: "flex",
  flexDirection: "column",
  gap: 24,
});

const cardGrid = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 24,
});

const comparisonCard = style({
  ...focusRing(),
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  width: "full",
  padding: 24,
  borderRadius: "lg",
  borderStyle: "solid",
  borderWidth: 2,
  borderColor: {
    default: "gray-300",
    isHovered: "blue-800",
    isFocusVisible: "blue-800",
  },
  backgroundColor: {
    default: "gray-100",
    isHovered: "gray-200",
    isPressed: "gray-200",
  },
  transition: "default",
  cursor: "pointer",
  userSelect: "none",
});

const mediaBox = style({
  width: 128,
  height: 128,
  borderRadius: "default",
  overflow: "hidden",
  backgroundColor: "gray-200",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const cornerLeft = style({
  position: "absolute",
  top: 12,
  left: 12,
});

const cornerRight = style({
  position: "absolute",
  top: 12,
  right: 12,
});

interface ComparisonCardProps {
  item: Item;
  side: "left" | "right";
  shortcut: 1 | 2;
  onClick: () => void;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ item, side, shortcut, onClick }) => {
  const fallbackLabel = shortcut === 1 ? "A" : "B";
  const itemName = item.name ?? item.id;

  return (
    <AriaButton
      onPress={onClick}
      data-testid={`h2h-card-${side}`}
      aria-label={`Select ${itemName} as winner (press ${shortcut} or ${side === "left" ? "left arrow" : "right arrow"})`}
      className={comparisonCard}
    >
      {item.imageUrl ? (
        <div className={mediaBox}>
          <img
            src={item.imageUrl}
            alt={itemName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div className={mediaBox}>
          <Text>{fallbackLabel}</Text>
        </div>
      )}
      <Heading level={3}>{itemName}</Heading>
      {item.seasonString && (
        <Text>{item.seasonString}</Text>
      )}
      <div className={side === "left" ? cornerLeft : cornerRight}>
        <Badge variant="gray" fillStyle="subtle">
          {shortcut}
        </Badge>
      </div>
    </AriaButton>
  );
};

export const HeadToHeadPage: React.FC = () => {
  const isActive = useAppSelector(selectHeadToHeadIsActive);
  const currentPair = useAppSelector(selectHeadToHeadCurrentPair);
  const pairsQueue = useAppSelector(selectHeadToHeadPairsQueue);
  const deferredPairs = useAppSelector(selectHeadToHeadDeferredPairs);
  const phase = useAppSelector(selectHeadToHeadPhase);
  const totalItems = useAppSelector(selectTotalItemCount);
  const progress = useAppSelector(selectHeadToHeadProgress);
  const skippedCount = useAppSelector(selectHeadToHeadSkippedCount);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const {
    onStart: handleStart,
    onVoteLeft: handleVoteLeft,
    onVoteRight: handleVoteRight,
    onSkip: handleSkip,
    onFinish: handleFinish,
    onGoHome,
  } = useHeadToHeadHandlers(() => setShowEndConfirm(true));

  // Empty state - not enough items
  if (totalItems < 2) {
    return (
      <div className={centered}>
        <Heading level={2}>Need more items</Heading>
        <Text>
          Head-to-Head comparison requires at least 2 items in your tier list.
        </Text>
        <Button variant="secondary" onPress={onGoHome}>
          Go to Board
        </Button>
      </div>
    );
  }

  // Idle state - not started
  if (!isActive) {
    return (
      <div className={pageStack} data-testid="h2h-page">
        <div className={centered} style={{
          background: "radial-gradient(ellipse at center, rgba(255,45,120,0.03), transparent 60%)",
          padding: "48px 24px",
          borderRadius: 16,
        }}>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 48,
            fontWeight: 700,
            background: "linear-gradient(135deg, #ff2d78, #00f0ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.1,
          }}>
            VS
          </span>
          <Heading level={1} data-testid="h2h-heading">
            Head-to-Head
          </Heading>
          <Text>
            Compare items one-on-one to intelligently rank your tier list. Simply pick the winner in each matchup.
          </Text>
          <Text>
            You have {totalItems} items to rank. This will take approximately{" "}
            {Math.ceil((totalItems * (totalItems - 1)) / 2 / 10)} minutes.
          </Text>
          <Button variant="accent" onPress={handleStart} data-testid="h2h-start">
            Start comparing
          </Button>
        </div>
      </div>
    );
  }

  // Active comparison state
  if (currentPair) {
    const [itemA, itemB] = currentPair;
    const isReviewingDeferred = pairsQueue.length === 0 && deferredPairs.length > 0;

    return (
      <div className={pageStack} data-testid="h2h-page">
        <div className={pageStack}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge
                variant={phase === "quick" ? "informative" : "purple"}
                fillStyle="subtle"
                data-testid="h2h-phase"
              >
                {phase === "quick" ? "Quick pass" : "Refinement"}
              </Badge>
              {isReviewingDeferred && (
                <Badge variant="notice" fillStyle="subtle" data-testid="h2h-reviewing-skipped">
                  Reviewing skipped
                </Badge>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {skippedCount > 0 && (
                <Text data-testid="h2h-skipped-count">{`${skippedCount} skipped`}</Text>
              )}
              <Text data-testid="h2h-remaining-count">{`${progress.remaining} remaining`}</Text>
            </div>
          </div>

          <ProgressBar
            aria-label="Progress"
            value={progress.percentage}
            labelPosition="side"
            data-testid="h2h-progress-bar"
          />
        </div>

        <div className={centered}>
          <Heading level={2}>Which do you prefer?</Heading>
          <Text>Use arrow keys or click • Space to skip • Esc to finish</Text>
        </div>

        <div className={cardGrid}>
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

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <Button variant="secondary" fillStyle="outline" size="S" onPress={handleSkip} data-testid="h2h-skip">
            Skip this pair
          </Button>
          <Button variant="negative" size="S" onPress={() => setShowEndConfirm(true)} data-testid="h2h-end-apply">
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
    <div className={centered} data-testid="h2h-page">
      <Heading level={2}>All done!</Heading>
      <Text>You've compared all the items. Apply the results to update your tier list.</Text>
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
