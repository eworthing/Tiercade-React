// TypeScript port of TierlistProject.swift / ProjectDataModels.swift
// See: referencedocs/ProjectDataModels.swift

export interface Audit {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

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
export type ProjectMedia = Media;

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

export interface ItemOverride {
  displayTitle?: string;
  notes?: string;
  tags?: string[];
  rating?: number;
  media?: Media[];
  hidden?: boolean;
  additional?: Record<string, JSONValue>;
}
export type ProjectItemOverride = ItemOverride;

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

export interface Member {
  userId: string;
  role: string;
  additional?: Record<string, JSONValue>;
}

export interface Collaboration {
  members?: Member[];
  additional?: Record<string, JSONValue>;
}

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

