import React, { useState, useRef, useCallback } from "react";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  importJSON,
  importCSV,
  loadDefaultProject,
  captureSnapshot,
} from "@tiercade/state";
import { ExportFormatter } from "@tiercade/core";
import { Button, Modal } from "@tiercade/ui";
import { exportElementAsPNG, copyElementToClipboard } from "../utils/exportImage";
import { generateShareUrl, copyToClipboard } from "../utils/urlSharing";

// Export format cards
const EXPORT_FORMATS = [
  {
    id: "link",
    name: "Share Link",
    description: "Copy a link others can open to view",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    badge: "Popular",
  },
  {
    id: "png",
    name: "PNG Image",
    description: "Share as an image on social media",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "json",
    name: "JSON",
    description: "Full data backup, import to other devices",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    id: "csv",
    name: "CSV",
    description: "Open in Excel or Google Sheets",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "markdown",
    name: "Markdown",
    description: "For Reddit, Discord, or documentation",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
];

export function ImportExportPage() {
  const dispatch = useAppDispatch();
  const tiers = useAppSelector((state) => state.tier.tiers);
  const tierOrder = useAppSelector((state) => state.tier.tierOrder);
  const tierLabels = useAppSelector((state) => state.tier.tierLabels);
  const tierColors = useAppSelector((state) => state.tier.tierColors);
  const projectName = useAppSelector((state) => state.tier.projectName);

  const [isExporting, setIsExporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tierBoardRef = useRef<HTMLDivElement>(null);

  // Clear status after 3 seconds
  const showStatus = useCallback((type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  const handleExportPNG = useCallback(async () => {
    // Find the tier board element on the page
    const tierBoard = document.querySelector("[data-tier-board]") as HTMLElement;
    if (!tierBoard) {
      showStatus("error", "Could not find tier board to export");
      return;
    }

    setIsExporting(true);
    try {
      await exportElementAsPNG(tierBoard, {
        filename: `${projectName || "tier-list"}.png`,
        scale: 2,
      });
      showStatus("success", "PNG exported successfully!");
    } catch (error) {
      showStatus("error", `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  }, [projectName, showStatus]);

  const handleCopyImage = useCallback(async () => {
    const tierBoard = document.querySelector("[data-tier-board]") as HTMLElement;
    if (!tierBoard) {
      showStatus("error", "Could not find tier board to copy");
      return;
    }

    setIsExporting(true);
    try {
      const success = await copyElementToClipboard(tierBoard);
      if (success) {
        showStatus("success", "Image copied to clipboard!");
      } else {
        showStatus("error", "Failed to copy image - try downloading instead");
      }
    } catch (error) {
      showStatus("error", "Clipboard access denied");
    } finally {
      setIsExporting(false);
    }
  }, [showStatus]);

  const handleCopyLink = useCallback(async () => {
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
        showStatus("success", "Share link copied to clipboard!");
      } else {
        showStatus("error", "Failed to copy link");
      }
    } catch (error) {
      showStatus("error", "Failed to generate share link");
    }
  }, [projectName, tierOrder, tierLabels, tierColors, tiers, showStatus]);

  const handleExportJSON = useCallback(() => {
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
                imageUrl: item.imageUrl,
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

      const json = JSON.stringify(project, null, 2);
      downloadFile(`${projectName || "tier-list"}.json`, json, "application/json");
      showStatus("success", "JSON exported successfully!");
    } catch (error) {
      showStatus("error", `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [projectName, tierOrder, tierLabels, tierColors, tiers, showStatus]);

  const handleExportCSV = useCallback(() => {
    try {
      const csv = ExportFormatter.generateCSV(tiers, tierOrder);
      downloadFile(`${projectName || "tier-list"}.csv`, csv, "text/csv");
      showStatus("success", "CSV exported successfully!");
    } catch (error) {
      showStatus("error", `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [projectName, tiers, tierOrder, showStatus]);

  const handleExportMarkdown = useCallback(() => {
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
      downloadFile(`${projectName || "tier-list"}.md`, markdown, "text/markdown");
      showStatus("success", "Markdown exported successfully!");
    } catch (error) {
      showStatus("error", `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [projectName, tiers, tierOrder, tierLabels, showStatus]);

  const handleExport = useCallback(
    (formatId: string) => {
      switch (formatId) {
        case "link":
          handleCopyLink();
          break;
        case "png":
          handleExportPNG();
          break;
        case "json":
          handleExportJSON();
          break;
        case "csv":
          handleExportCSV();
          break;
        case "markdown":
          handleExportMarkdown();
          break;
      }
    },
    [handleCopyLink, handleExportPNG, handleExportJSON, handleExportCSV, handleExportMarkdown]
  );

  const handleImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) {
          showStatus("error", "Could not read file");
          return;
        }

        try {
          dispatch(captureSnapshot("Import"));
          if (file.name.endsWith(".json")) {
            dispatch(importJSON(content));
            showStatus("success", "JSON imported successfully!");
          } else if (file.name.endsWith(".csv")) {
            dispatch(importCSV(content));
            showStatus("success", "CSV imported successfully!");
          } else {
            showStatus("error", "Unsupported file type (only .json and .csv)");
          }
        } catch (error) {
          showStatus("error", `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      };
      reader.readAsText(file);
    },
    [dispatch, showStatus]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleImportFile(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleImportFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleImportFile(file);
      }
    },
    [handleImportFile]
  );

  const handleReset = useCallback(() => {
    dispatch(captureSnapshot("Reset to Default"));
    dispatch(loadDefaultProject());
    setShowResetConfirm(false);
    showStatus("success", "Reset to default project");
  }, [dispatch, showStatus]);

  // Count items
  const totalItems = Object.values(tiers).flat().length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Import / Export</h1>
        <p className="text-text-muted mt-1">
          Save, share, or import your tier lists
        </p>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-lg border ${
            statusMessage.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-danger/10 border-danger/30 text-danger"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {statusMessage.text}
          </div>
        </div>
      )}

      {/* Export Section */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Export
        </h2>

        {totalItems === 0 ? (
          <div className="text-center py-8 bg-surface-raised rounded-lg border border-border">
            <p className="text-text-muted">
              Add some items to your tier list first to export
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => handleExport(format.id)}
                disabled={isExporting}
                className="group relative p-4 bg-surface-raised hover:bg-surface-soft border border-border hover:border-accent rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {format.badge && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-accent text-white text-xs font-medium rounded-full">
                    {format.badge}
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-surface text-text-muted group-hover:text-accent transition-colors">
                    {format.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-text">{format.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {format.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Quick copy button for PNG */}
        {totalItems > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyImage}
              disabled={isExporting}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              }
            >
              Copy Image to Clipboard
            </Button>
            <span className="text-xs text-text-subtle">
              Paste directly into social media or chat
            </span>
          </div>
        )}
      </section>

      {/* Import Section */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Import
        </h2>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
            dragOver
              ? "border-accent bg-accent/10"
              : "border-border hover:border-text-subtle"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-surface-raised">
                <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <p className="text-text font-medium">
              Drop a file here or click to browse
            </p>
            <p className="text-sm text-text-muted">
              Supports JSON and CSV files
            </p>
          </div>
        </div>
      </section>

      {/* Data Management Section */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Data Management
        </h2>

        <div className="p-4 bg-surface-raised rounded-lg border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-text">Reset to Default</h3>
              <p className="text-sm text-text-muted mt-0.5">
                Clear your current tier list and start fresh with example data
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowResetConfirm(true)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Storage info */}
        <div className="mt-4 p-4 bg-surface-soft rounded-lg border border-border-soft">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-text-muted mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-text-muted">
              <p className="font-medium text-text">Your data is stored locally</p>
              <p className="mt-1">
                All tier list data is saved in your browser's local storage.
                Export to JSON to create a backup or transfer to another device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      <Modal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset to Default?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-muted">
            This will clear your current tier list and load the example project.
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

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
