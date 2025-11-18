/**
 * Model resolution utilities matching TiercadeCore/Models/ModelResolver.swift
 * Loads tier list project JSON and resolves items (with overrides)
 */

import { Project, ProjectItem, ProjectItemOverride, ProjectMedia } from "./project";
import { Item, Items } from "./models";

export class ModelResolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelResolverError";
  }
}

export class FileTooLargeError extends ModelResolverError {
  constructor(size: number, limit: number) {
    const sizeMB = (size / 1_000_000).toFixed(1);
    const limitMB = (limit / 1_000_000).toFixed(1);
    super(
      `Project file is too large (${sizeMB}MB). Maximum allowed size is ${limitMB}MB.`
    );
  }
}

export interface ResolvedItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbUri?: string;
  attributes?: Record<string, string>;
}

export interface ResolvedTier {
  id: string;
  label: string;
  items: ResolvedItem[];
}

/** Resolved tier state ready for use in the app */
export interface ResolvedTierState {
  order: string[];
  items: Items;
  labels: Record<string, string>;
  colors: Record<string, string | undefined>;
  locked: Set<string>;
}

export class ModelResolver {
  /** Maximum allowed JSON file size (50MB) to prevent DoS attacks from malicious/corrupted files */
  static readonly MAX_FILE_SIZE_BYTES = 50_000_000;

