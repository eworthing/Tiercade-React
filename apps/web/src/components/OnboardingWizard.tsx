import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@tiercade/ui";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  nextStep,
  prevStep,
  goToStep,
  completeOnboarding,
  skipOnboarding,
} from "@tiercade/state";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Tiercade",
    description: "Create beautiful tier lists with drag-and-drop ease",
    illustration: "welcome",
  },
  {
    id: "drag-drop",
    title: "Drag & Drop Items",
    description: "Simply drag items between tiers to rank them your way",
    illustration: "drag-drop",
  },
  {
    id: "head-to-head",
    title: "Head-to-Head Mode",
    description: "Can't decide? Compare items one-on-one for smarter rankings",
    illustration: "head-to-head",
  },
  {
    id: "customize",
    title: "Customize Everything",
    description: "Add images, change colors, create custom tiers - make it yours",
    illustration: "customize",
  },
  {
    id: "ready",
    title: "You're All Set!",
    description: "Start from scratch or pick a template to get going",
    illustration: "ready",
  },
];

// Illustration components for each step
const StepIllustration: React.FC<{ step: string }> = ({ step }) => {
  const illustrations: Record<string, React.ReactNode> = {
    welcome: (
      <div className="relative w-48 h-48">
        {/* Animated tier list icon */}
        <div className="absolute inset-0 flex flex-col gap-2 p-4">
          {["#ff7f7f", "#ffbf7f", "#ffdf7f", "#bfff7f"].map((color, i) => (
            <div
              key={color}
              className="h-8 rounded-md flex items-center gap-2 px-2 animate-slide-in-left"
              style={{
                backgroundColor: `${color}20`,
                borderLeft: `4px solid ${color}`,
                animationDelay: `${i * 100}ms`,
              }}
            >
              <div
                className="w-5 h-5 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 h-2 bg-surface-soft rounded" />
            </div>
          ))}
        </div>
        {/* Floating sparkles */}
        <div className="absolute -top-2 -right-2 text-warning animate-pulse-soft">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>
    ),
    "drag-drop": (
      <div className="relative w-48 h-48">
        {/* Card being dragged */}
        <div className="absolute top-6 left-8 w-16 h-16 bg-surface-raised border-2 border-accent rounded-lg shadow-modal flex items-center justify-center animate-bounce-gentle">
          <div className="w-10 h-10 bg-gradient-accent rounded-md" />
        </div>
        {/* Arrow showing movement */}
        <svg
          className="absolute top-16 left-24 w-20 h-10 text-accent animate-pulse-soft"
          fill="none"
          viewBox="0 0 80 40"
        >
          <path
            d="M5 20 Q40 5 75 20"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="6 4"
            fill="none"
          />
          <path d="M70 12 L75 20 L68 24" fill="currentColor" />
        </svg>
        {/* Target tier */}
        <div className="absolute bottom-4 right-4 w-24 h-12 rounded-md border-2 border-dashed border-success bg-success/10 flex items-center justify-center">
          <span className="text-success text-sm font-medium">S Tier</span>
        </div>
      </div>
    ),
    "head-to-head": (
      <div className="relative w-48 h-48">
        {/* VS badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center shadow-glow-gradient z-10 animate-pulse-soft">
            <span className="text-white font-bold text-sm">VS</span>
          </div>
        </div>
        {/* Left contender */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-16 h-20 bg-surface-raised border border-border rounded-lg flex items-center justify-center animate-slide-in-left">
          <div className="w-10 h-10 bg-amber-500 rounded-md" />
        </div>
        {/* Right contender */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-16 h-20 bg-surface-raised border border-border rounded-lg flex items-center justify-center animate-slide-in-right">
          <div className="w-10 h-10 bg-cyan-500 rounded-md" />
        </div>
      </div>
    ),
    customize: (
      <div className="relative w-48 h-48">
        {/* Color palette */}
        <div className="absolute top-4 left-4 flex gap-1">
          {["#ff7f7f", "#ffbf7f", "#ffdf7f", "#bfff7f", "#7fbfff", "#bf7fff"].map(
            (color, i) => (
              <div
                key={color}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm animate-pop"
                style={{
                  backgroundColor: color,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            )
          )}
        </div>
        {/* Theme card */}
        <div className="absolute bottom-4 inset-x-4 h-24 bg-surface-raised border border-border rounded-lg overflow-hidden">
          <div className="h-2 bg-gradient-accent" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-20 bg-surface-soft rounded" />
            <div className="h-3 w-full bg-surface-soft rounded" />
            <div className="h-3 w-16 bg-surface-soft rounded" />
          </div>
        </div>
        {/* Paint brush icon */}
        <svg
          className="absolute top-1/2 right-6 w-8 h-8 text-accent animate-wiggle"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </div>
    ),
    ready: (
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Celebratory circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-accent opacity-20 animate-pulse-soft" />
        </div>
        {/* Checkmark */}
        <div className="relative w-20 h-20 bg-success rounded-full flex items-center justify-center shadow-lg animate-pop">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        {/* Confetti particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              backgroundColor: ["#ff7f7f", "#ffbf7f", "#ffdf7f", "#bfff7f", "#7fbfff", "#bf7fff"][i % 6],
              top: "50%",
              left: "50%",
              animationDelay: `${i * 100}ms`,
              transform: `rotate(${i * 45}deg) translateY(-60px)`,
            }}
          />
        ))}
      </div>
    ),
  };

  return <div className="flex items-center justify-center">{illustrations[step]}</div>;
};

export const OnboardingWizard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentStep, hasCompletedOnboarding } = useAppSelector(
    (state) => state.onboarding
  );

  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isLastStep) {
          handleComplete();
        } else {
          dispatch(nextStep());
        }
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        dispatch(prevStep());
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, isLastStep, dispatch]);

  const handleComplete = useCallback(() => {
    dispatch(completeOnboarding());
  }, [dispatch]);

  const handleSkip = useCallback(() => {
    dispatch(skipOnboarding());
  }, [dispatch]);

  const handleStartFromScratch = () => {
    handleComplete();
    navigate("/");
  };

  const handleBrowseTemplates = () => {
    handleComplete();
    navigate("/templates");
  };

  if (hasCompletedOnboarding) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/95 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute -top-10 right-0 text-sm text-text-subtle hover:text-text transition-colors"
        >
          Skip
        </button>

        {/* Card */}
        <div className="bg-surface-raised border border-border rounded-2xl shadow-modal overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-surface-soft">
            <div
              className="h-full bg-gradient-accent transition-all duration-300 ease-spring"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Illustration */}
            <div className="flex justify-center">
              <StepIllustration step={currentStepData.illustration} />
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-text">{currentStepData.title}</h2>
              <p className="text-text-muted">{currentStepData.description}</p>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center gap-2">
              {STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => dispatch(goToStep(index))}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-200
                    ${
                      index === currentStep
                        ? "w-6 bg-accent"
                        : index < currentStep
                        ? "bg-accent/50"
                        : "bg-surface-soft"
                    }
                  `}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => dispatch(prevStep())}
                  className="flex-1"
                >
                  Back
                </Button>
              )}

              {isLastStep ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={handleStartFromScratch}
                    className="flex-1"
                  >
                    Start Fresh
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleBrowseTemplates}
                    className="flex-1"
                  >
                    Browse Templates
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => dispatch(nextStep())}
                  className="flex-1"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-xs text-text-subtle mt-4">
          Press <kbd className="px-1.5 py-0.5 bg-surface-raised rounded text-text-muted">Enter</kbd> to continue or{" "}
          <kbd className="px-1.5 py-0.5 bg-surface-raised rounded text-text-muted">Esc</kbd> to skip
        </p>
      </div>
    </div>
  );
};
