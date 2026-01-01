/**
 * Motion/animation tokens for Tiercade
 * Framer Motion variants for web, can be adapted for React Native Reanimated
 */
import type { Variants, Transition } from "framer-motion";

// Timing presets
export const timing = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  deliberate: 0.4,
} as const;

// Easing curves
export const easing = {
  // Standard easing for most transitions
  standard: [0.4, 0, 0.2, 1],
  // Deceleration for elements entering
  easeOut: [0, 0, 0.2, 1],
  // Acceleration for elements leaving
  easeIn: [0.4, 0, 1, 1],
  // Sharp for elements that may return
  sharp: [0.4, 0, 0.6, 1],
  // Spring-like bounce
  bounce: [0.34, 1.56, 0.64, 1],
} as const;

// Reusable spring configurations
export const springs = {
  // Snappy, responsive spring
  snappy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 1,
  },
  // Gentle, smooth spring
  gentle: {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
    mass: 0.8,
  },
  // Bouncy spring for playful interactions
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
    mass: 0.5,
  },
  // Stiff spring for immediate response
  stiff: {
    type: "spring" as const,
    stiffness: 700,
    damping: 35,
    mass: 0.8,
  },
} as const;

// Fade variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: timing.normal, ease: easing.standard },
  },
  exit: {
    opacity: 0,
    transition: { duration: timing.fast, ease: easing.easeIn },
  },
};

// Scale + fade for cards/items
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: timing.normal, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: timing.fast, ease: easing.easeIn },
  },
};

// Slide up for modals/overlays
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: timing.normal, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: timing.fast, ease: easing.easeIn },
  },
};

// Slide in from side (for drawers/panels)
export const slideInVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: timing.normal, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: timing.fast, ease: easing.easeIn },
  },
};

// Drag item variants
export const dragItemVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    zIndex: 0,
  },
  dragging: {
    scale: 1.05,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
    zIndex: 50,
    transition: springs.snappy,
  },
  drop: {
    scale: 1,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    zIndex: 0,
    transition: springs.bouncy,
  },
};

// Selection indicator
export const selectionVariants: Variants = {
  unselected: {
    scale: 1,
    borderColor: "transparent",
  },
  selected: {
    scale: 1.02,
    borderColor: "#3b82f6",
    transition: springs.snappy,
  },
};

// Hover states for interactive elements
export const hoverVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: timing.fast, ease: easing.easeOut },
  },
  tap: {
    scale: 0.98,
    transition: { duration: timing.instant },
  },
};

// Stagger children (for lists)
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: timing.normal, ease: easing.easeOut },
  },
};

// Drop target highlight
export const dropTargetVariants: Variants = {
  idle: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  active: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "#3b82f6",
    transition: { duration: timing.fast },
  },
};

// Tier row expand/collapse
export const expandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: timing.normal, ease: easing.easeIn },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: timing.normal, ease: easing.easeOut },
  },
};

// Tooltip/popover variants
export const popoverVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: { duration: timing.fast },
  },
};

// Default transition for simple animations
export const defaultTransition: Transition = {
  duration: timing.normal,
  ease: easing.standard,
};

// Export types
export type TimingKey = keyof typeof timing;
export type EasingKey = keyof typeof easing;
export type SpringKey = keyof typeof springs;
