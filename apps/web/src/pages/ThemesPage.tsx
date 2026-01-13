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
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--spectrum-gray-900)" }}>Themes</h1>
        <p style={{ color: "var(--spectrum-gray-700)", marginTop: 4 }}>
          Choose a color theme for your tier list
        </p>
      </div>

      {currentTheme && (
        <div
          data-testid="current-theme"
          style={{
            padding: 16,
            backgroundColor: "var(--spectrum-gray-100)",
            borderRadius: 8,
            border: "1px solid var(--spectrum-gray-300)"
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--spectrum-gray-900)", marginBottom: 12 }}>
            Current Theme
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ThemePreview theme={currentTheme} />
            <div>
              <div style={{ fontWeight: 500, color: "var(--spectrum-gray-900)" }}>{currentTheme.displayName}</div>
              <div style={{ fontSize: 14, color: "var(--spectrum-gray-700)" }}>{currentTheme.shortDescription}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16
      }}>
        {BUNDLED_THEMES.map((theme) => {
          const isSelected = theme.id === currentThemeId;
          return (
            <button
              key={theme.id}
              data-testid={`theme-card-${theme.id}`}
              onClick={() => handleSelectTheme(theme.id)}
              style={{
                padding: 16,
                borderRadius: 8,
                textAlign: "left",
                cursor: "pointer",
                transition: "transform 150ms, border-color 150ms",
                backgroundColor: isSelected ? "var(--spectrum-blue-100)" : "var(--spectrum-gray-100)",
                border: isSelected
                  ? "2px solid var(--spectrum-blue-700)"
                  : "2px solid var(--spectrum-gray-300)",
                boxShadow: isSelected ? "0 0 0 2px var(--spectrum-blue-400)" : "none"
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "var(--spectrum-blue-500)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "var(--spectrum-gray-300)";
              }}
            >
              <ThemePreview theme={theme} />
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 500, color: "var(--spectrum-gray-900)", display: "flex", alignItems: "center", gap: 8 }}>
                  {theme.displayName}
                  {isSelected && (
                    <span style={{ fontSize: 12, color: "var(--spectrum-blue-800)", fontWeight: 600 }}>✓ Active</span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: "var(--spectrum-gray-700)", marginTop: 4 }}>
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
    <div data-testid="theme-preview" style={{ display: "flex", gap: 4, height: 32 }}>
      {rankedTiers.map((tier) => (
        <div
          key={tier.id}
          style={{ flex: 1, borderRadius: 4, backgroundColor: tier.colorHex }}
          title={tier.name}
        />
      ))}
    </div>
  );
}
