import { describe, expect, it } from "@jest/globals";
import type { Item, Items } from "../src/models";
import {
  filterAllTiers,
  filterItems,
  hasActiveFilters,
  itemMatchesFilters,
  type ItemFilters,
} from "../src/filtering";

function makeItem(partial: Partial<Item> & { id: string }): Item {
  return {
    id: partial.id,
    name: partial.name,
    description: partial.description,
    status: partial.status,
    media: partial.media,
  };
}

// ---------------------------------------------------------------------------
// hasActiveFilters
// ---------------------------------------------------------------------------

describe("hasActiveFilters", () => {
  it("returns false when filters object is empty", () => {
    expect(hasActiveFilters({})).toBe(false);
  });

  it("returns false when searchText is empty string", () => {
    expect(hasActiveFilters({ searchText: "" })).toBe(false);
  });

  it("returns false when searchText is whitespace only", () => {
    expect(hasActiveFilters({ searchText: "   " })).toBe(false);
  });

  it("returns true when searchText is non-empty", () => {
    expect(hasActiveFilters({ searchText: "dragon" })).toBe(true);
  });

  it("returns true when mediaTypes is non-empty", () => {
    expect(hasActiveFilters({ mediaTypes: ["image"] })).toBe(true);
  });

  it("returns true when hasMedia is set", () => {
    expect(hasActiveFilters({ hasMedia: true })).toBe(true);
  });

  it("returns true when noMedia is set", () => {
    expect(hasActiveFilters({ noMedia: true })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// itemMatchesFilters — searchText
// ---------------------------------------------------------------------------

describe("itemMatchesFilters — searchText", () => {
  it("matches item by name (case-insensitive)", () => {
    const item = makeItem({ id: "1", name: "Dragon Ball" });
    expect(itemMatchesFilters(item, { searchText: "dragon ball" })).toBe(true);
    expect(itemMatchesFilters(item, { searchText: "DRAGON" })).toBe(true);
  });

  it("matches item by description", () => {
    const item = makeItem({ id: "2", name: "Item", description: "Legendary artifact" });
    expect(itemMatchesFilters(item, { searchText: "legendary" })).toBe(true);
  });

  it("does not match item whose name and description miss the search term", () => {
    const item = makeItem({ id: "3", name: "Mundane Rock" });
    expect(itemMatchesFilters(item, { searchText: "dragon" })).toBe(false);
  });

  it("matches item by id when name is missing", () => {
    const item = makeItem({ id: "legendary-sword" });
    expect(itemMatchesFilters(item, { searchText: "legendary" })).toBe(true);
  });

  it("returns true when no filters active (empty filters)", () => {
    const item = makeItem({ id: "1", name: "Anything" });
    expect(itemMatchesFilters(item, {})).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// itemMatchesFilters — hasMedia / noMedia
// ---------------------------------------------------------------------------

describe("itemMatchesFilters — hasMedia / noMedia", () => {
  const withImage = makeItem({ id: "a", media: { type: "image", url: "img.png" } });
  const withVideo = makeItem({ id: "b", media: { type: "video", url: "vid.mp4" } });
  const noMedia = makeItem({ id: "c" });

  it("hasMedia filter passes items with media", () => {
    expect(itemMatchesFilters(withImage, { hasMedia: true })).toBe(true);
  });

  it("hasMedia filter rejects items with no media", () => {
    expect(itemMatchesFilters(noMedia, { hasMedia: true })).toBe(false);
  });

  it("noMedia filter passes items with no media", () => {
    expect(itemMatchesFilters(noMedia, { noMedia: true })).toBe(true);
  });

  it("noMedia filter rejects items with video media", () => {
    expect(itemMatchesFilters(withVideo, { noMedia: true })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// filterItems
// ---------------------------------------------------------------------------

describe("filterItems", () => {
  it("returns original array unchanged when no active filters", () => {
    const items = [makeItem({ id: "1", name: "Alpha" }), makeItem({ id: "2", name: "Beta" })];
    const result = filterItems(items, {});
    expect(result).toBe(items); // referential identity: no copy when unfiltered
  });

  it("filters down to matching items", () => {
    const items = [
      makeItem({ id: "1", name: "Dragon" }),
      makeItem({ id: "2", name: "Phoenix" }),
      makeItem({ id: "3", name: "Dragon Slayer" }),
    ];
    const result = filterItems(items, { searchText: "dragon" });
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("returns empty array when nothing matches", () => {
    const items = [makeItem({ id: "1", name: "Alpha" })];
    const result = filterItems(items, { searchText: "zzz" });
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// filterAllTiers — the primary exported Interface (F-008 target)
// ---------------------------------------------------------------------------

describe("filterAllTiers", () => {
  it("returns original tiers object unchanged when no active filters", () => {
    const tiers: Items = {
      S: [makeItem({ id: "1", name: "Dragon" })],
      A: [makeItem({ id: "2", name: "Phoenix" })],
      unranked: [],
    };
    const result = filterAllTiers(tiers, {});
    expect(result).toBe(tiers); // referential identity: passthrough when unfiltered
  });

  it("filters matching items across multiple tiers, preserving tier structure", () => {
    const tiers: Items = {
      S: [
        makeItem({ id: "1", name: "Dragon" }),
        makeItem({ id: "2", name: "Phoenix" }),
      ],
      A: [
        makeItem({ id: "3", name: "Dragon Slayer" }),
        makeItem({ id: "4", name: "Knight" }),
      ],
      unranked: [makeItem({ id: "5", name: "Goblin" })],
    };

    const result = filterAllTiers(tiers, { searchText: "dragon" });

    // All tier keys preserved, only matching items retained
    expect(Object.keys(result)).toEqual(["S", "A", "unranked"]);
    expect(result.S).toHaveLength(1);
    expect(result.S[0].id).toBe("1");
    expect(result.A).toHaveLength(1);
    expect(result.A[0].id).toBe("3");
    expect(result.unranked).toHaveLength(0);
  });

  it("returns empty arrays for all tiers when no item matches", () => {
    const tiers: Items = {
      S: [makeItem({ id: "1", name: "Alpha" })],
      A: [makeItem({ id: "2", name: "Beta" })],
    };

    const result = filterAllTiers(tiers, { searchText: "zzz" });

    expect(result.S).toHaveLength(0);
    expect(result.A).toHaveLength(0);
  });

  it("handles empty tiers object without error", () => {
    const result = filterAllTiers({}, { searchText: "dragon" });
    expect(result).toEqual({});
  });

  it("handles single-item tier with matching item", () => {
    const tiers: Items = {
      S: [makeItem({ id: "1", name: "Only Item" })],
    };
    const result = filterAllTiers(tiers, { searchText: "only" });
    expect(result.S).toHaveLength(1);
  });

  it("filters by hasMedia across tiers — media items kept, non-media removed", () => {
    const tiers: Items = {
      S: [
        makeItem({ id: "1", name: "With Image", media: { type: "image", url: "img.png" } }),
        makeItem({ id: "2", name: "No Media" }),
      ],
      A: [makeItem({ id: "3", name: "With Video", media: { type: "video", url: "vid.mp4" } })],
    };

    const result = filterAllTiers(tiers, { hasMedia: true });

    expect(result.S).toHaveLength(1);
    expect(result.S[0].id).toBe("1");
    expect(result.A).toHaveLength(1);
    expect(result.A[0].id).toBe("3");
  });
});
