/**
 * Export formatters matching TiercadeCore/Utilities/Formatters.swift
 */

import { Items, TierConfig, Item } from "./models";

export interface ExportFormatterOptions {
  group: string;
  date: Date;
  themeName: string;
  tiers: Items;
  tierConfig: TierConfig;
  locale?: string;
}

export class ExportFormatter {
  /**
   * Generate plain text export matching Swift's ExportFormatter.generate
   */
  static generate(options: ExportFormatterOptions): string {
    const { group, date, themeName, tiers, tierConfig, locale = "en-US" } = options;

    const dateFormatter = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    });

    let text = `🗝️ My Tier List - ${group}\n`;
    text += `Created: ${dateFormatter.format(date)}\n`;
    text += `Theme: ${themeName}\n\n`;

    // Process all tiers except unranked
    const ordered = Object.entries(tiers).filter(([key]) => key !== "unranked");

    const parts: string[] = [];
    for (const [tierName, items] of ordered) {
      if (items.length === 0) continue;

      // Fallback to tier name if config entry is missing (supports custom tiers)
      const config = tierConfig[tierName];
      const label = config?.name ?? tierName;
      const desc = config?.description ?? "";
      const names = items.map((item) => item.name ?? item.id).join(", ");

      parts.push(`${label} Tier (${desc}): ${names}`);
    }

    text += parts.join("\n\n");
    return text;
  }

  /**
   * Generate CSV export matching Swift's AppState.exportToCSV
   */
  static generateCSV(
    tiers: Items,
    tierOrder: string[],
    options?: { sanitize?: boolean }
  ): string {
    const sanitize = options?.sanitize ?? true;

    let csv = "Name,Season,Tier\n";

    // Process tiers in order
    for (const tierName of tierOrder) {
      const items = tiers[tierName];
      if (!items) continue;

      for (const item of items) {
        const rawName = (item.name ?? item.id).replace(/,/g, ";");
        const name = sanitize ? this.sanitizeCSVCell(rawName) : rawName;
        const season = sanitize
          ? this.sanitizeCSVCell(item.seasonString ?? "?")
          : item.seasonString ?? "?";

        csv += `"${name}","${season}","${tierName}"\n`;
      }
    }

    // Process unranked if present
    const unranked = tiers["unranked"];
    if (unranked) {
      for (const item of unranked) {
        const rawName = (item.name ?? item.id).replace(/,/g, ";");
        const name = sanitize ? this.sanitizeCSVCell(rawName) : rawName;
        const season = sanitize
          ? this.sanitizeCSVCell(item.seasonString ?? "?")
          : item.seasonString ?? "?";

        csv += `"${name}","${season}","Unranked"\n`;
      }
    }

    return csv;
  }

  /**
   * Generate Markdown export matching Swift's AppState.exportToMarkdown
   */
  static generateMarkdown(
    group: string,
    themeName: string,
    tiers: Items,
    tierOrder: string[],
    tierConfig: TierConfig,
    date: Date = new Date(),
    locale: string = "en-US"
  ): string {
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    });

    let markdown = `# My Tier List - ${group}\n\n`;
    markdown += `**Theme:** ${themeName}  \n`;
    markdown += `**Date:** ${dateFormatter.format(date)}\n\n`;

    // Process tiers in order
    for (const tierName of tierOrder) {
      const items = tiers[tierName];
      const config = tierConfig[tierName];

      if (!items || items.length === 0 || !config) continue;

      markdown += `## ${config.name} Tier\n\n`;
      for (const item of items) {
        const season = item.seasonString ?? "?";
        markdown += `- **${item.name ?? item.id}** (Season ${season})\n`;
      }
      markdown += "\n";
    }

    // Process unranked if present and non-empty
    const unranked = tiers["unranked"];
    if (unranked && unranked.length > 0) {
      markdown += "## Unranked\n\n";
      for (const item of unranked) {
        const season = item.seasonString ?? "?";
        markdown += `- ${item.name ?? item.id} (Season ${season})\n`;
      }
    }

    return markdown;
  }

  /**
   * Sanitize CSV cell values to prevent formula injection attacks.
   * Prefixes formula-leading characters (=, +, -, @) with a single quote.
   * Matches Swift's AppState.sanitizeCSVCell
   */
  static sanitizeCSVCell(value: string): string {
    if (
      value.startsWith("=") ||
      value.startsWith("+") ||
      value.startsWith("-") ||
      value.startsWith("@")
    ) {
      return "'" + value;
    }
    return value;
  }
}

export class AnalysisFormatter {
  /**
   * Generate tier analysis text matching Swift's AnalysisFormatter.generateTierAnalysis
   */
  static generateTierAnalysis(
    tierName: string,
    tierInfo: { name: string; description?: string },
    items: Item[]
  ): string {
    let s = `${tierInfo.name} Tier Analysis - ${tierInfo.description ?? ""}\n\n`;
    const plural = items.length === 1 ? "" : "s";
    const itemSummary = `You've placed ${items.length} item${plural} in this tier:\n\n`;
    s += itemSummary;

    for (const item of items) {
      const season = item.seasonString ?? (item.seasonNumber?.toString() ?? "?");
      const status = item.status ?? "";
      s += `• ${item.name ?? item.id} (Season ${season}, ${status})\n`;
      if (item.description && item.description.length > 0) {
        s += `  ${item.description}\n\n`;
      }
    }

    return s;
  }
}
