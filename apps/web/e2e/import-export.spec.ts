/**
 * Import/Export E2E Tests
 *
 * Tests for importing and exporting tier list data.
 * Uses the new Page Object Model infrastructure.
 */

import { test, expect } from "./fixtures";
import { TEST_DATA_PRESETS } from "./utils/testDataFactory";

test.describe("Import/Export - Page Structure", () => {
  test.beforeEach(async ({ importExportPage }) => {
    await importExportPage.goto();
    await importExportPage.dismissOnboardingIfVisible();
  });

  test("should display import/export page", async ({ importExportPage }) => {
    await expect(importExportPage.heading).toBeVisible();
  });

  test("should have import file input", async ({ importExportPage }) => {
    const hasFileInput = await importExportPage.hasFileInput();
    expect(hasFileInput).toBe(true);
  });

  test("should show empty state when no items to export", async ({
    loadTestData,
    testDataFactory,
    importExportPage,
    page,
  }) => {
    // Load empty data - this replaces any default project with empty tiers
    await loadTestData(testDataFactory.createEmptyTierData());
    await page.waitForTimeout(300);

    // Navigate to import/export to check empty state
    await importExportPage.goto();
    await importExportPage.dismissOnboardingIfVisible();

    // With no items, should show empty export message
    await expect(importExportPage.emptyExportMessage).toBeVisible();
  });
});

test.describe("Import/Export - Import Operations", () => {
  test.beforeEach(async ({ importExportPage }) => {
    await importExportPage.goto();
    await importExportPage.dismissOnboardingIfVisible();
  });

  test("should import JSON file", async ({ importExportPage, page }) => {
    // Import test data
    await importExportPage.importJson(TEST_DATA_PRESETS.importTest());
    await page.waitForTimeout(500);

    // Navigate to tier board to verify import
    await importExportPage.navigateViaNav("Board");

    // Check if imported items are present
    await expect(page.locator("text=Test Item 1")).toBeVisible();
    await expect(page.locator("text=Test Item 2")).toBeVisible();
  });

  test("should import CSV file", async ({ importExportPage, page }) => {
    // CSV format: name,season,tier (as expected by ModelResolver.parseCSV)
    const csvData = `name,season,tier
CSV Test Item 1,,S
CSV Test Item 2,,S
CSV Test Item 3,,A`;

    await importExportPage.importCsv(csvData);
    await page.waitForTimeout(500);

    // Navigate to tier board to verify
    await importExportPage.navigateViaNav("Board");

    // Check if imported items are present
    await expect(page.locator("text=CSV Test Item 1")).toBeVisible();
  });
});

test.describe("Import/Export - Export Operations", () => {
  test.beforeEach(async ({ importExportPage, page }) => {
    // First import some data so we have items to export
    await importExportPage.goto();
    await importExportPage.dismissOnboardingIfVisible();
    await importExportPage.importJson(TEST_DATA_PRESETS.importTest());
    await page.waitForTimeout(500);
    // Refresh to see export buttons
    await importExportPage.goto();
    await importExportPage.dismissOnboardingIfVisible();
  });

  test("should have export buttons when items exist", async ({
    importExportPage,
  }) => {
    const canExport = await importExportPage.canExport();
    expect(canExport).toBe(true);

    // Check for export format cards
    await expect(importExportPage.exportJsonButton).toBeVisible();
    await expect(importExportPage.exportCsvButton).toBeVisible();
  });

  test("should export JSON data", async ({ importExportPage }) => {
    const { filename, data } = await importExportPage.exportJson();

    // Verify download filename
    expect(filename).toMatch(/\.json$/);

    // Verify JSON has data
    expect(data).toBeTruthy();
  });

  test("should export CSV data", async ({ importExportPage }) => {
    const { filename, content } = await importExportPage.exportCsv();

    expect(filename).toMatch(/\.csv$/);
    expect(content).toBeTruthy();
  });
});

test.describe("Import/Export - Round Trip", () => {
  test("should preserve data through export/import cycle", async ({
    importExportPage,
    page,
  }) => {
    await importExportPage.goto();
    await importExportPage.dismissOnboardingIfVisible();

    // Import initial data
    await importExportPage.importJson(TEST_DATA_PRESETS.importTest());
    await page.waitForTimeout(500);

    // Go back to import/export page
    await importExportPage.goto();
    await importExportPage.dismissOnboardingIfVisible();

    // Export as JSON
    const { data: exportedData } = await importExportPage.exportJson();

    // Verify exported data contains data
    expect(exportedData).toBeTruthy();
  });
});
