import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  skipped: boolean;
}

const STORAGE_KEY = "tiercade-onboarding";

// Load initial state from localStorage
function loadInitialState(): OnboardingState {
  if (typeof window === "undefined") {
    return {
      hasCompletedOnboarding: false,
      currentStep: 0,
      totalSteps: 5,
      skipped: false,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        hasCompletedOnboarding: parsed.hasCompletedOnboarding ?? false,
        currentStep: 0,
        totalSteps: 5,
        skipped: parsed.skipped ?? false,
      };
    }
  } catch {
    // Ignore parse errors
  }

  return {
    hasCompletedOnboarding: false,
    currentStep: 0,
    totalSteps: 5,
    skipped: false,
  };
}

const initialState: OnboardingState = loadInitialState();

export const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    nextStep(state) {
      if (state.currentStep < state.totalSteps - 1) {
        state.currentStep += 1;
      }
    },
    prevStep(state) {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },
    goToStep(state, action: PayloadAction<number>) {
      if (action.payload >= 0 && action.payload < state.totalSteps) {
        state.currentStep = action.payload;
      }
    },
    completeOnboarding(state) {
      state.hasCompletedOnboarding = true;
      state.currentStep = 0;
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ hasCompletedOnboarding: true, skipped: false })
        );
      }
    },
    skipOnboarding(state) {
      state.hasCompletedOnboarding = true;
      state.skipped = true;
      state.currentStep = 0;
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ hasCompletedOnboarding: true, skipped: true })
        );
      }
    },
    resetOnboarding(state) {
      state.hasCompletedOnboarding = false;
      state.currentStep = 0;
      state.skipped = false;
      // Clear from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
  },
});

export const {
  nextStep,
  prevStep,
  goToStep,
  completeOnboarding,
  skipOnboarding,
  resetOnboarding,
} = onboardingSlice.actions;

export const onboardingReducer = onboardingSlice.reducer;
