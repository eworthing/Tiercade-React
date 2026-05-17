import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  skipped: boolean;
}

const initialState: OnboardingState = {
  hasCompletedOnboarding: false,
  currentStep: 0,
  totalSteps: 5,
  skipped: false,
};

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
    },
    skipOnboarding(state) {
      state.hasCompletedOnboarding = true;
      state.skipped = true;
      state.currentStep = 0;
    },
    resetOnboarding(state) {
      state.hasCompletedOnboarding = false;
      state.currentStep = 0;
      state.skipped = false;
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
