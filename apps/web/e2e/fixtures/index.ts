/**
 * Playwright Test Fixtures
 *
 * Central export for all custom fixtures used across E2E tests.
 * Provides extended test object with page objects and common utilities.
 */

import { test as base, expect as baseExpect, type Page } from "@playwright/test";
import { TierBoardPage } from "../pages/TierBoardPage";
import { HeadToHeadPage } from "../pages/HeadToHeadPage";
import { ThemesPage } from "../pages/ThemesPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { ImportExportPage } from "../pages/ImportExportPage";
import { TemplatesPage } from "../pages/TemplatesPage";
import { TestDataFactory, type TestItem, type TestTierData } from "../utils/testDataFactory";

// ============================================================================
// Custom Fixture Types
// ============================================================================

export interface TiercadeFixtures {
  /** Page object for the Tier Board (main page) */
  tierBoardPage: TierBoardPage;
  /** Page object for Head-to-Head comparison page */
  headToHeadPage: HeadToHeadPage;
  /** Page object for Themes page */
  themesPage: ThemesPage;
  /** Page object for Analytics page */
  analyticsPage: AnalyticsPage;
  /** Page object for Import/Export page */
  importExportPage: ImportExportPage;
  /** Page object for Templates page */
  templatesPage: TemplatesPage;
  /** Factory for generating test data */
  testDataFactory: TestDataFactory;
  /** Helper to load test data via import */
  loadTestData: (data: TestTierData) => Promise<void>;
}

// ============================================================================
// Extended Test with Fixtures
// ============================================================================

export const test = base.extend<TiercadeFixtures>({
  // Create fresh browser context for each test to ensure complete isolation
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      // Clear all storage for fresh state
      storageState: undefined,
    });
    await use(context);
    await context.close();
  },

  page: async ({ context, baseURL }, use) => {
    const page = await context.newPage();
    // Clear storage ONCE at start of test (not on every navigation)
    // This ensures test isolation while allowing data to persist during a test
    // Navigate to base URL to have access to localStorage for that origin
    await page.goto(baseURL || "http://localhost:5173");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await use(page);
  },

  tierBoardPage: async ({ page }, use) => {
    const tierBoardPage = new TierBoardPage(page);
    await use(tierBoardPage);
  },

  headToHeadPage: async ({ page }, use) => {
    const headToHeadPage = new HeadToHeadPage(page);
    await use(headToHeadPage);
  },

  themesPage: async ({ page }, use) => {
    const themesPage = new ThemesPage(page);
    await use(themesPage);
  },

  analyticsPage: async ({ page }, use) => {
    const analyticsPage = new AnalyticsPage(page);
    await use(analyticsPage);
  },

  importExportPage: async ({ page }, use) => {
    const importExportPage = new ImportExportPage(page);
    await use(importExportPage);
  },

  templatesPage: async ({ page }, use) => {
    const templatesPage = new TemplatesPage(page);
    await use(templatesPage);
  },

  testDataFactory: async ({}, use) => {
    const factory = new TestDataFactory();
    await use(factory);
    // Cleanup temp files on teardown
    factory.cleanup();
  },

  loadTestData: async ({ importExportPage }, use) => {
    const loader = async (data: TestTierData) => {
      await importExportPage.goto();
      await importExportPage.importJson(data);
    };
    await use(loader);
  },
});

export { baseExpect as expect };
export type { Page, TestItem, TestTierData };
