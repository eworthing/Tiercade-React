/** Font family tokens */
export const fontFamily = {
  /** Display font — headings, brand, tier labels */
  display: "'Unbounded', system-ui, sans-serif",
  /** Body font — UI text, buttons, navigation */
  body: "'Outfit', system-ui, sans-serif",
  /** Mono — keyboard shortcuts only */
  mono: "ui-monospace, monospace",
} as const;

/** Font size tokens (px) */
export const fontSize = {
  /** Tiny labels, badges */
  xs: 11,
  /** Small body, captions */
  sm: 12,
  /** Default body text */
  base: 14,
  /** Slightly larger body */
  md: 15,
  /** Brand wordmark */
  lg: 18,
  /** Tier labels, logo "T" */
  xl: 20,
  /** Page headings, empty state headings */
  "2xl": 24,
  /** Page headings (large) */
  "3xl": 28,
  /** H2H VS text */
  "4xl": 48,
} as const;

/** Font weight tokens */
export const fontWeight = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Legacy export — keep backward compat
export const typography = {
  tierLabelSize: fontSize.xl,
  cardTextSize: fontSize.sm,
} as const;
