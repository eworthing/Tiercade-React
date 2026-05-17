import React, { useCallback, useEffect, useRef } from "react";
import type { AppDispatch } from "@tiercade/state";
import { captureSnapshot, importCSV, importJSON } from "@tiercade/state";
import { ToastQueue } from "@react-spectrum/s2";

export interface ImportHandlers {
  /** Process a File object: read as text, dispatch JSON or CSV import. */
  onImportFile: (file: File) => void;
  /** onChange handler for <input type="file">: extracts the first file and delegates. */
  onImportFileSelection: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Encapsulates file-import handlers that share only `dispatch` as their
 * dependency. Reads the file format from its extension and dispatches the
 * appropriate import thunk with an undo snapshot.
 *
 * The active FileReader is stored in a ref so that:
 *   (a) navigating away before the read completes aborts the reader and
 *       prevents stale dispatch from firing after unmount, and
 *   (b) starting a new import while one is already in progress aborts the
 *       previous reader before beginning the new one.
 */
export function useImportHandlers(dispatch: AppDispatch): ImportHandlers {
  const readerRef = useRef<FileReader | null>(null);

  // Abort any in-progress read on unmount.
  useEffect(() => {
    return () => {
      readerRef.current?.abort();
    };
  }, []);

  const onImportFile = useCallback(
    (file: File) => {
      // Abort any previous read before starting a new one.
      readerRef.current?.abort();

      const reader = new FileReader();
      readerRef.current = reader;

      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) {
          ToastQueue.negative("Could not read file");
          return;
        }
        try {
          if (file.name.endsWith(".json")) {
            dispatch(captureSnapshot("Import"));
            dispatch(importJSON(content));
            ToastQueue.positive("JSON imported!");
          } else if (file.name.endsWith(".csv")) {
            dispatch(captureSnapshot("Import"));
            dispatch(importCSV(content));
            ToastQueue.positive("CSV imported!");
          } else {
            ToastQueue.negative("Unsupported file type (only .json and .csv)");
          }
        } catch (error) {
          console.error("Import failed:", error);
          ToastQueue.negative(
            `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      };
      reader.readAsText(file);
    },
    [dispatch]
  );

  const onImportFileSelection = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) onImportFile(file);
      event.currentTarget.value = "";
    },
    [onImportFile]
  );

  return { onImportFile, onImportFileSelection };
}
