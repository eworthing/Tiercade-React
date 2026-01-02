/**
 * Import/Export Page Object
 *
 * Page object for the Import/Export page (/import-export).
 * Provides methods for importing and exporting tier list data.
 */

import type { Locator } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { BasePage } from "./BasePage";
import type { TestTierData } from "../utils/testDataFactory";

export class ImportExportPage extends BasePage {
  readonly path = "/import-export";
  private tempFiles: string[] = [];

  // ============================================================================
  // Page Elements
  // ============================================================================

  /**
   * Get the page heading (handles "Import / Export" with spaces)
   */
  get heading(): Locator {
    return this.page.locator('h1:has-text("Import"), h1:has-text("Export")');
  }

  /**
   * Get the empty state message (shown when no items to export)
   * Matches: "Add some items to your tier list first to export"
   */
  get emptyExportMessage(): Locator {
    return this.page.locator('text=/add.*items|no items|nothing to export/i');
  }

  /**
   * Check if export is available (items exist)
   */
  async canExport(): Promise<boolean> {
    return (await this.emptyExportMessage.count()) === 0;
  }

  // ============================================================================
  // Export Format Cards (click-based export)
  // ============================================================================

  /**
   * Get JSON export card/button
   */
  get exportJsonButton(): Locator {
    return this.page.locator('button:has-text("JSON")').first();
  }

  /**
   * Get CSV export card/button
   */
  get exportCsvButton(): Locator {
    return this.page.locator('button:has-text("CSV")').first();
  }

  /**
   * Get Markdown export card/button
   */
  get exportMarkdownButton(): Locator {
    return this.page.locator('button:has-text("Markdown")').first();
  }

  /**
   * Get Share Link export card/button
   */
  get exportLinkButton(): Locator {
    return this.page.locator('button:has-text("Share Link")').first();
  }

  /**
   * Get PNG export card/button
   */
  get exportPngButton(): Locator {
    return this.page.locator('button:has-text("PNG")').first();
  }

  /**
   * Get Text export button (may not exist - use Markdown instead)
   */
  get exportTextButton(): Locator {
    return this.page.locator('button:has-text("Text")').first();
  }

  // ============================================================================
  // Import Elements
  // ============================================================================

  /**
   * Get file input element
   */
  get fileInput(): Locator {
    return this.page.locator('input[type="file"]');
  }

  /**
   * Get import button (if separate from file input)
   */
  get importButton(): Locator {
    return this.page.locator('button:has-text("Import"), button:has-text("Choose File")');
  }

  /**
   * Check if file input exists
   */
  async hasFileInput(): Promise<boolean> {
    return (await this.fileInput.count()) > 0;
  }

  /**
   * Check if import button exists
   */
  async hasImportButton(): Promise<boolean> {
    return (await this.importButton.count()) > 0;
  }

  // ============================================================================
  // Error Messages
  // ============================================================================

  /**
   * Get error message element
   */
  get errorMessage(): Locator {
    return this.page.locator('text=/error|invalid|failed/i, [role="alert"]');
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }

  // ============================================================================
  // Export Methods
  // ============================================================================

  /**
   * Export as JSON and return download
   */
  async exportJson(): Promise<{
    filename: string;
    content: string;
    data: TestTierData;
  }> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.exportJsonButton.click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    const downloadPath = await download.path();
    const content = downloadPath ? fs.readFileSync(downloadPath, "utf-8") : "";
    const data = JSON.parse(content) as TestTierData;

    return { filename, content, data };
  }

  /**
   * Export as CSV and return download info
   */
  async exportCsv(): Promise<{ filename: string; content: string }> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.exportCsvButton.click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    const downloadPath = await download.path();
    const content = downloadPath ? fs.readFileSync(downloadPath, "utf-8") : "";

    return { filename, content };
  }

  /**
   * Export as Markdown
   */
  async exportMarkdown(): Promise<{ filename: string; content: string }> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.exportMarkdownButton.click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    const downloadPath = await download.path();
    const content = downloadPath ? fs.readFileSync(downloadPath, "utf-8") : "";

    return { filename, content };
  }

  /**
   * Export as Text
   */
  async exportText(): Promise<{ filename: string; content: string }> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.exportTextButton.click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    const downloadPath = await download.path();
    const content = downloadPath ? fs.readFileSync(downloadPath, "utf-8") : "";

    return { filename, content };
  }

  // ============================================================================
  // Import Methods
  // ============================================================================

  /**
   * Import a JSON file from path
   */
  async importJsonFile(filepath: string): Promise<void> {
    await this.fileInput.setInputFiles(filepath);
    await this.waitForContentUpdate();
  }

  /**
   * Import JSON data directly (creates temp file)
   */
  async importJson(data: TestTierData): Promise<void> {
    const tempFile = this.createTempJsonFile(data);
    await this.importJsonFile(tempFile);
  }

  /**
   * Import a CSV file from path
   */
  async importCsvFile(filepath: string): Promise<void> {
    await this.fileInput.setInputFiles(filepath);
    await this.waitForContentUpdate();
  }

  /**
   * Import CSV data directly (creates temp file)
   */
  async importCsv(csvContent: string): Promise<void> {
    const tempFile = this.createTempCsvFile(csvContent);
    await this.importCsvFile(tempFile);
  }

  /**
   * Import an invalid file to test error handling
   */
  async importInvalidFile(content: string): Promise<void> {
    const tempFile = this.createTempFile("invalid.txt", content);
    await this.fileInput.setInputFiles(tempFile);
    await this.waitForContentUpdate();
  }

  // ============================================================================
  // Temp File Management
  // ============================================================================

  /**
   * Create a temporary JSON file
   */
  private createTempJsonFile(data: TestTierData): string {
    const filename = `import-test-${Date.now()}.json`;
    const filepath = path.join("/tmp", filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    this.tempFiles.push(filepath);
    return filepath;
  }

  /**
   * Create a temporary CSV file
   */
  private createTempCsvFile(content: string): string {
    const filename = `import-test-${Date.now()}.csv`;
    const filepath = path.join("/tmp", filename);
    fs.writeFileSync(filepath, content);
    this.tempFiles.push(filepath);
    return filepath;
  }

  /**
   * Create a temporary file with custom extension
   */
  private createTempFile(filename: string, content: string): string {
    const filepath = path.join("/tmp", `${Date.now()}-${filename}`);
    fs.writeFileSync(filepath, content);
    this.tempFiles.push(filepath);
    return filepath;
  }

  /**
   * Clean up temporary files
   */
  cleanup(): void {
    for (const filepath of this.tempFiles) {
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    this.tempFiles = [];
  }

  // ============================================================================
  // Verification Helpers
  // ============================================================================

  /**
   * Verify import was successful by navigating to board
   */
  async verifyImportSuccess(expectedItemTexts: string[]): Promise<boolean> {
    await this.navigateViaNav("Board");

    for (const text of expectedItemTexts) {
      const item = this.page.locator(`text=${text}`);
      if (!(await this.isVisible(item))) {
        return false;
      }
    }
    return true;
  }
}
