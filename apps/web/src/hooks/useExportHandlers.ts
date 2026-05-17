import { useCallback } from "react";
import { useAppSelector } from "./useAppSelector";
import { ExportFormatter } from "@tiercade/core";
import { ToastQueue } from "@react-spectrum/s2";
import { copyToClipboard, generateShareUrl } from "../utils/urlSharing";

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface UseExportHandlersResult {
  onCopyLink: () => Promise<void>;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportMarkdown: () => void;
  onExport: (formatId: "link" | "png" | "json" | "csv" | "markdown") => void;
}

/**
 * Export handler hook — concentrates the 5 text-export handlers behind a
 * stable Interface. Reads tier selectors internally; accepts `exportAsPNG`
 * (image export, owned by useExport) as a parameter so the two concerns
 * remain separate.
 */
export function useExportHandlers(
  exportAsPNG: () => Promise<void>
): UseExportHandlersResult {
  const tiers = useAppSelector((state) => state.tier.tiers);
  const tierOrder = useAppSelector((state) => state.tier.tierOrder);
  const tierLabels = useAppSelector((state) => state.tier.tierLabels);
  const tierColors = useAppSelector((state) => state.tier.tierColors);
  const projectName = useAppSelector((state) => state.tier.projectName);

  const onCopyLink = useCallback(async () => {
    try {
      const url = generateShareUrl(
        projectName,
        tierOrder,
        tierLabels,
        tierColors as Record<string, string>,
        tiers
      );
      const success = await copyToClipboard(url);
      if (success) {
        ToastQueue.positive("Share link copied to clipboard!");
      } else {
        ToastQueue.negative("Failed to copy link");
      }
    } catch (error) {
      console.error("Failed to generate share link:", error);
      ToastQueue.negative("Failed to generate share link");
    }
  }, [projectName, tierOrder, tierLabels, tierColors, tiers]);

  const onExportJSON = useCallback(() => {
    try {
      const project = {
        schemaVersion: 1,
        projectId: `project-${Date.now()}`,
        title: projectName || "My Tier List",
        tiers: tierOrder.map((tierId, index) => ({
          id: tierId,
          label: tierLabels[tierId] ?? tierId,
          color: tierColors[tierId],
          order: index,
          locked: false,
          itemIds: (tiers[tierId] ?? []).map((item) => item.id),
        })),
        items: Object.fromEntries(
          Object.values(tiers)
            .flat()
            .map((item) => [
              item.id,
              {
                id: item.id,
                title: item.name ?? item.id,
                subtitle: item.seasonString,
                imageUrl: item.media?.type === "image" || item.media?.type === "gif" ? item.media.url : undefined,
              },
            ])
        ),
        storage: { mode: "local" },
        settings: { theme: "default", showUnranked: true },
        audit: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "tiercade-web",
          updatedBy: "tiercade-web",
        },
      };

      downloadFile(
        `${projectName || "tier-list"}.json`,
        JSON.stringify(project, null, 2),
        "application/json"
      );
      ToastQueue.positive("JSON exported!");
    } catch (error) {
      console.error("Export failed:", error);
      ToastQueue.negative(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }, [projectName, tierOrder, tierLabels, tierColors, tiers]);

  const onExportCSV = useCallback(() => {
    try {
      const csv = ExportFormatter.generateCSV(tiers, tierOrder);
      downloadFile(`${projectName || "tier-list"}.csv`, csv, "text/csv");
      ToastQueue.positive("CSV exported!");
    } catch (error) {
      console.error("Export failed:", error);
      ToastQueue.negative(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }, [projectName, tiers, tierOrder]);

  const onExportMarkdown = useCallback(() => {
    try {
      const tierConfig = tierOrder.reduce(
        (acc, tierId) => {
          acc[tierId] = { name: tierLabels[tierId] ?? tierId };
          return acc;
        },
        {} as Record<string, { name: string }>
      );

      const markdown = ExportFormatter.generateMarkdown(
        projectName || "My Tier List",
        "Default",
        tiers,
        tierOrder,
        tierConfig
      );
      downloadFile(
        `${projectName || "tier-list"}.md`,
        markdown,
        "text/markdown"
      );
      ToastQueue.positive("Markdown exported!");
    } catch (error) {
      console.error("Export failed:", error);
      ToastQueue.negative(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }, [projectName, tiers, tierOrder, tierLabels]);

  const onExport = useCallback(
    (formatId: "link" | "png" | "json" | "csv" | "markdown") => {
      switch (formatId) {
        case "link":
          void onCopyLink();
          break;
        case "png":
          void exportAsPNG();
          break;
        case "json":
          onExportJSON();
          break;
        case "csv":
          onExportCSV();
          break;
        case "markdown":
          onExportMarkdown();
          break;
      }
    },
    [onCopyLink, exportAsPNG, onExportCSV, onExportJSON, onExportMarkdown]
  );

  return { onCopyLink, onExportJSON, onExportCSV, onExportMarkdown, onExport };
}
