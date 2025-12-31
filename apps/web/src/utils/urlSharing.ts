import type { Items, Item } from "@tiercade/core";

interface ShareableData {
  v: number; // Version for future compatibility
  n: string; // Project name
  o: string[]; // Tier order
  l: Record<string, string>; // Tier labels
  c: Record<string, string>; // Tier colors
  t: Record<string, CompactItem[]>; // Tiers with items
}

interface CompactItem {
  i: string; // id
  n?: string; // name
  s?: string; // seasonString
  u?: string; // imageUrl
}

/**
 * Encode tier list data for URL sharing
 * Uses base64 encoding of compressed JSON
 */
export function encodeShareUrl(
  projectName: string,
  tierOrder: string[],
  tierLabels: Record<string, string>,
  tierColors: Record<string, string>,
  tiers: Items
): string {
  const shareData: ShareableData = {
    v: 1,
    n: projectName,
    o: tierOrder,
    l: tierLabels,
    c: tierColors,
    t: Object.fromEntries(
      Object.entries(tiers).map(([tierId, items]) => [
        tierId,
        items.map((item) => {
          const compact: CompactItem = { i: item.id };
          if (item.name) compact.n = item.name;
          if (item.seasonString) compact.s = item.seasonString;
          if (item.imageUrl) compact.u = item.imageUrl;
          return compact;
        }),
      ])
    ),
  };

  const json = JSON.stringify(shareData);
  // Use base64 encoding for URL safety
  const encoded = btoa(encodeURIComponent(json));
  return encoded;
}

/**
 * Decode tier list data from URL
 */
export function decodeShareUrl(encoded: string): {
  projectName: string;
  tierOrder: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string>;
  tiers: Items;
} | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const data = JSON.parse(json) as ShareableData;

    // Validate version
    if (data.v !== 1) {
      console.warn("Unsupported share URL version:", data.v);
      return null;
    }

    // Reconstruct tiers
    const tiers: Items = {};
    for (const [tierId, compactItems] of Object.entries(data.t)) {
      tiers[tierId] = compactItems.map((c) => {
        const item: Item = {
          id: c.i,
          name: c.n,
          seasonString: c.s,
          imageUrl: c.u,
        };
        return item;
      });
    }

    return {
      projectName: data.n,
      tierOrder: data.o,
      tierLabels: data.l,
      tierColors: data.c,
      tiers,
    };
  } catch (error) {
    console.error("Failed to decode share URL:", error);
    return null;
  }
}

/**
 * Generate a full shareable URL
 */
export function generateShareUrl(
  projectName: string,
  tierOrder: string[],
  tierLabels: Record<string, string>,
  tierColors: Record<string, string>,
  tiers: Items
): string {
  const encoded = encodeShareUrl(
    projectName,
    tierOrder,
    tierLabels,
    tierColors,
    tiers
  );
  const url = new URL(window.location.href);
  url.searchParams.set("share", encoded);
  // Remove any hash
  url.hash = "";
  return url.toString();
}

/**
 * Check if current URL has share data
 */
export function getShareDataFromUrl(): ReturnType<typeof decodeShareUrl> {
  const url = new URL(window.location.href);
  const shareData = url.searchParams.get("share");
  if (!shareData) return null;
  return decodeShareUrl(shareData);
}

/**
 * Clear share data from URL without page reload
 */
export function clearShareDataFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("share");
  window.history.replaceState({}, "", url.toString());
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}
