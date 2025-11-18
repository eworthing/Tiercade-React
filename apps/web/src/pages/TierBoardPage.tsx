import React, { useEffect, useMemo } from "react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { TierBoard } from "@tiercade/ui";
import { moveItemBetweenTiersWithUndo, loadDefaultProject, selectTheme } from "@tiercade/state";
import {
  DEFAULT_THEME_ID,
  findThemeById,
  getTierColorHex
} from "@tiercade/theme";

export const TierBoardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const tiers = useAppSelector((state) => state.tier.tiers);
  const tierOrder = useAppSelector((state) => state.tier.tierOrder);
  const selectedThemeId = useAppSelector((state) => state.theme.selectedThemeId);

  // Initialize default theme on first load
  useEffect(() => {
    if (!selectedThemeId) {
      dispatch(selectTheme(DEFAULT_THEME_ID));
    }
  }, [dispatch, selectedThemeId]);

  // Load default project on mount if no tier order is set
  useEffect(() => {
    if (!tierOrder || tierOrder.length === 0) {
      dispatch(loadDefaultProject());
    }
  }, [dispatch, tierOrder]);

  // Compute tier colors and labels from theme
  const { tierColors, tierLabels } = useMemo(() => {
    const themeId = selectedThemeId ?? DEFAULT_THEME_ID;
    const theme = findThemeById(themeId);
    if (!theme) {
      return { tierColors: {}, tierLabels: {} };
    }

    const colors: Record<string, string> = {};
    const labels: Record<string, string> = {};

    // Map theme colors to tier IDs
    tierOrder.forEach((tierId, index) => {
      colors[tierId] = getTierColorHex(theme, tierId, index);
      // Use theme tier names as labels if they match
      const themeTier = theme.tiers.find(
        (t) =>
          !t.isUnranked &&
          (t.name.toLowerCase() === tierId.toLowerCase() || t.index === index)
      );
      if (themeTier) {
        labels[tierId] = themeTier.name;
      }
    });

    // Unranked tier
    colors["unranked"] = getTierColorHex(theme, "unranked");
    labels["unranked"] = "Unranked";

    return { tierColors: colors, tierLabels: labels };
  }, [selectedThemeId, tierOrder]);

  if (!tierOrder.length) {
    return (
      <div className="text-slate-300">
        <p>Loading default tier list...</p>
      </div>
    );
  }

  const handleMoveItem = (itemId: string, targetTierName: string) => {
    dispatch(moveItemBetweenTiersWithUndo(itemId, targetTierName));
  };

  return (
    <TierBoard
      tiers={tiers}
      tierOrder={tierOrder}
      onMoveItem={handleMoveItem}
      tierColors={tierColors}
      tierLabels={tierLabels}
    />
  );
};
