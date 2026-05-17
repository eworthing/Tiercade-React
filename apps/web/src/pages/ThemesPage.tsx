import React from "react";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { selectTheme, selectSelectedThemeId } from "@tiercade/state";
import { Card, CardView, Heading, Text } from "@react-spectrum/s2";
import {
  BUNDLED_THEMES,
  DEFAULT_THEME_ID,
  findThemeById,
  type TierTheme
} from "@tiercade/theme";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

const page = style({
  display: "flex",
  flexDirection: "column",
  gap: 24,
});

const header = style({
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

const themePreview = style({
  display: "flex",
  gap: 4,
  height: 32,
});

const themePreviewBlock = style({
  flexGrow: 1,
  borderRadius: "default",
});

const cardViewHeight = style({ height: 640 });

export function ThemesPage() {
  const dispatch = useAppDispatch();
  const selectedThemeId = useAppSelector(selectSelectedThemeId);
  const currentThemeId = selectedThemeId ?? DEFAULT_THEME_ID;

  const handleSelectTheme = (themeId: string) => {
    dispatch(selectTheme(themeId));
  };

  return (
    <div className={page}>
      <div className={header}>
        <Heading level={1} UNSAFE_style={{ fontFamily: "var(--font-display)" }}>Themes</Heading>
        <Text>Choose a color theme for your tier list</Text>
      </div>

      <CardView
        aria-label="Themes"
        selectionMode="single"
        selectionStyle="highlight"
        items={BUNDLED_THEMES}
        styles={cardViewHeight}
        selectedKeys={new Set([currentThemeId])}
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          const first = keys.values().next().value as string | undefined;
          if (first) handleSelectTheme(first);
        }}
      >
        {(theme) => (
          <Card id={theme.id} data-testid={`theme-card-${theme.id}`}>
            <ThemePreview theme={theme} />
            <Heading level={3}>{theme.displayName}</Heading>
            <Text>{theme.shortDescription}</Text>
          </Card>
        )}
      </CardView>
    </div>
  );
}

function ThemePreview({ theme }: { theme: TierTheme }) {
  const rankedTiers = theme.tiers.filter((t) => !t.isUnranked);

  return (
    <div data-testid="theme-preview" className={themePreview}>
      {rankedTiers.map((tier) => (
        <div
          key={tier.id}
          className={themePreviewBlock}
          style={{ backgroundColor: tier.colorHex }}
          title={tier.name}
        />
      ))}
    </div>
  );
}
