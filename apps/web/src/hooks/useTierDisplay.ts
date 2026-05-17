import { useMemo } from "react";
import {
  selectSelectedThemeId,
  selectTierOrder,
  selectTierLabels,
  selectTierColors,
} from "@tiercade/state";
import { DEFAULT_THEME_ID, findThemeById, getTierColorHex } from "@tiercade/theme";
import { UNRANKED_TIER_ID } from "@tiercade/core";
import { useAppSelector } from "./useAppSelector";

export interface TierDisplayResult {
  tierColors: Record<string, string>;
  tierLabels: Record<string, string>;
}

/**
 * Computes resolved tier colors and labels from theme + custom overrides.
 * Concentrates all theme-resolution logic behind one interface:
 *   - Merges state-stored custom colors/labels with theme defaults
 *   - Handles index-based theme tier lookup
 *   - Ensures unranked tier always has a color and label
 */
export function useTierDisplay(): TierDisplayResult {
  const selectedThemeId = useAppSelector(selectSelectedThemeId);
  const tierOrder = useAppSelector(selectTierOrder);
  const stateTierLabels = useAppSelector(selectTierLabels);
  const stateTierColors = useAppSelector(selectTierColors);

  return useMemo(() => {
    const themeId = selectedThemeId ?? DEFAULT_THEME_ID;
    const theme = findThemeById(themeId);

    const colors: Record<string, string> = {};
    const labels: Record<string, string> = {};

    tierOrder.forEach((tierId, index) => {
      colors[tierId] =
        stateTierColors[tierId] ??
        (theme ? getTierColorHex(theme, tierId, index) : "#1e293b");

      if (stateTierLabels[tierId]) {
        labels[tierId] = stateTierLabels[tierId];
      } else if (theme) {
        const themeTier = theme.tiers.find(
          (t) =>
            !t.isUnranked &&
            (t.name.toLowerCase() === tierId.toLowerCase() || t.index === index)
        );
        labels[tierId] = themeTier?.name ?? tierId;
      } else {
        labels[tierId] = tierId;
      }
    });

    colors[UNRANKED_TIER_ID] =
      stateTierColors[UNRANKED_TIER_ID] ??
      (theme ? getTierColorHex(theme, UNRANKED_TIER_ID) : "#374151");
    labels[UNRANKED_TIER_ID] = stateTierLabels[UNRANKED_TIER_ID] ?? "Unranked";

    return { tierColors: colors, tierLabels: labels };
  }, [selectedThemeId, tierOrder, stateTierLabels, stateTierColors]);
}
