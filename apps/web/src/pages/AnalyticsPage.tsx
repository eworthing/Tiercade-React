import { useAppSelector } from "../hooks/useAppSelector";
import { selectTiers, selectTierOrder } from "@tiercade/state";
import {
  analyzeTierDistribution,
  analyzeSeasonDistribution,
  generateAnalyticsSummary,
  getTierBalanceScore,
} from "@tiercade/core";
import { Heading, ProgressBar, Text } from "@react-spectrum/s2";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

const page = style({
  display: "flex",
  flexDirection: "column",
  gap: 32,
  maxWidth: 896,
});

const pageHeader = style({
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

const section = style({
  padding: 16,
  borderRadius: "lg",
  backgroundColor: "gray-100",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "gray-300",
  display: "flex",
  flexDirection: "column",
  gap: 12,
});

const statGrid = style({
  display: "grid",
  gap: 16,
});

const statCard = style({
  padding: 16,
  borderRadius: "lg",
  backgroundColor: "gray-100",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "gray-300",
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

const summaryBox = style({
  padding: 16,
  borderRadius: "lg",
  backgroundColor: "gray-200",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "gray-300",
});

export function AnalyticsPage() {
  const tiers = useAppSelector(selectTiers);
  const tierOrder = useAppSelector(selectTierOrder);

  if (!tierOrder || tierOrder.length === 0) {
    return (
      <div className={page}>
        <div className={pageHeader}>
          <Heading level={1} UNSAFE_style={{ fontFamily: "var(--font-display)" }}>Analytics</Heading>
          <Text>No tier list loaded. Load or create a tier list to view analytics.</Text>
        </div>
      </div>
    );
  }

  const analytics = analyzeTierDistribution(tiers, tierOrder);
  const seasonStats = analyzeSeasonDistribution(tiers);
  const balanceScore = getTierBalanceScore(analytics);
  const summary = generateAnalyticsSummary(analytics);

  return (
    <div className={page}>
      <div className={pageHeader}>
        <Heading level={1} UNSAFE_style={{ fontFamily: "var(--font-display)" }}>Analytics</Heading>
        <Text>Insights about your tier list distribution</Text>
      </div>

      {/* Balance Score */}
      <section className={section}>
        <Heading level={2}>Balance Score</Heading>
        <ProgressBar label="Balance score" value={balanceScore} />
        <Text>
          {balanceScore >= 80
            ? "Well balanced tier distribution"
            : balanceScore >= 50
            ? "Moderately balanced"
            : "Unbalanced tier distribution"}
        </Text>
      </section>

      {/* Overview Stats */}
      <section
        className={statGrid}
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
      >
        <div className={statCard}>
          <Heading level={3} UNSAFE_style={{ fontVariantNumeric: "tabular-nums" }}>{analytics.totalItems}</Heading>
          <Text>Total Items</Text>
        </div>
        <div className={statCard}>
          <Heading level={3} UNSAFE_style={{ fontVariantNumeric: "tabular-nums" }}>{analytics.totalTiers}</Heading>
          <Text>Total Tiers</Text>
        </div>
        <div className={statCard}>
          <Heading level={3} UNSAFE_style={{ fontVariantNumeric: "tabular-nums" }}>{analytics.averageItemsPerTier.toFixed(1)}</Heading>
          <Text>Avg per Tier</Text>
        </div>
        <div className={statCard}>
          <Heading level={3} UNSAFE_style={{ fontVariantNumeric: "tabular-nums" }}>{seasonStats.totalSeasons}</Heading>
          <Text>Unique Seasons</Text>
        </div>
      </section>

      {/* Tier Distribution Chart */}
      <section className={section}>
        <Heading level={2}>Tier Distribution</Heading>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {analytics.distribution.map((tier) => (
            <ProgressBar
              key={tier.tierName}
              label={`${tier.tierName} — ${tier.itemCount} (${tier.percentage.toFixed(1)}%)`}
              value={tier.percentage}
            />
          ))}
        </div>
      </section>

      {/* Season Distribution */}
      {seasonStats.totalSeasons > 0 && (
        <section className={section}>
          <Heading level={2}>Season Distribution</Heading>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(seasonStats.seasonDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([season, count]) => (
                <div key={season} style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text>{`Season ${season}`}</Text>
                  <Text>{`${count} items`}</Text>
                </div>
              ))}
          </div>
          {seasonStats.mostCommonSeason && (
            <Text>{`Most common: Season ${seasonStats.mostCommonSeason}`}</Text>
          )}
        </section>
      )}

      {/* Text Summary */}
      <section className={section}>
        <Heading level={2}>Summary</Heading>
        <pre className={summaryBox} style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 14 }}>
          {summary}
        </pre>
      </section>
    </div>
  );
}
