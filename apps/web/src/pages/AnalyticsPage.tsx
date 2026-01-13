import { useAppSelector } from "../hooks/useAppSelector";
import {
  analyzeTierDistribution,
  analyzeSeasonDistribution,
  generateAnalyticsSummary,
  getTierBalanceScore,
} from "@tiercade/core";

export function AnalyticsPage() {
  const tiers = useAppSelector((state) => state.tier.tiers);
  const tierOrder = useAppSelector((state) => state.tier.tierOrder);

  if (!tierOrder || tierOrder.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--spectrum-gray-900)" }}>Analytics</h1>
        <p style={{ color: "var(--spectrum-gray-700)" }}>
          No tier list loaded. Load or create a tier list to view analytics.
        </p>
      </div>
    );
  }

  const analytics = analyzeTierDistribution(tiers, tierOrder);
  const seasonStats = analyzeSeasonDistribution(tiers);
  const balanceScore = getTierBalanceScore(analytics);
  const summary = generateAnalyticsSummary(analytics);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 896 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--spectrum-gray-900)" }}>Analytics</h1>
        <p style={{ color: "var(--spectrum-gray-700)", marginTop: 4 }}>Insights about your tier list distribution</p>
      </div>

      {/* Balance Score */}
      <section style={{
        padding: 16,
        backgroundColor: "var(--spectrum-gray-100)",
        borderRadius: 8,
        border: "1px solid var(--spectrum-gray-300)"
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--spectrum-gray-900)", marginBottom: 12 }}>Balance Score</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 32, backgroundColor: "var(--spectrum-gray-200)", borderRadius: 16, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  transition: "all 500ms ease-out",
                  width: `${balanceScore}%`,
                  backgroundColor: balanceScore >= 80
                    ? "var(--spectrum-green-700)"
                    : balanceScore >= 50
                    ? "var(--spectrum-orange-700)"
                    : "var(--spectrum-red-700)"
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, width: 64, textAlign: "right", color: "var(--spectrum-gray-900)" }}>{balanceScore}</div>
        </div>
        <p style={{ fontSize: 14, color: "var(--spectrum-gray-700)", marginTop: 8 }}>
          {balanceScore >= 80
            ? "Well balanced tier distribution"
            : balanceScore >= 50
            ? "Moderately balanced"
            : "Unbalanced tier distribution"}
        </p>
      </section>

      {/* Overview Stats */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 16
      }}>
        <div style={{
          padding: 16,
          backgroundColor: "var(--spectrum-gray-100)",
          borderRadius: 8,
          border: "1px solid var(--spectrum-gray-300)"
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--spectrum-blue-800)" }}>
            {analytics.totalItems}
          </div>
          <div style={{ fontSize: 14, color: "var(--spectrum-gray-700)" }}>Total Items</div>
        </div>
        <div style={{
          padding: 16,
          backgroundColor: "var(--spectrum-gray-100)",
          borderRadius: 8,
          border: "1px solid var(--spectrum-gray-300)"
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--spectrum-green-800)" }}>
            {analytics.totalTiers}
          </div>
          <div style={{ fontSize: 14, color: "var(--spectrum-gray-700)" }}>Total Tiers</div>
        </div>
        <div style={{
          padding: 16,
          backgroundColor: "var(--spectrum-gray-100)",
          borderRadius: 8,
          border: "1px solid var(--spectrum-gray-300)"
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--spectrum-purple-800)" }}>
            {analytics.averageItemsPerTier.toFixed(1)}
          </div>
          <div style={{ fontSize: 14, color: "var(--spectrum-gray-700)" }}>Avg per Tier</div>
        </div>
        <div style={{
          padding: 16,
          backgroundColor: "var(--spectrum-gray-100)",
          borderRadius: 8,
          border: "1px solid var(--spectrum-gray-300)"
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--spectrum-orange-800)" }}>
            {seasonStats.totalSeasons}
          </div>
          <div style={{ fontSize: 14, color: "var(--spectrum-gray-700)" }}>Unique Seasons</div>
        </div>
      </section>

      {/* Tier Distribution Chart */}
      <section style={{
        padding: 16,
        backgroundColor: "var(--spectrum-gray-100)",
        borderRadius: 8,
        border: "1px solid var(--spectrum-gray-300)"
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--spectrum-gray-900)", marginBottom: 16 }}>Tier Distribution</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {analytics.distribution.map((tier) => (
            <div key={tier.tierName}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: "var(--spectrum-gray-900)" }}>{tier.tierName}</span>
                <span style={{ fontSize: 14, color: "var(--spectrum-gray-700)" }}>
                  {tier.itemCount} items ({tier.percentage.toFixed(1)}%)
                </span>
              </div>
              <div style={{ height: 24, backgroundColor: "var(--spectrum-gray-200)", borderRadius: 12, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    backgroundColor: "var(--spectrum-blue-700)",
                    transition: "all 500ms ease-out",
                    width: `${tier.percentage}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Season Distribution */}
      {seasonStats.totalSeasons > 0 && (
        <section style={{
          padding: 16,
          backgroundColor: "var(--spectrum-gray-100)",
          borderRadius: 8,
          border: "1px solid var(--spectrum-gray-300)"
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--spectrum-gray-900)", marginBottom: 16 }}>Season Distribution</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(seasonStats.seasonDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([season, count]) => (
                <div key={season} style={{ display: "flex", justifyContent: "space-between", color: "var(--spectrum-gray-900)" }}>
                  <span>Season {season}</span>
                  <span style={{ color: "var(--spectrum-gray-700)" }}>{count} items</span>
                </div>
              ))}
          </div>
          {seasonStats.mostCommonSeason && (
            <p style={{ marginTop: 16, fontSize: 14, color: "var(--spectrum-gray-700)" }}>
              Most common: Season {seasonStats.mostCommonSeason}
            </p>
          )}
        </section>
      )}

      {/* Text Summary */}
      <section style={{
        padding: 16,
        backgroundColor: "var(--spectrum-gray-100)",
        borderRadius: 8,
        border: "1px solid var(--spectrum-gray-300)"
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--spectrum-gray-900)", marginBottom: 16 }}>Summary</h2>
        <pre style={{
          fontSize: 14,
          color: "var(--spectrum-gray-700)",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          backgroundColor: "var(--spectrum-gray-200)",
          padding: 16,
          borderRadius: 8
        }}>
          {summary}
        </pre>
      </section>
    </div>
  );
}
