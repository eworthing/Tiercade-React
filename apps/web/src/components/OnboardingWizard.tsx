import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogTrigger,
  Heading,
  IllustratedMessage,
  ProgressBar,
} from "@react-spectrum/s2";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  nextStep,
  prevStep,
  completeOnboarding,
  skipOnboarding,
} from "@tiercade/state";
import Addproject from "@react-spectrum/s2/illustrations/linear/Addproject";
import Search from "@react-spectrum/s2/illustrations/linear/Search";
import DataAnalytics from "@react-spectrum/s2/illustrations/linear/DataAnalytics";
import Color from "@react-spectrum/s2/illustrations/linear/Color";

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

export const OnboardingWizard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentStep, hasCompletedOnboarding } = useAppSelector(
    (state) => state.onboarding
  );

  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const progressValue = Math.round(((currentStep + 1) / STEPS.length) * 100);

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
    <DialogTrigger
      isOpen={!hasCompletedOnboarding}
      onOpenChange={(isOpen) => !isOpen && handleSkip()}
    >
      <span style={{ display: "none" }}>
        <Button aria-hidden="true">Open</Button>
      </span>
      <Dialog size="L" data-testid="onboarding-wizard">
        <Heading>Welcome to Tiercade</Heading>
        <Content>
          <ProgressBar
            label="Onboarding progress"
            value={progressValue}
            size="S"
          />

          <IllustratedMessage>
            {currentStepData.illustration === "welcome" && <Addproject />}
            {currentStepData.illustration === "drag-drop" && <Search />}
            {currentStepData.illustration === "head-to-head" && <DataAnalytics />}
            {currentStepData.illustration === "customize" && <Color />}
            {currentStepData.illustration === "ready" && <Addproject />}
            <Heading>{currentStepData.title}</Heading>
            <Content>{currentStepData.description}</Content>
          </IllustratedMessage>
        </Content>
        <ButtonGroup>
          <Button
            variant="secondary"
            fillStyle="outline"
            onPress={handleSkip}
            data-testid="onboarding-skip"
          >
            Skip
          </Button>
          {currentStep > 0 && (
            <Button variant="secondary" onPress={() => dispatch(prevStep())}>
              Back
            </Button>
          )}
          {isLastStep ? (
            <>
              <Button variant="secondary" onPress={handleStartFromScratch}>
                Start Fresh
              </Button>
              <Button variant="accent" onPress={handleBrowseTemplates}>
                Browse Templates
              </Button>
            </>
          ) : (
            <Button variant="accent" onPress={() => dispatch(nextStep())}>
              Next
            </Button>
          )}
        </ButtonGroup>
      </Dialog>
    </DialogTrigger>
  );
};
