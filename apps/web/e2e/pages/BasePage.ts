/**
 * Base Page Object
 *
 * Abstract base class for all page objects providing common functionality.
 * All page objects extend this class to ensure consistent patterns.
 */

import type { Page, Locator } from "@playwright/test";

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ============================================================================
  // Onboarding Wizard Handling
  // ============================================================================

  /**
   * Get the onboarding wizard overlay
   */
  get onboardingWizard(): Locator {
    return this.page.locator(".fixed.inset-0.z-50").filter({ hasText: "Welcome to Tiercade" });
  }

  /**
   * Get the skip button in the onboarding wizard
   */
  get onboardingSkipButton(): Locator {
    return this.page.locator('button:has-text("Skip")');
  }

  /**
   * Dismiss the onboarding wizard if it's visible
   */
  async dismissOnboardingIfVisible(): Promise<void> {
    try {
      // Wait briefly to see if onboarding appears
      await this.page.waitForTimeout(500);

      // Check for the overlay first
      const overlay = this.page.locator(".fixed.inset-0.z-50");
      const overlayCount = await overlay.count();

      if (overlayCount > 0) {
        // Try skip button first
        const skipButton = this.page.locator('button:has-text("Skip")');
        if (await skipButton.isVisible({ timeout: 500 })) {
          await skipButton.click();
          await this.page.waitForTimeout(300);
          return;
        }

        // Fallback to escape key
        await this.page.keyboard.press("Escape");
        await this.page.waitForTimeout(300);
      }
    } catch {
      // Onboarding not present or already dismissed
    }
  }

  /**
   * Press Escape to dismiss onboarding (keyboard shortcut)
   */
  async dismissOnboardingWithEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await this.waitForAnimation();
  }

  // ============================================================================
  // Abstract Properties - Must be implemented by subclasses
  // ============================================================================

  /** The URL path for this page */
  abstract readonly path: string;

  // ============================================================================
  // Navigation
  // ============================================================================

  /**
   * Navigate to this page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  /**
   * Navigate to a specific path
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Get the current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  // ============================================================================
  // Common Navigation Elements
  // ============================================================================

  /**
   * Get the navigation link by name (uses first match for mobile/desktop nav)
   */
  getNavLink(name: string): Locator {
    return this.page.locator(`nav a:has-text("${name}")`).first();
  }

  /**
   * Navigate using the main navigation
   */
  async navigateViaNav(linkText: string): Promise<void> {
    const link = this.getNavLink(linkText);
    await link.waitFor({ state: "visible", timeout: 3000 });
    await link.click();
  }

  /**
   * Get the undo button (icon button with aria-label)
   */
  get undoButton(): Locator {
    return this.page.locator('button[aria-label*="Undo"], button[label*="Undo"]');
  }

  /**
   * Get the redo button (icon button with aria-label)
   */
  get redoButton(): Locator {
    return this.page.locator('button[aria-label*="Redo"], button[label*="Redo"]');
  }

  /**
   * Click undo
   */
  async undo(): Promise<void> {
    await this.undoButton.click();
  }

  /**
   * Click redo
   */
  async redo(): Promise<void> {
    await this.redoButton.click();
  }

  // ============================================================================
  // Common Locator Patterns
  // ============================================================================

  /**
   * Get element by data-testid
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  /**
   * Get elements by data-testid prefix
   */
  getByTestIdPrefix(prefix: string): Locator {
    return this.page.locator(`[data-testid^="${prefix}"]`);
  }

  /**
   * Get element by role
   */
  getByRole(role: string): Locator {
    return this.page.locator(`[role="${role}"]`);
  }

  /**
   * Get element containing text
   */
  getByText(text: string | RegExp): Locator {
    return this.page.locator(`text=${text}`);
  }

  /**
   * Get the page heading (h1 or h2)
   */
  get pageHeading(): Locator {
    return this.page.locator("h1, h2").first();
  }

  // ============================================================================
  // Waiting Utilities
  // ============================================================================

  /**
   * Wait for a short animation/transition to complete
   */
  async waitForAnimation(): Promise<void> {
    await this.page.waitForTimeout(300);
  }

  /**
   * Wait for content to stabilize after data changes
   */
  async waitForContentUpdate(): Promise<void> {
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(locator: Locator, timeout = 3000): Promise<void> {
    await locator.waitFor({ state: "visible", timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(locator: Locator, timeout = 3000): Promise<void> {
    await locator.waitFor({ state: "hidden", timeout });
  }

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  /**
   * Press a keyboard shortcut with modifier
   */
  async pressShortcut(
    key: string,
    modifiers: Array<"Meta" | "Control" | "Shift" | "Alt"> = []
  ): Promise<void> {
    const shortcut = [...modifiers, key].join("+");
    await this.page.keyboard.press(shortcut);
  }

  /**
   * Press Cmd/Ctrl + key (platform-aware)
   */
  async pressCommand(key: string): Promise<void> {
    await this.pressShortcut(key, ["Meta"]);
  }

  /**
   * Press Cmd/Ctrl + Shift + key (platform-aware)
   */
  async pressCommandShift(key: string): Promise<void> {
    await this.pressShortcut(key, ["Meta", "Shift"]);
  }

  // ============================================================================
  // Assertions Helpers
  // ============================================================================

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: "visible", timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get element count
   */
  async getCount(locator: Locator): Promise<number> {
    return locator.count();
  }

  /**
   * Get text content of element
   */
  async getText(locator: Locator): Promise<string | null> {
    return locator.textContent();
  }

  /**
   * Get attribute value
   */
  async getAttribute(locator: Locator, name: string): Promise<string | null> {
    return locator.getAttribute(name);
  }

  // ============================================================================
  // Screenshot Utilities
  // ============================================================================

  /**
   * Take a screenshot of the page
   */
  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
