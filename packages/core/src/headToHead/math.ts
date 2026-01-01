import type { Item } from "../models";

export function wilsonLowerBound(
    wins: number,
    total: number,
    z: number
): number {
    if (total <= 0) return 0;
    const p = wins / total;
    const z2 = z * z;
    const denominator = 1 + z2 / total;
    const center = p + z2 / (2 * total);
    const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
    return Math.max(0, (center - margin) / denominator);
}

export function wilsonUpperBound(
    wins: number,
    total: number,
    z: number
): number {
    if (total <= 0) return 0;
    const p = wins / total;
    const z2 = z * z;
    const denominator = 1 + z2 / total;
    const center = p + z2 / (2 * total);
    const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
    return Math.min(1, (center + margin) / denominator);
}

export function tierMapForCuts(
    ordered: readonly Item[],
    cuts: readonly number[],
    tierCount: number
): Record<string, number> {
    const map: Record<string, number> = {};
    let tierIndex = 0;
    let cursor = 0;
    ordered.forEach((item, index) => {
        while (cursor < cuts.length && index >= cuts[cursor]!) {
            tierIndex += 1;
            cursor += 1;
        }
        map[item.id] = Math.min(tierIndex + 1, tierCount);
    });
    return map;
}

export function churnFraction(
    oldMap: Record<string, number>,
    newMap: Record<string, number>,
    universe: readonly Item[]
): number {
    if (universe.length === 0) return 0;
    let moved = 0;
    for (const item of universe) {
        const oldTier = oldMap[item.id] ?? 0;
        const newTier = newMap[item.id] ?? 0;
        if (oldTier !== newTier) {
            moved += 1;
        }
    }
    return moved / universe.length;
}

export function quantileCuts(
    count: number,
    tierCount: number
): number[] {
    if (tierCount <= 1 || count <= 1) return [];
    const cuts: number[] = [];
    for (let i = 1; i < tierCount; i += 1) {
        const position = Math.round((i * count) / tierCount);
        if (position > 0 && position < count) {
            cuts.push(position);
        }
    }
    return Array.from(new Set(cuts)).sort((a, b) => a - b);
}
