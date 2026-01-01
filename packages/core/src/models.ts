// TypeScript port of TiercadeCore Models.swift
// Source of truth: TiercadeCore/Sources/TiercadeCore/Models/Models.swift

export type MediaType = "image" | "gif" | "video" | "audio";

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

