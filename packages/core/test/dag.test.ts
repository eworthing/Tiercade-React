/**
 * DAG (Directed Acyclic Graph) import enforcement.
 *
 * Encodes the monorepo layering rules from CLAUDE.md:
 *   packages/theme  — no @tiercade deps
 *   packages/core   — no @tiercade deps
 *   packages/state  — depends on @tiercade/core only
 *   packages/ui     — depends on @tiercade/core, @tiercade/theme only (NOT state)
 *   apps/*          — leaves; may depend on packages/*
 *
 * Within apps/web/src:
 *   utils/    — must not import from hooks/, components/, pages/
 *   hooks/    — must not import from pages/
 *   components/ — must not import from pages/ or hooks/
 *   pages/    — leaf layer (may import from all below)
 *
 * To confirm this test catches violations:
 *   Add `import { createSlice } from "@tiercade/state";` to any file in
 *   packages/core/src/ and re-run — the test will fail with the offending path.
 */

import * as fs from "fs";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../../..");

/** Recursively collect .ts/.tsx files under dir, excluding node_modules and test dirs. */
function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  function walk(d: string): void {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "test" || entry.name === "__tests__") continue;
        walk(path.join(d, entry.name));
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        files.push(path.join(d, entry.name));
      }
    }
  }
  walk(dir);
  return files;
}

/**
 * Returns all import specifiers found in a file.
 * Matches: import ... from "specifier" and import ... from 'specifier'
 * Also catches: require("specifier") for any CJS usage.
 */
function importSpecifiers(filePath: string): string[] {
  const src = fs.readFileSync(filePath, "utf8");
  const specifiers: string[] = [];
  // ES module imports
  for (const m of src.matchAll(/from\s+["']([^"']+)["']/g)) {
    specifiers.push(m[1]);
  }
  // Dynamic import() and require()
  for (const m of src.matchAll(/(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    specifiers.push(m[1]);
  }
  return specifiers;
}

/**
 * Assert that no file in `dir` imports any specifier matching the forbidden patterns.
 * Returns a list of violations as human-readable strings.
 */
function collectViolations(
  dir: string,
  forbidden: RegExp[]
): string[] {
  const violations: string[] = [];
  for (const file of collectSourceFiles(dir)) {
    const relFile = path.relative(REPO_ROOT, file);
    for (const specifier of importSpecifiers(file)) {
      for (const rule of forbidden) {
        if (rule.test(specifier)) {
          violations.push(`${relFile} imports "${specifier}" (rule: ${rule})`);
        }
      }
    }
  }
  return violations;
}

// ── Cross-package layer rules ──────────────────────────────────────────────

describe("DAG: packages/core — no upstream @tiercade deps", () => {
  it("must not import from @tiercade/state, @tiercade/ui, @tiercade/theme", () => {
    const violations = collectViolations(
      path.join(REPO_ROOT, "packages/core/src"),
      [/^@tiercade\/(state|ui|theme)$/]
    );
    expect(violations).toEqual([]);
  });
});

describe("DAG: packages/state — no ui or theme @tiercade deps", () => {
  it("must not import from @tiercade/ui or @tiercade/theme", () => {
    const violations = collectViolations(
      path.join(REPO_ROOT, "packages/state/src"),
      [/^@tiercade\/(ui|theme)$/]
    );
    expect(violations).toEqual([]);
  });
});

describe("DAG: packages/ui — no state @tiercade dep", () => {
  it("must not import from @tiercade/state", () => {
    const violations = collectViolations(
      path.join(REPO_ROOT, "packages/ui/src"),
      [/^@tiercade\/state$/]
    );
    expect(violations).toEqual([]);
  });
});

describe("DAG: packages/theme — no @tiercade deps", () => {
  it("must not import from any @tiercade package", () => {
    const themeDir = path.join(REPO_ROOT, "packages/theme");
    // theme has no src/ subdirectory — files are at the package root
    const violations: string[] = [];
    for (const file of collectSourceFiles(themeDir)) {
      const relFile = path.relative(REPO_ROOT, file);
      for (const specifier of importSpecifiers(file)) {
        if (/^@tiercade\//.test(specifier)) {
          violations.push(`${relFile} imports "${specifier}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

// ── Within-app layer rules (apps/web/src) ─────────────────────────────────
//
// Layer order (each layer may import from layers below, not above):
//   utils/      — no higher-layer deps
//   hooks/      — may use utils; must NOT import from components/ or pages/
//   components/ — may use hooks and utils; must NOT import from pages/
//   pages/      — leaf; may import from all layers below
//
// Note: components importing hooks (useAppDispatch, useAppSelector, etc.) is
// idiomatic React. Hooks are MORE primitive than components in React's model.

describe("DAG: apps/web/src — within-app layer ordering", () => {
  const webSrc = path.join(REPO_ROOT, "apps/web/src");

  it("utils/ must not import from hooks/, components/, or pages/", () => {
    const violations = collectViolations(
      path.join(webSrc, "utils"),
      [/[./]hooks\//, /[./]components\//, /[./]pages\//]
    );
    expect(violations).toEqual([]);
  });

  it("hooks/ must not import from components/ or pages/", () => {
    const violations = collectViolations(
      path.join(webSrc, "hooks"),
      [/[./]components\//, /[./]pages\//]
    );
    expect(violations).toEqual([]);
  });

  it("components/ must not import from pages/", () => {
    const violations = collectViolations(
      path.join(webSrc, "components"),
      [/[./]pages\//]
    );
    expect(violations).toEqual([]);
  });
});
