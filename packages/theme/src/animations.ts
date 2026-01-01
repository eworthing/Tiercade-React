/**
 * Animation duration and timing constants
 *
 * Centralizes all animation values for consistency across components
 */

/** Duration values in milliseconds */
export const DURATION = {
  /** Fast micro-interactions (hover, focus) */
  FAST: 100,
  /** Standard UI transitions */
  NORMAL: 200,
  /** Deliberate transitions (modal open/close) */
  SLOW: 300,
  /** Extended animations (page transitions) */
  EXTENDED: 500,
} as const;

/** Stagger delays for sequential animations in milliseconds */
export const STAGGER = {
  /** Fast stagger for lists */
  FAST: 30,
  /** Normal stagger */
  NORMAL: 50,
  /** Slow stagger for emphasis */
  SLOW: 100,
} as const;

/** Toast-specific timing */
export const TOAST = {
  /** Default time toast is visible (ms) */
  DEFAULT_DURATION: 4000,
  /** Exit animation duration (ms) */
  EXIT_DURATION: 200,
  /** Stagger delay between multiple toasts */
  STAGGER: 50,
} as const;

/** Celebration/effect timing */
export const EFFECTS = {
  /** S-tier celebration duration (ms) */
  CELEBRATION_DURATION: 2000,
  /** Confetti animation duration (ms) */
  CONFETTI_DURATION: 1500,
} as const;

/** Easing functions */
export const EASING = {
  /** Standard easing for most transitions */
  DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
  /** Spring-like easing for playful interactions */
  SPRING: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Ease out for elements entering */
  EASE_OUT: "cubic-bezier(0, 0, 0.2, 1)",
  /** Ease in for elements leaving */
  EASE_IN: "cubic-bezier(0.4, 0, 1, 1)",
  /** Bounce effect */
  BOUNCE: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

/** Drag activation constraints */
export const DRAG = {
  /** Minimum distance to start drag (prevents accidental drags on click) */
  ACTIVATION_DISTANCE: 8,
} as const;
