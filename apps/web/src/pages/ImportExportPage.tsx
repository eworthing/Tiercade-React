import React, { useCallback, useRef, useState } from "react";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  captureSnapshot,
  loadDefaultProject,
  selectProjectName,
  selectTotalItemCount,
} from "@tiercade/state";
import { useImportHandlers } from "../hooks/useImportHandlers";
import { useExportHandlers } from "../hooks/useExportHandlers";
import {
  AlertDialog,
  Badge,
  Button,
  Card,
  CardView,
  Content,
  DialogTrigger,
  DropZone,
  Heading,
  Text,
} from "@react-spectrum/s2";
import { ToastQueue } from "@react-spectrum/s2";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { useExport } from "../hooks/useExport";

interface ExportFormat {
  id: "link" | "png" | "json" | "csv" | "markdown";
  name: string;
  description: string;
  badge?: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "link",
    name: "Share link",
    description: "Copy a link others can open to view.",
    badge: "Popular",
  },
  {
    id: "png",
    name: "PNG image",
    description: "Download a shareable image of the board.",
  },
  {
    id: "json",
    name: "JSON",
    description: "Full backup (recommended).",
  },
  {
    id: "csv",
    name: "CSV",
    description: "Open in Excel or Google Sheets.",
  },
  {
    id: "markdown",
    name: "Markdown",
    description: "For Reddit, Discord, or documentation.",
  },
];

const page = style({
  display: "flex",
  flexDirection: "column",
  gap: 24,
});

const header = style({
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

const section = style({
  display: "flex",
  flexDirection: "column",
  gap: 12,
});

const cardHeaderRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
});

const helperRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
});

const dataCard = style({
  display: "flex",
  flexDirection: "column",
  gap: 8,
});

export function ImportExportPage() {
  const dispatch = useAppDispatch();
  const projectName = useAppSelector(selectProjectName);
  const totalItems = useAppSelector(selectTotalItemCount);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const {
    isExporting,
    exportAsPNG,
    copyToClipboard: copyImageToClipboard,
  } = useExport({
    defaultFilename: projectName || "tier-list",
  });

  const {
    onImportFile: handleImportFile,
    onImportFileSelection: handleImportFileSelection,
  } = useImportHandlers(dispatch);

  const {
    onExport: handleExport,
  } = useExportHandlers(exportAsPNG);

  const handleReset = useCallback(() => {
    dispatch(captureSnapshot("Reset to Default"));
    dispatch(loadDefaultProject());
    setShowResetConfirm(false);
    ToastQueue.positive("Reset to default project");
  }, [dispatch]);

  return (
    <div className={page}>
      <div className={header}>
        <Heading level={1} UNSAFE_style={{ fontFamily: "var(--font-display)" }}>Import / Export</Heading>
        <Text>Save, share, or import your tier lists.</Text>
      </div>

      <section className={section}>
        <Heading level={2}>Export</Heading>
        {totalItems === 0 ? (
          <Text>Add some items to your tier list first to export.</Text>
        ) : (
          <>
            <CardView
              aria-label="Export formats"
              items={EXPORT_FORMATS}
              onAction={(key) => handleExport(String(key) as ExportFormat["id"])}
            >
              {(format) => (
                <Card id={format.id} data-testid={`export-format-${format.id}`}>
                  <div className={cardHeaderRow}>
                    <Heading level={3}>{format.name}</Heading>
                    {format.badge && (
                      <Badge variant="informative" fillStyle="subtle">
                        {format.badge}
                      </Badge>
                    )}
                  </div>
                  <Text>{format.description}</Text>
                </Card>
              )}
            </CardView>

            <div className={helperRow}>
              <Button
                variant="secondary"
                size="S"
                onPress={copyImageToClipboard}
                isDisabled={isExporting}
              >
                Copy image to clipboard
              </Button>
              <Text>Paste directly into social media or chat.</Text>
            </div>
          </>
        )}
      </section>

      <section className={section}>
        <Heading level={2}>Import</Heading>
        <DropZone
          aria-label="Import tier list file"
          onDrop={async (e) => {
            const files = await Promise.all(
              e.items
                .filter((item) => item.kind === "file")
                .map((item) => item.getFile())
            );
            const file = files[0];
            if (file) handleImportFile(file);
          }}
        >
          <Heading>Drop a file here</Heading>
          <Content>
            <Text>Supports JSON and CSV files.</Text>
          </Content>
          <input
            ref={importFileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleImportFileSelection}
            style={{ display: "none" }}
            data-testid="import-file-input"
          />
          <Button
            variant="secondary"
            onPress={() => importFileInputRef.current?.click()}
          >
            Browse…
          </Button>
        </DropZone>
      </section>

      <section className={section}>
        <Heading level={2}>Data management</Heading>
        <div className={dataCard}>
          <Heading level={3}>Reset to default</Heading>
          <Text>Clear your current tier list and start fresh with example data.</Text>
          <Button variant="negative" onPress={() => setShowResetConfirm(true)}>
            Reset
          </Button>
        </div>
        <Text>
          Your data is stored locally in this browser. Export to JSON to create a
          backup or transfer to another device.
        </Text>
      </section>

      <DialogTrigger
        isOpen={showResetConfirm}
        onOpenChange={(isOpen) => !isOpen && setShowResetConfirm(false)}
      >
        <span style={{ display: "none" }}>
          <Button aria-hidden="true">Open</Button>
        </span>
        <AlertDialog
          title="Reset to Default?"
          variant="destructive"
          primaryActionLabel="Reset"
          cancelLabel="Cancel"
          onPrimaryAction={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        >
          This will clear your current tier list and load the example project.
          This action cannot be undone.
        </AlertDialog>
      </DialogTrigger>
    </div>
  );
}