  /**
   * Decode a Project from JSON data.
   * Validates size and schema.
   */
  static decodeProject(data: string | ArrayBuffer): Project {
    let jsonString: string;

    if (typeof data === "string") {
      jsonString = data;
    } else {
      const byteLength = data.byteLength;
      if (byteLength > this.MAX_FILE_SIZE_BYTES) {
        throw new FileTooLargeError(byteLength, this.MAX_FILE_SIZE_BYTES);
      }
      const decoder = new TextDecoder("utf-8");
      jsonString = decoder.decode(data);
    }

    // Validate size after conversion to string
    const sizeBytes = new Blob([jsonString]).size;
    if (sizeBytes > this.MAX_FILE_SIZE_BYTES) {
      throw new FileTooLargeError(sizeBytes, this.MAX_FILE_SIZE_BYTES);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch (error) {
      throw new ModelResolverError(
        `JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Basic schema validation (in production, use a schema validator like Zod)
    if (!this.isValidProject(parsed)) {
      throw new ModelResolverError("Invalid project schema");
    }

    const project = parsed as Project;

    // Validate offline V1 schema (basic checks)
    this.validateOfflineV1(project);

    return project;
  }

  /**
   * Resolve tiers from a project, applying overrides.
   * Returns an array of ResolvedTier objects.
   */
  static resolveTiers(project: Project): ResolvedTier[] {
    const overrides = project.overrides ?? {};

    return project.tiers.map((tier) => {
      const items = tier.itemIds.map((itemId) => {
        const item = project.items[itemId];
        if (!item) {
          // Skip missing items
          return null;
        }
        const override = overrides[itemId];
        return this.makeResolvedItem(itemId, item, override);
      }).filter((item): item is ResolvedItem => item !== null);

      return {
        id: tier.id,
        label: tier.label,
        items,
      };
    });
  }

  /**
   * Convert a Project into the app's tier state (Items + metadata).
   * Matches Swift's AppState.resolvedTierState(from:)
   */
  static resolvedTierState(project: Project): ResolvedTierState {
    const resolvedTiers = this.resolveTiers(project);

    const items: Items = {};
    const labels: Record<string, string> = {};
    const colors: Record<string, string | undefined> = {};
    const locked: Set<string> = new Set();

    // Build tier metadata
    for (const tier of project.tiers) {
      labels[tier.id] = tier.label;
      if (tier.color) {
        colors[tier.id] = tier.color;
      }
      if (tier.locked) {
        locked.add(tier.id);
      }
    }

    // Convert resolved items to core Item model
    for (const tier of resolvedTiers) {
      items[tier.id] = tier.items.map((resolved) => this.resolvedItemToItem(resolved));
    }

    // Build tier order from project tiers, sorted by order field
    const order = project.tiers
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((tier) => tier.id)
      .filter((id) => id !== "unranked"); // unranked is managed separately

    return {
      order,
      items,
      labels,
      colors,
      locked,
    };
  }

  /**
   * Parse CSV content and return Items + discovered tier names.
   * Matches Swift's AppState.parseCSVInBackground
   */
  static parseCSV(
    csvString: string,
    currentTierOrder: string[]
  ): { items: Items; discoveredTiers: string[] } {
    const lines = csvString.split(/\r?\n/);

    if (lines.length <= 1) {
      throw new ModelResolverError("CSV file appears to be empty");
    }

    // Initialize tiers from current order
    const newTiers: Items = { unranked: [] };
    for (const tier of currentTierOrder) {
      newTiers[tier] = [];
    }

    const seenIDs = new Set<string>();
    const counters: Record<string, number> = {};
    const discoveredTiers = new Set<string>();

    function uniqueID(base: string): string {
      let id = base;
      while (seenIDs.has(id)) {
        const next = (counters[base] ?? 1) + 1;
        counters[base] = next;
        id = `${base}_${next}`;
      }
      seenIDs.add(id);
      return id;
    }

    // Skip header row
    for (const line of lines.slice(1)) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const components = this.parseCSVLine(line);
      if (components.length < 3) continue;

      const item = this.createItemFromCSVComponents(components);
      if (!item) continue;

      // Ensure unique ID
      const uniqueId = uniqueID(item.id);
      const adjusted: Item = {
        ...item,
        id: uniqueId,
      };

      const tierName = components[2];
      this.addItemToTier(adjusted, tierName, newTiers, discoveredTiers);
    }

    return {
      items: newTiers,
      discoveredTiers: Array.from(discoveredTiers).sort(),
    };
  }

  // --- Private helpers ---

  private static isValidProject(obj: unknown): obj is Project {
    if (typeof obj !== "object" || obj === null) return false;
    const p = obj as Partial<Project>;
    return (
      typeof p.schemaVersion === "number" &&
      typeof p.projectId === "string" &&
      Array.isArray(p.tiers) &&
      typeof p.items === "object" &&
      p.items !== null
    );
  }

  private static validateOfflineV1(project: Project): void {
    if (project.schemaVersion !== 1) {
      throw new ModelResolverError(
        `Unsupported schema version: ${project.schemaVersion}`
      );
    }
    if (!project.projectId || project.projectId.trim() === "") {
      throw new ModelResolverError("Project ID is required");
    }
    if (!Array.isArray(project.tiers) || project.tiers.length === 0) {
      throw new ModelResolverError("Project must have at least one tier");
    }
  }

  private static makeResolvedItem(
    id: string,
    item: ProjectItem,
    override?: ProjectItemOverride
  ): ResolvedItem {
    const title = this.resolvedTitle(id, item, override);
    const subtitle = item.subtitle;
    const description = this.resolvedDescription(item, override);
    const thumbUri = this.resolvedThumbUri(item, override);
    const attributes = this.buildAttributes(item, override, thumbUri);

    return {
      id,
      title,
      subtitle,
      description,
      thumbUri,
      attributes: attributes && Object.keys(attributes).length > 0 ? attributes : undefined,
    };
  }

  private static resolvedTitle(
    id: string,
    item: ProjectItem,
    override?: ProjectItemOverride
  ): string {
    if (override?.displayTitle && override.displayTitle.trim() !== "") {
      return override.displayTitle;
    }
    if (item.title.trim() !== "") {
      return item.title;
    }
    return id;
  }

  private static resolvedDescription(
    item: ProjectItem,
    override?: ProjectItemOverride
  ): string | undefined {
    if (override?.notes && override.notes.trim() !== "") {
      return override.notes;
    }
    if (item.summary && item.summary.trim() !== "") {
      return item.summary;
    }
    return undefined;
  }

  private static resolvedThumbUri(
    item: ProjectItem,
    override?: ProjectItemOverride
  ): string | undefined {
    const overrideThumb = this.mediaPrimaryThumbnail(override?.media);
    if (overrideThumb) return overrideThumb;

    const itemThumb = this.mediaPrimaryThumbnail(item.media);
    if (itemThumb) return itemThumb;

    return undefined;
  }

  private static mediaPrimaryThumbnail(media?: ProjectMedia[]): string | undefined {
    if (!media || media.length === 0) return undefined;
    const first = media[0];
    if (first.thumbUri && first.thumbUri.trim() !== "") {
      return first.thumbUri;
    }
    if (first.posterUri && first.posterUri.trim() !== "") {
      return first.posterUri;
    }
    return undefined;
  }

  private static buildAttributes(
    item: ProjectItem,
    override: ProjectItemOverride | undefined,
    thumbUri: string | undefined
  ): Record<string, string> | undefined {
    const attributes: Record<string, string> = {};

    // Name
    if (override?.displayTitle && override.displayTitle.trim() !== "") {
      attributes.name = override.displayTitle;
    } else if (item.title.trim() !== "") {
      attributes.name = item.title;
    }

    // Season (from override or item attributes)
    const season =
      override?.additional?.season?.toString() ??
      item.attributes?.season?.toString();
    if (season) {
      attributes.season = season;
    }

    // Thumb URI
    if (thumbUri) {
      attributes.thumbUri = thumbUri;
    }

    // Rating
    const rating = override?.rating ?? item.rating;
    if (rating !== undefined && rating !== null) {
      attributes.rating = String(rating);
    }

    return Object.keys(attributes).length > 0 ? attributes : undefined;
  }

  private static resolvedItemToItem(resolved: ResolvedItem): Item {
    return {
      id: resolved.id,
      name: resolved.title,
      seasonString: resolved.subtitle,
      description: resolved.description,
      imageUrl: resolved.thumbUri,
    };
  }

  private static parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let insideQuotes = false;
    let prevWasQuote = false;

    for (const ch of line) {
      if (ch === '"') {
        if (insideQuotes && prevWasQuote) {
          current += '"';
          prevWasQuote = false;
        } else if (insideQuotes) {
          prevWasQuote = true;
        } else {
          insideQuotes = true;
        }
      } else if (ch === "," && !insideQuotes) {
        fields.push(current.trim());
        current = "";
        prevWasQuote = false;
      } else {
        if (prevWasQuote) {
          insideQuotes = false;
          prevWasQuote = false;
        }
        current += ch;
      }
    }

    fields.push(current.trim());
    return fields;
  }

  private static createItemFromCSVComponents(components: string[]): Item | null {
    const name = components[0].trim();
    const season = components[1].trim();

    if (!name) return null;

    const id = name.toLowerCase().replace(/ /g, "_");
    return {
      id,
      name,
      seasonString: season || undefined,
    };
  }

  private static addItemToTier(
    item: Item,
    tier: string,
    tiers: Items,
    discoveredTiers: Set<string>
  ): void {
    const tierKey = tier.trim();
    const normalizedKey =
      tierKey.toLowerCase() === "unranked" ? "unranked" : tierKey.toUpperCase();

    if (tiers[normalizedKey] !== undefined) {
      // Known tier - add item
      tiers[normalizedKey].push(item);
    } else {
      // Unknown tier - create and track
      tiers[normalizedKey] = [item];
      if (normalizedKey !== "unranked") {
        discoveredTiers.add(normalizedKey);
      }
    }
  }
}
