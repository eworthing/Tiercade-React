export const palette = {
  background: "#020617",
  surface: "#020617",
  surfaceSoft: "#0f172a",
  border: "#1e293b",
  text: "#e5e7eb",
  tierDefault: "#1e293b"
} as const;

/**
 * Predefined tier color palette for user customization.
 * Colors are chosen for good contrast and accessibility.
 */
export const TIER_COLOR_PALETTE = [
  "#FF6B6B", // Red
  "#FFA94D", // Orange
  "#FFE066", // Yellow
  "#69DB7C", // Green
  "#74C0FC", // Blue
  "#B197FC", // Purple
  "#F783AC", // Pink
  "#63E6BE", // Teal
  "#868E96", // Gray
] as const;

/**
 * Modern OKLCH color palette for "Universal App" feel.
 * Perceptually uniform colors for better hierarchy.
 */
export const TIER_COLORS_OKLCH = [
  "oklch(0.7 0.15 25)",    // S - Red
  "oklch(0.75 0.12 60)",   // A - Orange
  "oklch(0.8 0.1 95)",     // B - Yellow
  "oklch(0.75 0.1 145)",   // C - Green
  "oklch(0.7 0.08 230)",   // D - Blue
  "oklch(0.65 0.1 300)",   // F - Purple
  "oklch(0.6 0.05 270)",   // Unranked - Slate/Purple
] as const;

export const SHADOWS = {
  resting: "0 1px 2px rgba(0, 0, 0, 0.1)",
  lifted: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  dropped: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  selected: "0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)",
} as const;

/**
 * Default tier configurations for quick setup.
 */
export const TIER_PRESETS = [
  {
    name: "S-A-B-C-D-F",
    tiers: [
      { id: "S", label: "S", color: "#FF6B6B" },
      { id: "A", label: "A", color: "#FFA94D" },
      { id: "B", label: "B", color: "#FFE066" },
      { id: "C", label: "C", color: "#69DB7C" },
      { id: "D", label: "D", color: "#74C0FC" },
      { id: "F", label: "F", color: "#B197FC" },
    ],
  },
  {
    name: "1-2-3-4-5",
    tiers: [
      { id: "1", label: "1st", color: "#FFD700" },
      { id: "2", label: "2nd", color: "#C0C0C0" },
      { id: "3", label: "3rd", color: "#CD7F32" },
      { id: "4", label: "4th", color: "#69DB7C" },
      { id: "5", label: "5th", color: "#74C0FC" },
    ],
  },
  {
    name: "Gold-Silver-Bronze",
    tiers: [
      { id: "gold", label: "Gold", color: "#FFD700" },
      { id: "silver", label: "Silver", color: "#C0C0C0" },
      { id: "bronze", label: "Bronze", color: "#CD7F32" },
    ],
  },
] as const;

