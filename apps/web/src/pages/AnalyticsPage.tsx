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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Analytics</h1>
        <p className="text-gray-400">
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
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {/* Balance Score */}
      <section className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-3">Balance Score</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-8 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  balanceScore >= 80
                    ? "bg-green-500"
                    : balanceScore >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${balanceScore}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold w-16 text-right">{balanceScore}</div>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {balanceScore >= 80
            ? "Well balanced tier distribution"
            : balanceScore >= 50
            ? "Moderately balanced"
            : "Unbalanced tier distribution"}
        </p>
      </section>

      {/* Overview Stats */}
      <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-blue-400">
            {analytics.totalItems}
          </div>
          <div className="text-sm text-gray-400">Total Items</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-green-400">
            {analytics.totalTiers}
          </div>
          <div className="text-sm text-gray-400">Total Tiers</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-purple-400">
            {analytics.averageItemsPerTier.toFixed(1)}
          </div>
          <div className="text-sm text-gray-400">Avg per Tier</div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-yellow-400">
            {seasonStats.totalSeasons}
          </div>
          <div className="text-sm text-gray-400">Unique Seasons</div>
        </div>
      </section>

      {/* Tier Distribution Chart */}
      <section className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Tier Distribution</h2>
        <div className="space-y-3">
          {analytics.distribution.map((tier) => (
            <div key={tier.tierName}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{tier.tierName}</span>
                <span className="text-sm text-gray-400">
                  {tier.itemCount} items ({tier.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${tier.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Season Distribution */}
      {seasonStats.totalSeasons > 0 && (
        <section className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Season Distribution</h2>
          <div className="space-y-2">
            {Object.entries(seasonStats.seasonDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([season, count]) => (
                <div key={season} className="flex justify-between">
                  <span>Season {season}</span>
                  <span className="text-gray-400">{count} items</span>
                </div>
              ))}
          </div>
          {seasonStats.mostCommonSeason && (
            <p className="mt-4 text-sm text-gray-400">
              Most common: Season {seasonStats.mostCommonSeason}
            </p>
          )}
        </section>
      )}

      {/* Text Summary */}
      <section className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
          {summary}
        </pre>
      </section>
    </div>
  );
}
