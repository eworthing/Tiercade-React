import type { Item, Items } from "../models";

export interface HeadToHeadRecord {
    readonly wins: number;
    readonly losses: number;
    readonly total: number;
    readonly winRate: number;
}

export interface HeadToHeadMetrics {
    readonly wins: number;
    readonly comparisons: number;
    readonly winRate: number;
    readonly wilsonLB: number;
    readonly wilsonUB: number;
    readonly nameKey: string;
    readonly id: string;
}

export interface Prior {
    readonly alpha: number;
    readonly beta: number;
}

export interface RefinementCutContext {
    readonly quantCuts: readonly number[];
    readonly refinedCuts: readonly number[];
    readonly primaryCuts: readonly number[];
    readonly totalComparisons: number;
    readonly requiredComparisons: number;
    readonly churn: number;
    readonly itemCount: number;
}

export interface HeadToHeadFrontier {
    readonly index: number;
    readonly upperRange: readonly [number, number];
    readonly lowerRange: readonly [number, number];
}

export type HeadToHeadMode = "quick" | "done";

export interface HeadToHeadArtifacts {
    readonly mode: HeadToHeadMode;
    readonly tierNames: readonly string[];
    readonly rankable: readonly Item[];
    readonly undersampled: readonly Item[];
    readonly provisionalCuts: readonly number[];
    readonly frontier: readonly HeadToHeadFrontier[];
    readonly warmUpComparisons: number;
}

export interface HeadToHeadQuickResult {
    readonly tiers: Items;
    readonly artifacts: HeadToHeadArtifacts | null;
    readonly suggestedPairs: readonly [Item, Item][];
}
