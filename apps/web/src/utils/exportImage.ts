import html2canvas from "html2canvas";

export interface ExportOptions {
  scale?: number;
  backgroundColor?: string;
  filename?: string;
}

/**
 * Export a DOM element as a PNG image
 */
export async function exportElementAsPNG(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    scale = 2,
    backgroundColor = "#1a1a2e",
    filename = "tier-list.png",
  } = options;

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export a DOM element as a data URL for preview
 */
export async function exportElementAsDataURL(
  element: HTMLElement,
  options: Omit<ExportOptions, "filename"> = {}
): Promise<string> {
  const { scale = 2, backgroundColor = "#1a1a2e" } = options;

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  return canvas.toDataURL("image/png");
}

/**
 * Copy image to clipboard (if supported)
 */
export async function copyElementToClipboard(
  element: HTMLElement,
  options: Omit<ExportOptions, "filename"> = {}
): Promise<boolean> {
  try {
    const { scale = 2, backgroundColor = "#1a1a2e" } = options;

    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      return false;
    }

    // Use Clipboard API to copy image
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);

    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}
