// TypeScript port of TiercadeCore models
// Source: TiercadeCore/Sources/TiercadeCore/Models/Models.swift

export interface Item {
  id: string;
  name?: string;
  seasonString?: string;
  seasonNumber?: number;
  status?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface TierConfigEntry {
  name: string;
  colorHex?: string;
  description?: string;
}

/**
 * Collection of items organized by tier name.
 * Structure: Record<tierName, Item[]>
 *
 * Invariants (must be enforced in logic):
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
  | { type: "byAttribute"; key: string; ascending: boolean; attributeType: AttributeType };

// Full Project schema (matches TierlistProject.swift)
export interface Project {
  schemaVersion: number;
  projectId: string;
  title?: string;
  description?: string;
  tiers: ProjectTier[];
  items: Record<string, ProjectItem>;
  overrides?: Record<string, ItemOverride>;
  links?: ProjectLinks;
  storage?: ProjectStorage;
  settings?: ProjectSettings;
  collab?: Collaboration;
  audit: Audit;
  additional?: Record<string, JSONValue>;
}

export interface ProjectTier {
  id: string;
  label: string;
  color?: string;
  order: number;
  locked?: boolean;
  collapsed?: boolean;
  rules?: Record<string, JSONValue>;
  itemIds: string[];
  additional?: Record<string, JSONValue>;
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  slug?: string;
  media?: Media[];
  attributes?: Record<string, JSONValue>;
  tags?: string[];
  rating?: number;
  sources?: Array<Record<string, string>>;
  locale?: Record<string, Record<string, string>>;
  meta?: Audit;
  additional?: Record<string, JSONValue>;
}

export interface Media {
  id: string;
  kind: "image" | "gif" | "video" | "audio";
  uri: string;
  mime: string;
  w?: number;
  h?: number;
  durationMs?: number;
  posterUri?: string;
  thumbUri?: string;
  alt?: string;
  attribution?: Record<string, string>;
  additional?: Record<string, JSONValue>;
}

export interface ItemOverride {
  displayTitle?: string;
  notes?: string;
  tags?: string[];
  rating?: number;
  media?: Media[];
  hidden?: boolean;
  additional?: Record<string, JSONValue>;
}

export interface Audit {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface ProjectLinks {
  visibility?: string;
  shareUrl?: string;
  embedHtml?: string;
  stateUrl?: string;
  additional?: Record<string, JSONValue>;
}

export interface ProjectStorage {
  mode?: string;
  remote?: Record<string, JSONValue>;
  additional?: Record<string, JSONValue>;
}

export interface ProjectSettings {
  theme?: string;
  tierSortOrder?: string;
  gridSnap?: boolean;
  showUnranked?: boolean;
  accessibility?: Record<string, boolean>;
  additional?: Record<string, JSONValue>;
}

export interface Collaboration {
  members?: Member[];
  additional?: Record<string, JSONValue>;
}

export interface Member {
  userId: string;
  role: string;
  additional?: Record<string, JSONValue>;
}

// JSONValue for extensibility (matches Swift's JSONValue enum)
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// HeadToHead types
export interface HeadToHeadRecord {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface HeadToHeadArtifacts {
  mode: "quick" | "refine" | "done";
  rankable: Item[];
  undersampled: Item[];
  frontier: Item[];
  operativeNames: string[];
  cuts: number[];
  metrics: Record<string, number>;
}

export interface HeadToHeadQuickResult {
  tiers: Items;
  artifacts: HeadToHeadArtifacts | null;
  suggestedPairs: [Item, Item][];
}
