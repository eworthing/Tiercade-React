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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-text">Analytics</h1>
        <p className="text-text-muted">
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
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text">Analytics</h1>
        <p className="text-text-muted mt-1">Insights about your tier list distribution</p>
      </div>

      {/* Balance Score */}
      <section className="p-4 bg-surface-raised rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-text mb-3">Balance Score</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-8 bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  balanceScore >= 80
                    ? "bg-success"
                    : balanceScore >= 50
                    ? "bg-warning"
                    : "bg-danger"
                }`}
                style={{ width: `${balanceScore}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold w-16 text-right text-text">{balanceScore}</div>
        </div>
        <p className="text-sm text-text-muted mt-2">
          {balanceScore >= 80
            ? "Well balanced tier distribution"
            : balanceScore >= 50
            ? "Moderately balanced"
            : "Unbalanced tier distribution"}
        </p>
      </section>

      {/* Overview Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface-raised rounded-lg border border-border hover:border-accent/50 transition-colors">
          <div className="text-3xl font-bold text-accent">
            {analytics.totalItems}
          </div>
          <div className="text-sm text-text-muted">Total Items</div>
        </div>
        <div className="p-4 bg-surface-raised rounded-lg border border-border hover:border-success/50 transition-colors">
          <div className="text-3xl font-bold text-success">
            {analytics.totalTiers}
          </div>
          <div className="text-sm text-text-muted">Total Tiers</div>
        </div>
        <div className="p-4 bg-surface-raised rounded-lg border border-border hover:border-purple-500/50 transition-colors">
          <div className="text-3xl font-bold text-purple-400">
            {analytics.averageItemsPerTier.toFixed(1)}
          </div>
          <div className="text-sm text-text-muted">Avg per Tier</div>
        </div>
        <div className="p-4 bg-surface-raised rounded-lg border border-border hover:border-warning/50 transition-colors">
          <div className="text-3xl font-bold text-warning">
            {seasonStats.totalSeasons}
          </div>
          <div className="text-sm text-text-muted">Unique Seasons</div>
        </div>
      </section>

      {/* Tier Distribution Chart */}
      <section className="p-4 bg-surface-raised rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-text mb-4">Tier Distribution</h2>
        <div className="space-y-3">
          {analytics.distribution.map((tier, index) => (
            <div
              key={tier.tierName}
              className="opacity-0 animate-stagger-fade"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-text">{tier.tierName}</span>
                <span className="text-sm text-text-muted">
                  {tier.itemCount} items ({tier.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-6 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500 ease-out"
                  style={{ width: `${tier.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Season Distribution */}
      {seasonStats.totalSeasons > 0 && (
        <section className="p-4 bg-surface-raised rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-text mb-4">Season Distribution</h2>
          <div className="space-y-2">
            {Object.entries(seasonStats.seasonDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([season, count]) => (
                <div key={season} className="flex justify-between text-text">
                  <span>Season {season}</span>
                  <span className="text-text-muted">{count} items</span>
                </div>
              ))}
          </div>
          {seasonStats.mostCommonSeason && (
            <p className="mt-4 text-sm text-text-muted">
              Most common: Season {seasonStats.mostCommonSeason}
            </p>
          )}
        </section>
      )}

      {/* Text Summary */}
      <section className="p-4 bg-surface-raised rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-text mb-4">Summary</h2>
        <pre className="text-sm text-text-muted whitespace-pre-wrap font-mono bg-surface p-4 rounded-lg">
          {summary}
        </pre>
      </section>
    </div>
  );
}
