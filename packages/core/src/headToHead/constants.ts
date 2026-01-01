export const UNRANKED_TIER_ID = "unranked";

// Tunable constants (port of HeadToHeadLogic.Tun)
export const Tun = {
    maximumTierCount: 20,
    minimumComparisonsPerItem: 2,
    frontierWidth: 2,
    zQuick: 1.0,
    zStd: 1.28,
    zRefineEarly: 1.0,
    softOverlapEps: 0.01,
    confBonusBeta: 0.1,
    maxSuggestedPairs: 6,
    hysteresisMaxChurnSoft: 0.12,
    hysteresisMaxChurnHard: 0.25,
    hysteresisRampBoost: 0.5,
    minWilsonRangeForSplit: 0.015,
    epsTieTop: 0.012,
    epsTieBottom: 0.01,
    maxBottomTieWidth: 4,
    ubBottomCeil: 0.2
} as const;
