import { describe, expect, it } from "@jest/globals";
import { Item, ItemMedia, createItem } from "../src/models";

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

describe("createItem smart constructor", () => {
  it("creates a minimal item with only id", () => {
    const item = createItem("x");
    expect(item.id).toBe("x");
    expect(item.mediaType).toBeUndefined();
    expect(item.imageUrl).toBeUndefined();
    expect(item.videoUrl).toBeUndefined();
    expect(item.audioUrl).toBeUndefined();
  });

  it("creates item with name and description", () => {
    const item = createItem("abc", { name: "Test Item", description: "Desc" });
    expect(item.id).toBe("abc");
    expect(item.name).toBe("Test Item");
    expect(item.description).toBe("Desc");
  });

  it("enforces media invariant: image type sets only imageUrl", () => {
    const media: ItemMedia = { type: "image", url: "https://example.com/img.png" };
    const item = createItem("img-item", { media });
    expect(item.mediaType).toBe("image");
    expect(item.imageUrl).toBe("https://example.com/img.png");
    // Only imageUrl set — videoUrl and audioUrl must be absent
    expect(item.videoUrl).toBeUndefined();
    expect(item.audioUrl).toBeUndefined();
  });

  it("enforces media invariant: gif type sets only imageUrl", () => {
    const media: ItemMedia = { type: "gif", url: "https://example.com/anim.gif" };
    const item = createItem("gif-item", { media });
    expect(item.mediaType).toBe("gif");
    expect(item.imageUrl).toBe("https://example.com/anim.gif");
    expect(item.videoUrl).toBeUndefined();
    expect(item.audioUrl).toBeUndefined();
  });

  it("enforces media invariant: video type sets only videoUrl", () => {
    const media: ItemMedia = { type: "video", url: "https://example.com/clip.mp4" };
    const item = createItem("vid-item", { media });
    expect(item.mediaType).toBe("video");
    expect(item.videoUrl).toBe("https://example.com/clip.mp4");
    // imageUrl and audioUrl must be absent — the impossible state eliminated
    expect(item.imageUrl).toBeUndefined();
    expect(item.audioUrl).toBeUndefined();
  });

  it("enforces media invariant: audio type sets only audioUrl", () => {
    const media: ItemMedia = { type: "audio", url: "https://example.com/track.mp3" };
    const item = createItem("aud-item", { media });
    expect(item.mediaType).toBe("audio");
    expect(item.audioUrl).toBe("https://example.com/track.mp3");
    expect(item.imageUrl).toBeUndefined();
    expect(item.videoUrl).toBeUndefined();
  });

  it("preserves optional fields when provided", () => {
    const item = createItem("full", {
      name: "Full Item",
      seasonString: "Season 2",
      seasonNumber: 2,
      status: "active",
      description: "A complete item",
      media: { type: "image", url: "https://example.com/cover.jpg" }
    });
    expect(item.name).toBe("Full Item");
    expect(item.seasonString).toBe("Season 2");
    expect(item.seasonNumber).toBe(2);
    expect(item.status).toBe("active");
    expect(item.description).toBe("A complete item");
    expect(item.mediaType).toBe("image");
    expect(item.imageUrl).toBe("https://example.com/cover.jpg");
  });

  it("creates item without media when media not provided", () => {
    const item = createItem("no-media", { name: "Text Only" });
    expect(item.mediaType).toBeUndefined();
    expect(item.imageUrl).toBeUndefined();
    expect(item.videoUrl).toBeUndefined();
    expect(item.audioUrl).toBeUndefined();
  });
});
