import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("Import/Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/import-export");
  });

  test("should display import/export page", async ({ page }) => {
    // Check page loaded
    await expect(
      page.locator("h1:has-text('Import/Export'), h2:has-text('Import/Export')")
    ).toBeVisible();
  });

  test("should have export buttons for different formats", async ({ page }) => {
    // Check for export format buttons
    await expect(
      page.locator('button:has-text("JSON"), button:has-text("Export JSON")')
    ).toBeVisible();

    await expect(
      page.locator('button:has-text("CSV"), button:has-text("Export CSV")')
    ).toBeVisible();

    await expect(
      page.locator(
        'button:has-text("Markdown"), button:has-text("Export Markdown")'
      )
    ).toBeVisible();

    await expect(
      page.locator('button:has-text("Text"), button:has-text("Export Text")')
    ).toBeVisible();
  });

  test("should export JSON data", async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export JSON button
    await page.click(
      'button:has-text("JSON"), button:has-text("Export JSON")'
    );

    // Wait for download
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/tier-list.*\.json/);

    // Save and verify content
    const downloadPath = await download.path();
    if (downloadPath) {
      const content = fs.readFileSync(downloadPath, "utf-8");
      const data = JSON.parse(content);

      // Verify JSON structure
      expect(data).toHaveProperty("tiers");
      expect(data).toHaveProperty("tierOrder");
    }
  });

  test("should export CSV data", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");

    await page.click('button:has-text("CSV"), button:has-text("Export CSV")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/tier-list.*\.csv/);
  });

  test("should have import file input", async ({ page }) => {
    // Check for file input or import button
    const fileInput = page.locator('input[type="file"]');
    const importButton = page.locator(
      'button:has-text("Import"), button:has-text("Choose File")'
    );

    // Either file input or button should be visible
    const hasFileInput = (await fileInput.count()) > 0;
    const hasImportButton = (await importButton.count()) > 0;

    expect(hasFileInput || hasImportButton).toBe(true);
  });

  test("should import JSON file", async ({ page }) => {
    // Create a test JSON file
    const testData = {
      tiers: {
        S: [
          { id: "test-1", attributes: { name: "Test Item 1" } },
          { id: "test-2", attributes: { name: "Test Item 2" } },
        ],
        A: [],
        B: [],
        C: [],
        D: [],
        F: [],
        unranked: [],
      },
      tierOrder: ["S", "A", "B", "C", "D", "F"],
    };

    const tempFile = path.join("/tmp", "test-tier-list.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    // Find file input
    const fileInput = page.locator('input[type="file"]');

    // Upload file
    await fileInput.setInputFiles(tempFile);

    // Wait for import to process
    await page.waitForTimeout(500);

    // Navigate to tier board to verify import
    await page.click('a:has-text("Board")');

    // Check if imported items are present
    await expect(page.locator('text=Test Item 1')).toBeVisible();
    await expect(page.locator('text=Test Item 2')).toBeVisible();

    // Clean up
    fs.unlinkSync(tempFile);
  });

  test("should import CSV file", async ({ page }) => {
    // Create a test CSV file
    const csvData = `tier,id,name
S,csv-1,CSV Test Item 1
S,csv-2,CSV Test Item 2
A,csv-3,CSV Test Item 3`;

    const tempFile = path.join("/tmp", "test-tier-list.csv");
    fs.writeFileSync(tempFile, csvData);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);
    await page.waitForTimeout(500);

    // Navigate to tier board to verify
    await page.click('a:has-text("Board")');

    // Check if imported items are present
    await expect(page.locator('text=CSV Test Item 1')).toBeVisible();
    await expect(page.locator('text=CSV Test Item 2')).toBeVisible();
    await expect(page.locator('text=CSV Test Item 3')).toBeVisible();

    // Clean up
    fs.unlinkSync(tempFile);
  });

  test("should show error for invalid file format", async ({ page }) => {
    // Create an invalid file
    const invalidData = "This is not valid JSON or CSV";
    const tempFile = path.join("/tmp", "invalid-file.txt");
    fs.writeFileSync(tempFile, invalidData);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);
    await page.waitForTimeout(500);

    // Should show an error message
    const errorMessage = page.locator(
      'text=/error|invalid|failed/i, [role="alert"]'
    );
    await expect(errorMessage).toBeVisible();

    // Clean up
    fs.unlinkSync(tempFile);
  });
});
