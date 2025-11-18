import { useAppDispatch, useAppSelector } from "../hooks/useAppSelector";
import { importJSON, importCSV, loadDefaultProject } from "@tiercade/state";
import { ExportFormatter, ModelResolver } from "@tiercade/core";
import { useState, useRef } from "react";

export function ImportExportPage() {
  const dispatch = useAppDispatch();
  const tiers = useAppSelector((state) => state.tier.tiers);
  const tierOrder = useAppSelector((state) => state.tier.tierOrder);
  const tierLabels = useAppSelector((state) => state.tier.tierLabels);

  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    try {
      // Build a simple Project structure for export
      const project = {
        schemaVersion: 1,
        projectId: "exported-project",
        title: "Exported Tier List",
        tiers: tierOrder.map((tierId, index) => ({
          id: tierId,
          label: tierLabels[tierId] ?? tierId,
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
              },
            ])
        ),
        storage: { mode: "local" },
        settings: { theme: "default", showUnranked: true },
        audit: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "web-app",
          updatedBy: "web-app",
        },
      };

      const json = JSON.stringify(project, null, 2);
      downloadFile("tier-list.json", json, "application/json");
      setStatusMessage("Exported JSON successfully");
    } catch (error) {
      setStatusMessage(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = ExportFormatter.generateCSV(tiers, tierOrder);
      downloadFile("tier-list.csv", csv, "text/csv");
      setStatusMessage("Exported CSV successfully");
    } catch (error) {
      setStatusMessage(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleExportMarkdown = () => {
    try {
      const tierConfig = tierOrder.reduce((acc, tierId) => {
        acc[tierId] = { name: tierLabels[tierId] ?? tierId };
        return acc;
      }, {} as Record<string, { name: string }>);

      const markdown = ExportFormatter.generateMarkdown(
        "My Tier List",
        "Default",
        tiers,
        tierOrder,
        tierConfig
      );
      downloadFile("tier-list.md", markdown, "text/markdown");
      setStatusMessage("Exported Markdown successfully");
    } catch (error) {
      setStatusMessage(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setStatusMessage("Could not read file");
        return;
      }

      try {
        if (file.name.endsWith(".json")) {
          dispatch(importJSON(content));
          setStatusMessage("Imported JSON successfully");
        } else if (file.name.endsWith(".csv")) {
          dispatch(importCSV(content));
          setStatusMessage("Imported CSV successfully");
        } else {
          setStatusMessage("Unsupported file type (only .json and .csv)");
        }
      } catch (error) {
        setStatusMessage(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDefaultProject = () => {
    dispatch(loadDefaultProject());
    setStatusMessage("Loaded default project");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Import / Export</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Export</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Export JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportMarkdown}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Export Markdown
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Import</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <label className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded cursor-pointer">
            Choose File
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
          <span className="text-gray-400 text-sm">(JSON or CSV)</span>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Reset</h2>
        <button
          onClick={handleLoadDefaultProject}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
        >
          Load Default Project
        </button>
      </section>

      {statusMessage && (
        <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded">
          <p className="text-gray-200">{statusMessage}</p>
        </div>
      )}
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
