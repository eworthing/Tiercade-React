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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Themes</h1>
        <p className="text-text-muted mt-1">
          Choose a color theme for your tier list
        </p>
      </div>

      {currentTheme && (
        <div
          data-testid="current-theme"
          className="p-4 bg-surface-raised rounded-lg border border-border"
        >
          <h2 className="text-lg font-semibold text-text mb-3">Current Theme</h2>
          <div className="flex items-center gap-4">
            <ThemePreview theme={currentTheme} />
            <div>
              <div className="font-medium text-text">{currentTheme.displayName}</div>
              <div className="text-sm text-text-muted">{currentTheme.shortDescription}</div>
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
                hover:scale-[1.02] active:scale-[0.98] transform-gpu
                ${
                  isSelected
                    ? "border-accent bg-accent/10 ring-2 ring-accent/50 shadow-glow-gradient"
                    : "border-border bg-surface-raised hover:border-accent/50 hover:bg-surface-soft"
                }
              `}
            >
              <ThemePreview theme={theme} />
              <div className="mt-3">
                <div className="font-medium text-text flex items-center gap-2">
                  {theme.displayName}
                  {isSelected && (
                    <span className="text-xs text-accent font-semibold">✓ Active</span>
                  )}
                </div>
                <div className="text-sm text-text-muted mt-1">
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
