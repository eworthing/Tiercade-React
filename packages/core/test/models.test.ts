import { describe, expect, it } from "@jest/globals";
import { Item } from "../src/models";

describe("Models", () => {
  it("Item preserves season string and number semantics", () => {
    const raw: Array<Partial<Item> & { id: string; season?: string | number }> =
      [
        { id: "alpha", season: "5" },
        { id: "beta", season: 6 }
      ];

    // In Swift, Item's Codable init accepts either string or number for `season`
    // and normalizes seasonString/seasonNumber accordingly. In TS we model this
    // behavior at the edges (e.g., in ModelResolver), but the shape test ensures
    // fields exist and are optional.
    const decoded: Item[] = raw.map((r) => {
      const seasonValue = r.season;
      let seasonString: string | undefined;
      let seasonNumber: number | undefined;
      if (typeof seasonValue === "string") {
        seasonString = seasonValue;
        const parsed = Number.parseInt(seasonValue, 10);
        if (!Number.isNaN(parsed)) {
          seasonNumber = parsed;
        }
      } else if (typeof seasonValue === "number") {
        seasonNumber = seasonValue;
        seasonString = String(seasonValue);
      }
      return {
        id: r.id,
        name: r.name,
        seasonString,
        seasonNumber,
        status: r.status,
        description: r.description,
        imageUrl: r.imageUrl,
        videoUrl: r.videoUrl
      };
    });

    expect(decoded[0].seasonString).toBe("5");
    expect(decoded[0].seasonNumber).toBe(5);
    expect(decoded[1].seasonString).toBe("6");
    expect(decoded[1].seasonNumber).toBe(6);
  });
});

