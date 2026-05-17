import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import {
  startHeadToHead,
  voteCurrentPair,
  skipPair,
  finishHeadToHead,
  selectHeadToHeadCurrentPair,
  selectHeadToHeadIsActive,
} from "@tiercade/state";

interface UseHeadToHeadHandlersResult {
  onStart: () => void;
  onVoteLeft: () => void;
  onVoteRight: () => void;
  onSkip: () => void;
  onFinish: () => void;
  /** Navigate to home — exposed so callers don't need their own useNavigate() */
  onGoHome: () => void;
}

/**
 * Head-to-Head action handler hook — concentrates vote, skip, start, and
 * finish dispatch behind a stable Interface. Reads isActive and currentPair
 * selectors internally; registers the keyboard shortcut effect.
 *
 * Returns: { onStart, onVoteLeft, onVoteRight, onSkip, onFinish }
 */
export function useHeadToHeadHandlers(
  onOpenEndConfirm: () => void
): UseHeadToHeadHandlersResult {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isActive = useAppSelector(selectHeadToHeadIsActive);
  const currentPair = useAppSelector(selectHeadToHeadCurrentPair);

  const onStart = useCallback(() => {
    dispatch(startHeadToHead());
  }, [dispatch]);

  const onVoteLeft = useCallback(() => {
    if (!currentPair) return;
    dispatch(voteCurrentPair(currentPair[0].id));
  }, [dispatch, currentPair]);

  const onVoteRight = useCallback(() => {
    if (!currentPair) return;
    dispatch(voteCurrentPair(currentPair[1].id));
  }, [dispatch, currentPair]);

  const onSkip = useCallback(() => {
    if (!currentPair) return;
    dispatch(skipPair());
  }, [dispatch, currentPair]);

  const onFinish = useCallback(() => {
    dispatch(finishHeadToHead());
    navigate("/");
  }, [dispatch, navigate]);

  const onGoHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Keyboard shortcuts (Arrow keys = vote; Space = skip; Escape = end confirm)
  useEffect(() => {
    if (!isActive || !currentPair) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore shortcuts when a modal/dialog is open
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "1":
          e.preventDefault();
          onVoteLeft();
          break;
        case "ArrowRight":
        case "2":
          e.preventDefault();
          onVoteRight();
          break;
        case " ":
          e.preventDefault();
          onSkip();
          break;
        case "Escape":
          e.preventDefault();
          onOpenEndConfirm();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentPair, onVoteLeft, onVoteRight, onSkip, onOpenEndConfirm]);

  return { onStart, onVoteLeft, onVoteRight, onSkip, onFinish, onGoHome };
}
