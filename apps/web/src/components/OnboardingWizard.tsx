import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@react-spectrum/s2";
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
      <div style={{ position: "relative", width: 192, height: 192 }}>
        {/* Animated tier list icon */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 8, padding: 16 }}>
          {["#ff7f7f", "#ffbf7f", "#ffdf7f", "#bfff7f"].map((color, i) => (
            <div
              key={color}
              style={{
                height: 32,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 8px",
                backgroundColor: `${color}20`,
                borderLeft: `4px solid ${color}`,
              }}
            >
              <div
                style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: color }}
              />
              <div style={{ flex: 1, height: 8, backgroundColor: "var(--spectrum-gray-200)", borderRadius: 4 }} />
            </div>
          ))}
        </div>
        {/* Floating sparkles */}
        <div style={{ position: "absolute", top: -8, right: -8, color: "var(--spectrum-orange-700)" }}>
          <svg style={{ width: 32, height: 32 }} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>
    ),
    "drag-drop": (
      <div style={{ position: "relative", width: 192, height: 192 }}>
        {/* Card being dragged */}
        <div style={{
          position: "absolute",
          top: 24,
          left: 32,
          width: 64,
          height: 64,
          backgroundColor: "var(--spectrum-gray-100)",
          border: "2px solid var(--spectrum-blue-700)",
          borderRadius: 8,
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ width: 40, height: 40, backgroundColor: "var(--spectrum-blue-700)", borderRadius: 6 }} />
        </div>
        {/* Arrow showing movement */}
        <svg
          style={{ position: "absolute", top: 64, left: 96, width: 80, height: 40, color: "var(--spectrum-blue-700)" }}
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
        <div style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          width: 96,
          height: 48,
          borderRadius: 6,
          border: "2px dashed var(--spectrum-green-700)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{ color: "var(--spectrum-green-800)", fontSize: 14, fontWeight: 500 }}>S Tier</span>
        </div>
      </div>
    ),
    "head-to-head": (
      <div style={{ position: "relative", width: 192, height: 192 }}>
        {/* VS badge */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 48,
            height: 48,
            backgroundColor: "var(--spectrum-blue-700)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
            zIndex: 10
          }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>VS</span>
          </div>
        </div>
        {/* Left contender */}
        <div style={{
          position: "absolute",
          left: 8,
          top: "50%",
          transform: "translateY(-50%)",
          width: 64,
          height: 80,
          backgroundColor: "var(--spectrum-gray-100)",
          border: "1px solid var(--spectrum-gray-300)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ width: 40, height: 40, backgroundColor: "#f59e0b", borderRadius: 6 }} />
        </div>
        {/* Right contender */}
        <div style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          width: 64,
          height: 80,
          backgroundColor: "var(--spectrum-gray-100)",
          border: "1px solid var(--spectrum-gray-300)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ width: 40, height: 40, backgroundColor: "#06b6d4", borderRadius: 6 }} />
        </div>
      </div>
    ),
    customize: (
      <div style={{ position: "relative", width: 192, height: 192 }}>
        {/* Color palette */}
        <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 4 }}>
          {["#ff7f7f", "#ffbf7f", "#ffdf7f", "#bfff7f", "#7fbfff", "#bf7fff"].map(
            (color, i) => (
              <div
                key={color}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                  backgroundColor: color,
                }}
              />
            )
          )}
        </div>
        {/* Theme card */}
        <div style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          height: 96,
          backgroundColor: "var(--spectrum-gray-100)",
          border: "1px solid var(--spectrum-gray-300)",
          borderRadius: 8,
          overflow: "hidden"
        }}>
          <div style={{ height: 8, backgroundColor: "var(--spectrum-blue-700)" }} />
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 12, width: 80, backgroundColor: "var(--spectrum-gray-200)", borderRadius: 4 }} />
            <div style={{ height: 12, width: "100%", backgroundColor: "var(--spectrum-gray-200)", borderRadius: 4 }} />
            <div style={{ height: 12, width: 64, backgroundColor: "var(--spectrum-gray-200)", borderRadius: 4 }} />
          </div>
        </div>
        {/* Paint brush icon */}
        <svg
          style={{ position: "absolute", top: "50%", right: 24, width: 32, height: 32, color: "var(--spectrum-blue-700)" }}
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
      <div style={{ position: "relative", width: 192, height: 192, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Celebratory circle */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 128, height: 128, borderRadius: "50%", backgroundColor: "var(--spectrum-blue-700)", opacity: 0.2 }} />
        </div>
        {/* Checkmark */}
        <div style={{
          position: "relative",
          width: 80,
          height: 80,
          backgroundColor: "var(--spectrum-green-700)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1)"
        }}>
          <svg
            style={{ width: 40, height: 40, color: "white" }}
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
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: ["#ff7f7f", "#ffbf7f", "#ffdf7f", "#bfff7f", "#7fbfff", "#bf7fff"][i % 6],
              top: "50%",
              left: "50%",
              transform: `rotate(${i * 45}deg) translateY(-60px)`,
            }}
          />
        ))}
      </div>
    ),
  };

  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{illustrations[step]}</div>;
};

