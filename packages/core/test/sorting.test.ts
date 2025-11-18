import { describe, expect, it } from "@jest/globals";
import type { Item, Items } from "../src/models";
import { AttributeType, sortItems, discoverSortableAttributes } from "../src/sorting";

function makeItem(partial: Partial<Item> & { id: string }): Item {
  return {
    id: partial.id,
    name: partial.name,
    seasonString: partial.seasonString,
    seasonNumber: partial.seasonNumber,
    status: partial.status,
    description: partial.description,
    imageUrl: partial.imageUrl,
    videoUrl: partial.videoUrl
  };
}

describe("Sorting.sortItems", () => {
  it("sorts alphabetically ascending by name with locale-aware comparison", () => {
    const items: Item[] = [
      makeItem({ id: "3", name: "Zebra" }),
      makeItem({ id: "1", name: "Apple" }),
      makeItem({ id: "2", name: "banana" }),
      makeItem({ id: "4", name: "cherry" })
    ];

    const sorted = sortItems(items, { type: "alphabetical", ascending: true });
    expect(sorted.map((i) => i.name)).toEqual(["Apple", "banana", "cherry", "Zebra"]);
  });

  it("sorts alphabetically descending", () => {
    const items: Item[] = [
      makeItem({ id: "1", name: "Apple" }),
      makeItem({ id: "2", name: "Banana" }),
      makeItem({ id: "3", name: "Cherry" })
    ];

    const sorted = sortItems(items, { type: "alphabetical", ascending: false });
    expect(sorted.map((i) => i.name)).toEqual(["Cherry", "Banana", "Apple"]);
  });

  it("falls back to ID when name is missing", () => {
    const items: Item[] = [
      makeItem({ id: "z-item", name: undefined }),
      makeItem({ id: "a-item", name: "Apple" }),
      makeItem({ id: "m-item", name: undefined })
    ];

    const sorted = sortItems(items, { type: "alphabetical", ascending: true });
    expect(sorted[0].id).toBe("a-item");
    expect(sorted[1].id).toBe("m-item");
    expect(sorted[2].id).toBe("z-item");
  });

  it("sorts by numeric attribute with nils last", () => {
    const items: Item[] = [
      makeItem({ id: "3", seasonNumber: 5 }),
      makeItem({ id: "nil1", name: "No Season 1", seasonNumber: undefined }),
      makeItem({ id: "1", seasonNumber: 1 }),
      makeItem({ id: "nil2", name: "No Season 2", seasonNumber: undefined })
    ];

    const sorted = sortItems(items, {
      type: "byAttribute",
      key: "seasonNumber",
      ascending: true,
      attributeType: AttributeType.Number
    });

    expect(sorted[0].seasonNumber).toBe(1);
    expect(sorted[1].seasonNumber).toBe(5);
    expect(sorted[2].seasonNumber).toBeUndefined();
    expect(sorted[3].seasonNumber).toBeUndefined();
  });

  it("numeric sort uses stable tiebreaker by name", () => {
    const items: Item[] = [
      makeItem({ id: "second", name: "Beta", seasonNumber: 1 }),
      makeItem({ id: "first", name: "Alpha", seasonNumber: 1 }),
      makeItem({ id: "third", name: "Gamma", seasonNumber: 1 })
    ];

    const sorted = sortItems(items, {
      type: "byAttribute",
      key: "seasonNumber",
      ascending: true,
      attributeType: AttributeType.Number
    });

    expect(sorted.map((i) => i.name)).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("sorts by string attribute and handles nils last", () => {
    const items: Item[] = [
      makeItem({ id: "2", name: "Item B", status: "Active" }),
      makeItem({ id: "3", name: "Item C", status: undefined }),
      makeItem({ id: "1", name: "Item A", status: "Inactive" })
    ];

    const sorted = sortItems(items, {
      type: "byAttribute",
      key: "status",
      ascending: true,
      attributeType: AttributeType.String
    });

    expect(sorted[0].status).toBe("Active");
    expect(sorted[1].status).toBe("Inactive");
    expect(sorted[2].status).toBeUndefined();
  });

  it("custom mode preserves original order", () => {
    const items: Item[] = [
      makeItem({ id: "3" }),
      makeItem({ id: "1" }),
      makeItem({ id: "2" })
    ];

    const sorted = sortItems(items, { type: "custom" });
    expect(sorted.map((i) => i.id)).toEqual(["3", "1", "2"]);
  });

  it("sorting empty array returns empty", () => {
    const items: Item[] = [];
    const sorted = sortItems(items, { type: "alphabetical", ascending: true });
    expect(sorted).toEqual([]);
  });

  it("sorting single item returns single item", () => {
    const items: Item[] = [makeItem({ id: "1", name: "Only" })];
    const sorted = sortItems(items, { type: "alphabetical", ascending: true });
    expect(sorted.length).toBe(1);
    expect(sorted[0].id).toBe("1");
  });
});

describe("Sorting.discoverSortableAttributes", () => {
  it("discovers attributes present in ≥70% of items", () => {
    const items: Items = {
      S: [
        makeItem({ id: "1", name: "Item 1", status: "Active" }),
        makeItem({ id: "2", name: "Item 2", status: "Completed" }),
        makeItem({ id: "3", name: "Item 3", status: "Active" })
      ],
      A: [
        makeItem({ id: "4", name: "Item 4", status: "Inactive" }),
        makeItem({ id: "5", name: "Item 5" })
      ]
    };

    const discovered = discoverSortableAttributes(items);
    expect(discovered["name"]).toBe(AttributeType.String);
    expect(discovered["status"]).toBe(AttributeType.String);
  });

  it("respects 70% threshold for discovery", () => {
    const items: Items = {
      S: [
        makeItem({ id: "1", name: "Item 1", status: "Active" }),
        makeItem({ id: "2", name: "Item 2", status: "Active" }),
        makeItem({ id: "3", name: "Item 3" }),
        makeItem({ id: "4", name: "Item 4" }),
        makeItem({ id: "5", name: "Item 5" }),
        makeItem({ id: "6", name: "Item 6" }),
        makeItem({ id: "7", name: "Item 7" }),
        makeItem({ id: "8", name: "Item 8" }),
        makeItem({ id: "9", name: "Item 9" }),
        makeItem({ id: "10", name: "Item 10" })
      ]
    };

    const discovered = discoverSortableAttributes(items);
    expect(discovered["name"]).toBe(AttributeType.String);
    expect(discovered["status"]).toBeUndefined();
  });

  it("returns empty map for empty tiers", () => {
    const items: Items = {};
    const discovered = discoverSortableAttributes(items);
    expect(Object.keys(discovered)).toHaveLength(0);
  });

  it("identifies multiple attribute types", () => {
    const items: Items = {
      S: [
        makeItem({
          id: "1",
          name: "A",
          status: "Active",
          description: "First"
        }),
        makeItem({
          id: "2",
          name: "B",
          status: "Inactive",
          description: "Second"
        }),
        makeItem({
          id: "3",
          name: "C",
          status: "Pending",
          description: "Third"
        })
      ]
    };

    const discovered = discoverSortableAttributes(items);
    expect(discovered["name"]).toBe(AttributeType.String);
    expect(discovered["status"]).toBe(AttributeType.String);
    expect(discovered["description"]).toBe(AttributeType.String);
  });
});

