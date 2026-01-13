/**
 * Spectrum 2 Design Tokens
 *
 * This file provides platform-agnostic design tokens aligned with
 * Adobe Spectrum 2 design system. These values are used for:
 * - Web: CSS variables via S2 style macros
 * - Native: Direct values in React Native stylesheets
 *
 * All values are based on Spectrum 2 specifications.
 * See: https://spectrum.adobe.com/page/design-tokens/
 */

// Color palette based on Spectrum 2 gray scale (dark theme)
export const colors = {
  // Gray scale (dark theme values)
  gray50: "#1d1d1d",
  gray75: "#262626",
  gray100: "#323232",
  gray200: "#3e3e3e",
  gray300: "#4a4a4a",
  gray400: "#5a5a5a",
  gray500: "#6e6e6e",
  gray600: "#8b8b8b",
  gray700: "#aeaeae",
  gray800: "#d4d4d4",
  gray900: "#ebebeb",

  // Semantic colors (Spectrum 2)
  accent: "#0d66d0",
  accentHover: "#095aba",
  accentPressed: "#074c9e",
  negative: "#d7373f",
  negativeHover: "#c22f37",
  negativePressed: "#ad282e",
  positive: "#268e6c",
  positiveHover: "#1f7a5c",
  positivePressed: "#18664c",
  notice: "#e68619",
  noticeHover: "#d47711",
  noticePressed: "#c26809",
  informative: "#378ef0",
  informativeHover: "#2680eb",
  informativePressed: "#1473e6",

  // Background colors
  backgroundBase: "#1d1d1d",
  backgroundLayer1: "#262626",
  backgroundLayer2: "#323232",

  // Text colors
  textPrimary: "#ebebeb",
  textSecondary: "#aeaeae",
  textDisabled: "#6e6e6e",
  textInverse: "#1d1d1d",

  // Border colors
  borderDefault: "#4a4a4a",
  borderHover: "#5a5a5a",
  borderFocus: "#0d66d0",
  borderDisabled: "#3e3e3e",

  // Static colors (don't change with theme)
  staticWhite: "#ffffff",
  staticBlack: "#000000",
  transparent: "transparent",
} as const;

// Spacing scale (in pixels, based on 4px grid)
export const spacing = {
  0: 0,
  4: 4,     // xs
  8: 8,     // sm
  12: 12,   // md
  16: 16,   // lg
  20: 20,
  24: 24,   // xl
  32: 32,   // 2xl
  40: 40,
  48: 48,   // 3xl
  64: 64,   // 4xl
  80: 80,
  96: 96,
} as const;

// Border radius scale
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Typography scale (based on Spectrum 2)
export const fontSizes = {
  "body-xs": 11,
  "body-sm": 12,
  "body-md": 14,
  "body-lg": 16,
  "body-xl": 18,
  "heading-xs": 14,
  "heading-sm": 16,
  "heading-md": 20,
  "heading-lg": 24,
  "heading-xl": 28,
  "title-sm": 32,
  "title-md": 40,
  "title-lg": 48,
  "title-xl": 56,
} as const;

// Font weights
export const fontWeights = {
  regular: 400,
  medium: 500,
  bold: 700,
} as const;

// Line heights
export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Animation durations (in ms, Spectrum 2 motion)
export const durations = {
  instant: 0,
  fast: 130,      // --spectrum-animation-duration-100
  normal: 200,    // --spectrum-animation-duration-200
  slow: 350,      // --spectrum-animation-duration-300
  slower: 500,    // --spectrum-animation-duration-400
} as const;

// Animation easings (Spectrum 2 motion)
export const easings = {
  default: "cubic-bezier(0.45, 0, 0.40, 1)",      // ease-in-out
  enter: "cubic-bezier(0, 0, 0.40, 1)",           // ease-out
  exit: "cubic-bezier(0.45, 0, 1, 1)",            // ease-in
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",   // spring-like
} as const;

// Z-index scale
export const zIndices = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
} as const;

// Shadow scale (for elevation)
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.25)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
  focus: "0 0 0 2px rgba(13, 102, 208, 0.5)",
} as const;

// Component-specific sizes
export const componentSizes = {
  buttonHeight: {
    S: 24,
    M: 32,
    L: 40,
    XL: 48,
  },
  inputHeight: {
    S: 24,
    M: 32,
    L: 40,
  },
  iconSize: {
    S: 16,
    M: 20,
    L: 24,
    XL: 32,
  },
} as const;

// Export as single tokens object for convenience
export const spectrumTokens = {
  colors,
  spacing,
  radii,
  fontSizes,
  fontWeights,
  lineHeights,
  durations,
  easings,
  zIndices,
  shadows,
  componentSizes,
} as const;

// Type exports
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiiToken = keyof typeof radii;
export type FontSizeToken = keyof typeof fontSizes;
export type DurationToken = keyof typeof durations;
export type EasingToken = keyof typeof easings;
