// TypeScript port of TiercadeCore Models.swift
// Source of truth: TiercadeCore/Sources/TiercadeCore/Models/Models.swift

export type MediaType = "image" | "gif" | "video" | "audio";

/**
 * Discriminated union for item media. Exactly one URL per media entry.
 * Eliminates the impossible state where imageUrl, videoUrl, and audioUrl
 * could all be set simultaneously with a conflicting mediaType.
 */
export type ItemMedia =
  | { type: "image"; url: string }
  | { type: "gif"; url: string }
  | { type: "video"; url: string }
  | { type: "audio"; url: string };

export interface Item {
  id: string;
  name?: string;
  seasonString?: string;
  seasonNumber?: number;
  status?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  mediaType?: MediaType;
}

/**
 * Options for createItem smart constructor.
 * `media` encodes the discriminated union — only one URL field is set.
 */
export interface ItemCreateOptions {
  name?: string;
  seasonString?: string;
  seasonNumber?: number;
  status?: string;
  description?: string;
  media?: ItemMedia;
}

/**
 * Smart constructor for Item. Enforces media invariant at construction:
 * exactly one URL field (imageUrl / videoUrl / audioUrl) is set, matching
 * the mediaType. Callers that use createItem never need to manually clear
 * the other URL fields.
 *
 * Returns a plain Item — compatible with all existing consumers.
 */
export function createItem(id: string, options: ItemCreateOptions = {}): Item {
  const item: Item = { id };

  if (options.name !== undefined) item.name = options.name;
  if (options.seasonString !== undefined) item.seasonString = options.seasonString;
  if (options.seasonNumber !== undefined) item.seasonNumber = options.seasonNumber;
  if (options.status !== undefined) item.status = options.status;
  if (options.description !== undefined) item.description = options.description;

  if (options.media) {
    item.mediaType = options.media.type;
    switch (options.media.type) {
      case "image":
      case "gif":
        item.imageUrl = options.media.url;
        break;
      case "video":
        item.videoUrl = options.media.url;
        break;
      case "audio":
        item.audioUrl = options.media.url;
        break;
    }
  }

  return item;
}

export interface TierConfigEntry {
  name: string;
  colorHex?: string;
  description?: string;
}

/**
 * Collection of items organized by tier name.
 *
 * Structure: Record<tierName, Item[]>
 *
 * Invariants (enforced by logic helpers):
 * - All tier names in tierOrder must have entries (even if empty [])
 * - "unranked" tier is reserved and must always exist
 * - "unranked" must never appear in tierOrder
 * - Each Item.id should be unique across all tiers
 */
export type Items = Record<string, Item[]>;

export type TierConfig = Record<string, TierConfigEntry>;

export enum AttributeType {
  String = "string",
  Number = "number",
  Bool = "bool",
  Date = "date"
}

export type GlobalSortMode =
  | { type: "custom" }
  | { type: "alphabetical"; ascending: boolean }
  | {
      type: "byAttribute";
      key: string;
      ascending: boolean;
      attributeType: AttributeType;
    };
