import React from "react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { selectTheme } from "@tiercade/state";
import {
  BUNDLED_THEMES,
  DEFAULT_THEME_ID,
  findThemeById,
  type TierTheme
} from "@tiercade/theme";

export function ThemesPage() {
  const dispatch = useAppDispatch();
  const selectedThemeId = useAppSelector((state) => state.theme.selectedThemeId);
  const currentThemeId = selectedThemeId ?? DEFAULT_THEME_ID;
  const currentTheme = findThemeById(currentThemeId);

  const handleSelectTheme = (themeId: string) => {
    dispatch(selectTheme(themeId));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Themes</h1>
      <p className="text-slate-400 mb-6">
        Choose a color theme for your tier list
      </p>

      {currentTheme && (
        <div
          data-testid="current-theme"
          className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <h2 className="text-lg font-semibold mb-2">Current Theme</h2>
          <div className="flex items-center gap-4">
            <ThemePreview theme={currentTheme} />
            <div>
              <div className="font-medium text-white">{currentTheme.displayName}</div>
              <div className="text-sm text-slate-400">{currentTheme.shortDescription}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUNDLED_THEMES.map((theme) => {
          const isSelected = theme.id === currentThemeId;
          return (
            <button
              key={theme.id}
              data-testid={`theme-card-${theme.id}`}
              onClick={() => handleSelectTheme(theme.id)}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-900/20 ring-2 ring-blue-500/50"
                    : "border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50"
                }
              `}
            >
              <ThemePreview theme={theme} />
              <div className="mt-3">
                <div className="font-medium text-white flex items-center gap-2">
                  {theme.displayName}
                  {isSelected && (
                    <span className="text-xs text-blue-400">✓ Active</span>
                  )}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {theme.shortDescription}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThemePreview({ theme }: { theme: TierTheme }) {
  const rankedTiers = theme.tiers.filter((t) => !t.isUnranked);

  return (
    <div data-testid="theme-preview" className="flex gap-1 h-8">
      {rankedTiers.map((tier) => (
        <div
          key={tier.id}
          className="flex-1 rounded"
          style={{ backgroundColor: tier.colorHex }}
          title={tier.name}
        />
      ))}
    </div>
  );
}