export const OnboardingWizard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentStep, hasCompletedOnboarding } = useAppSelector(
    (state) => state.onboarding
  );
  const [skipHovered, setSkipHovered] = useState(false);

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
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      backdropFilter: "blur(4px)"
    }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 512, margin: "0 16px" }}>
        {/* Skip button */}
        <button
          onClick={handleSkip}
          onMouseEnter={() => setSkipHovered(true)}
          onMouseLeave={() => setSkipHovered(false)}
          style={{
            position: "absolute",
            top: -40,
            right: 0,
            fontSize: 14,
            color: skipHovered ? "var(--spectrum-gray-900)" : "var(--spectrum-gray-600)",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 150ms ease"
          }}
        >
          Skip
        </button>

        {/* Card */}
        <div style={{
          backgroundColor: "var(--spectrum-gray-100)",
          border: "1px solid var(--spectrum-gray-300)",
          borderRadius: 16,
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1), 0 20px 25px rgba(0, 0, 0, 0.1)",
          overflow: "hidden"
        }}>
          {/* Progress bar */}
          <div style={{ height: 4, backgroundColor: "var(--spectrum-gray-200)" }}>
            <div
              style={{
                height: "100%",
                backgroundColor: "var(--spectrum-blue-700)",
                transition: "width 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                width: `${((currentStep + 1) / STEPS.length) * 100}%`
              }}
            />
          </div>

          {/* Content */}
          <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Illustration */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <StepIllustration step={currentStepData.illustration} />
            </div>

            {/* Text */}
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--spectrum-gray-900)" }}>{currentStepData.title}</h2>
              <p style={{ color: "var(--spectrum-gray-700)" }}>{currentStepData.description}</p>
            </div>

            {/* Navigation dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              {STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => dispatch(goToStep(index))}
                  style={{
                    width: index === currentStep ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 200ms ease",
                    backgroundColor: index === currentStep
                      ? "var(--spectrum-blue-700)"
                      : index < currentStep
                      ? "rgba(99, 102, 241, 0.5)"
                      : "var(--spectrum-gray-200)"
                  }}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              {currentStep > 0 && (
                <div style={{ flex: 1 }}>
                  <Button
                    variant="secondary"
                    onPress={() => dispatch(prevStep())}
                  >
                    Back
                  </Button>
                </div>
              )}

              {isLastStep ? (
                <>
                  <div style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      onPress={handleStartFromScratch}
                    >
                      Start Fresh
                    </Button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Button
                      variant="accent"
                      onPress={handleBrowseTemplates}
                    >
                      Browse Templates
                    </Button>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1 }}>
                  <Button
                    variant="accent"
                    onPress={() => dispatch(nextStep())}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--spectrum-gray-600)", marginTop: 16 }}>
          Press <kbd style={{ padding: "2px 6px", backgroundColor: "var(--spectrum-gray-100)", borderRadius: 4, color: "var(--spectrum-gray-700)" }}>Enter</kbd> to continue or{" "}
          <kbd style={{ padding: "2px 6px", backgroundColor: "var(--spectrum-gray-100)", borderRadius: 4, color: "var(--spectrum-gray-700)" }}>Esc</kbd> to skip
        </p>
      </div>
    </div>
  );
};
