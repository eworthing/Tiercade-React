/**
 * NativeWind-compatible theme exports for React Native
 * These are used by apps/native/tailwind.config.js and can be imported
 * directly in components for programmatic access to tokens.
 */
import { palette, paletteLight } from "./palette";
import { metrics } from "./metrics";
import { timing, easing, springs } from "./motion";

/**
 * Reanimated-compatible spring configurations
 * These mirror the Framer Motion springs but in Reanimated format
 */
export const reanimatedSprings = {
  snappy: {
    damping: 30,
    stiffness: 500,
    mass: 1,
  },
  gentle: {
    damping: 25,
    stiffness: 300,
    mass: 0.8,
  },
  bouncy: {
    damping: 15,
    stiffness: 400,
    mass: 0.5,
  },
  stiff: {
    damping: 35,
    stiffness: 700,
    mass: 0.8,
  },
} as const;

/**
 * Timing durations in milliseconds for Reanimated
 */
export const reanimatedTiming = {
  instant: timing.instant * 1000, // 100ms
  fast: timing.fast * 1000, // 150ms
  normal: timing.normal * 1000, // 200ms
  slow: timing.slow * 1000, // 300ms
  deliberate: timing.deliberate * 1000, // 400ms
} as const;

/**
 * Easing functions for Reanimated (Bezier curves)
 * Note: Reanimated uses Easing.bezier() which expects 4 numbers
 */
export const reanimatedEasing = {
  standard: easing.standard as readonly [number, number, number, number],
  easeOut: easing.easeOut as readonly [number, number, number, number],
  easeIn: easing.easeIn as readonly [number, number, number, number],
  sharp: easing.sharp as readonly [number, number, number, number],
  bounce: easing.bounce as readonly [number, number, number, number],
} as const;

/**
 * Animation presets combining spring/timing with common use cases
 */
export const animationPresets = {
  // Card interactions
  cardPress: {
    scale: 0.98,
    duration: reanimatedTiming.instant,
  },
  cardHover: {
    scale: 1.02,
    duration: reanimatedTiming.fast,
  },
  // Drag states
  dragStart: {
    scale: 1.05,
    spring: reanimatedSprings.snappy,
  },
  dragEnd: {
    scale: 1,
    spring: reanimatedSprings.bouncy,
  },
  // Focus states (tvOS)
  focusIn: {
    scale: 1.1,
    spring: reanimatedSprings.snappy,
  },
  focusOut: {
    scale: 1,
    spring: reanimatedSprings.gentle,
  },
  // Overlay animations
  overlayEnter: {
    opacity: { from: 0, to: 1 },
    translateY: { from: 20, to: 0 },
    duration: reanimatedTiming.normal,
  },
  overlayExit: {
    opacity: { from: 1, to: 0 },
    translateY: { from: 0, to: 10 },
    duration: reanimatedTiming.fast,
  },
} as const;

/**
 * tvOS-specific metrics and sizing
 * Larger touch targets and spacing for remote navigation
 */
export const tvosMetrics = {
  // Scale factor for TV (typically 1.5-2x)
  scaleFactor: 1.5,
  // Minimum focusable element size
  minFocusableSize: 80,
  // Recommended spacing between focusable elements
  focusableGap: 24,
  // Focus indicator padding
  focusPadding: 8,
  // Card sizes for TV
  cardSizes: {
    small: { width: 120, height: 150 },
    medium: { width: 180, height: 240 },
    large: { width: 240, height: 300 },
  },
  // Tier row heights
  tierRow: {
    minHeight: 120,
    labelWidth: 96,
  },
} as const;

/**
 * Glass effect configuration for Skia
 * Note: These are for fixed-position glass only (toolbars, headers)
 * For glass over scrollable content, use BlurView instead
 */
export const glassEffects = {
  // Standard glass (toolbars, cards)
  standard: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    blurRadius: 12,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
  },
  // Strong glass (overlays, modals)
  strong: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    blurRadius: 20,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
  },
  // Light glass (highlights, accents)
  light: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    blurRadius: 8,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
  },
} as const;

/**
 * NativeWind theme object
 * This can be imported and used for programmatic style access
 */
export const nativewindTheme = {
  colors: {
    dark: palette,
    light: paletteLight,
  },
  spacing: metrics.spacing,
  radii: metrics.radii,
  animation: {
    springs: reanimatedSprings,
    timing: reanimatedTiming,
    easing: reanimatedEasing,
    presets: animationPresets,
  },
  tvos: tvosMetrics,
  glass: glassEffects,
} as const;

// Type exports for TypeScript consumers
export type ReanimatedSpring = typeof reanimatedSprings[keyof typeof reanimatedSprings];
export type ReanimatedTiming = typeof reanimatedTiming[keyof typeof reanimatedTiming];
export type AnimationPreset = typeof animationPresets[keyof typeof animationPresets];
export type GlassEffect = typeof glassEffects[keyof typeof glassEffects];
export type TVOSMetrics = typeof tvosMetrics;
