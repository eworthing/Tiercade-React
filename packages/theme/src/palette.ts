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

