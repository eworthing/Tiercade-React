### Discovery (first loop only)
- Source roots: `packages/core/src/`, `packages/state/src/`, `packages/ui/src/`, `packages/theme/src/`, `apps/web/src/`, `apps/native/src/`
- Test command: `npm run test:core && npm run test:state && npm run test:ui` (at repo root)
- Build command: `cd apps/web && npm run build` (production); `cd apps/native && npx expo prebuild` (native)
- ADRs found: none (no `docs/adr/` directory)
- Domain terms (CONTEXT.md): none (no CONTEXT.md present; domain vocabulary derived from `AGENTS.md`: `Item`, `Items`, `TierConfig`, `tierOrder`, `unranked`, `HeadToHeadLogic`, `modelResolver`)
- Selected lens: Generic (Node section). React 19 + TypeScript + RTK 2.x + Vite + Jest.
- Provider: `claude_code`; loop_model: `claude-sonnet-4-6`; reviewer_model: `claude-sonnet-4-6`; spawn_isolation: `subagent`.
- Loop cap: 10 (default).
- Working tree: clean at Step 0.
- Test scope: full (no `--test-filter` set).

### Loop Counter
Loop 5 of 10 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Build is globally green for the first time: 17 suites, 84 tests, all passing (`npm run test:core && npm run test:state && npm run test:ui`). Loop 5 fixed the last failing test — `packages/state/test/importJSON.test.ts` used a stale legacy `{tiers/tierOrder}` fixture that never matched `ModelResolver.decodeProject`'s schema; the fixture was updated to use the current `Project` schema. First structural review is now possible. The monorepo package architecture is architecturally sound and the `@tiercade/core` domain layer is genuinely framework-free with strong test coverage. The main weaknesses are: `TierBoardPage.tsx` at 757 LOC concentrating too many concerns; `packages/state` unit tests are thin (4 suites, 10 tests vs 11 suites, 69 in `packages/core`); `persistenceMiddleware` writes `localStorage` at module-load time in tests (causing visible test-environment leaks); and undo/redo thunks — the most complex stateful behavior — have zero direct tests.

## Scorecard (1-10)
- Architecture quality: 6 | UP | Monorepo DAG enforced: `packages/core/src/index.ts` (no React imports); `packages/state` only imports from `@tiercade/core`; `apps/web` imports from both. But `apps/web/src/pages/TierBoardPage.tsx:757 LOC` conflates drag-drop, import/export, URL sharing, presentation activation, keyboard shortcuts, and item modals in one view module. `persistenceMiddleware.ts:40` writes `localStorage` directly at module-load time (no ambient guard), leaking into test environment.
- State management and runtime ownership: 6 | UP | RTK slices give one clear owner per slice (`tierSlice`, `headToHeadSlice`, `themeSlice`, `undoRedoSlice`, `onboardingSlice`, `presentationSlice`). Memoized selectors in `packages/state/src/selectors.ts` cover all derived state. But `persistenceMiddleware.ts:9` has a module-level `let saveTimeout` singleton — shared mutable state outside Redux. `undoRedoThunks.ts:22-56` crosses two slices (`undoRedoSlice` + `tierSlice`) with no integration tests.
- Domain modeling: 6 | UP | `packages/core/src/models.ts:6` — `Item` interface type is well-structured with optional fields for media variants. `AttributeType` enum discriminates attribute types. `Project` schema in `packages/core/src/project.ts:108` is typed end-to-end. Gap: `Item.name?: string` (optional) despite being the display title — empty-name items are representable without error. `ProjectItem.title: string` (required) does not align with `Item.name?: string` — a mapping gap.
- Data flow and dependency design: 6 | UP | Dependency graph is a DAG: `core` ← `state` ← `apps/*` enforced by workspace package.json. No circular dependencies detected. Effects flow through RTK thunks. Gap: `persistenceMiddleware.ts:63` calls `localStorage.getItem` via ambient reference — not injected, not guarded, untestable without DOM globals.
- Framework / platform best practices: 6 | UP | RTK 2.x slice/selector pattern used correctly. React lazy loading for code splitting in `apps/web/src/shell/AppShell.tsx:8-12`. `useCallback` and `useMemo` applied in TierBoardPage. Gap: `persistenceMiddleware.ts:40` accesses `localStorage.setItem` with no `typeof window` guard — breaks in test environment, shown by "ExperimentalWarning: localStorage is not available" emitted at every test run.
- Concurrency and runtime safety: 7 | UP | JavaScript single-threaded; no actor isolation concerns. No floating Promises in Redux logic — all thunks synchronous or properly awaited. Debounce in `persistenceMiddleware.ts:22-44` uses `clearTimeout`/`setTimeout` — correct pattern. Module-level `saveTimeout` singleton is acceptable in a production SPA but is a hazard if the store is recreated (e.g., in test with store re-import). No concurrent write hazards observed.
- Code simplicity and clarity: 5 | UP | `apps/web/src/pages/TierBoardPage.tsx:757 LOC` is the dominant simplicity failure — modal state, drag-drop handlers, URL sharing, export, keyboard shortcuts, presentation mode, and item management all in one component. `apps/web/src/pages/ImportExportPage.tsx:438 LOC` and `HeadToHeadPage.tsx:378 LOC` also over-concentrate. `packages/core/src/modelResolver.ts` has clean public interface with private helpers. The god-component pattern in TierBoardPage fails the shallow-module test: deleting it redistributes much complexity across callers.
- Test strategy and regression resistance: 5 | UP | `packages/core` well-tested: 11 suites, 69 tests, covering pure functions (`tierLogic`, `analytics`, `headToHead`, `modelResolver`, `sorting`, `formatters`). `packages/state` thin: 4 suites, 10 tests. `undoRedoThunks.ts` (most complex multi-slice behavior) has zero tests. `persistenceMiddleware.ts` has zero tests. `presentationSlice.ts` and `onboardingSlice.ts` have zero tests. E2E suite (8 spec files in `apps/web/e2e/`) covers main user flows but does not substitute for state-unit test gaps.
- Overall implementation credibility: 5 | UP | `packages/core` domain layer is solid and deeply tested. RTK slice ownership is honest. Package DAG is enforced. Credibility gap: the visible test environment leaks from `persistenceMiddleware` (printed on every `npm run test:state` run) signal an un-seamed ambient dependency. The 3:1 test-depth imbalance between `core` (69 tests) and `state` (10 tests) on a stateful module package is a credibility concern.

## Authority Map

### Tier state (`tiers`, `tierOrder`, `tierLabels`, `tierColors`, `selection`, `projectName`)
- **Owner:** `tierSlice` (`packages/state/src/tierSlice.ts`)
- **Allowed writers:** `loadProject`, `setTiers`, `setTierOrder`, `addItemToTier`, `moveItemBetweenTiers`, `moveItemsBetweenTiers`, `deleteItems`, `updateItem`, `setTierLabels`, `setTierColors` — all actions on `tierSlice`; also `performUndo`/`performRedo` thunks dispatch `setTiers`/`setTierOrder`.
- **Observers / readers:** `selectTiers`, `selectTierOrder`, etc. via `selectors.ts`
- **Persistence seam:** `persistenceMiddleware` writes `state.tier` to `localStorage` after every action (debounced 500ms).
- **Async mutation entry points:** `loadDefaultProject` thunk (async dynamic import); `importJSON` / `importCSV` thunks (sync dispatch).
- **Verdict:** Single and clear

### Undo/redo history (`past`, `future`, `maxHistorySize`)
- **Owner:** `undoRedoSlice` (`packages/state/src/undoRedoSlice.ts`)
- **Allowed writers:** `pushHistory` (via `captureSnapshot` thunk), `undoAction`, `redoAction`, `clearHistory`.
- **Observers / readers:** `selectCanUndo`, `selectCanRedo`, `selectLastActionName`
- **Persistence seam:** persisted via `persistenceMiddleware` to `localStorage` (trimmed to 20 entries).
- **Async mutation entry points:** none (all sync).
- **Verdict:** Single and clear

### Head-to-head session
- **Owner:** `headToHeadSlice` (`packages/state/src/headToHeadSlice.ts`)
- **Allowed writers:** multiple actions on `headToHeadSlice`; `headToHeadThunks`.
- **Observers / readers:** multiple selectors.
- **Persistence seam:** not persisted (by design per `persistenceMiddleware.ts:35` comment).
- **Async mutation entry points:** none.
- **Verdict:** Single and clear

### Persistence side effect (ambient `localStorage`)
- **Owner:** `persistenceMiddleware` — module-level singleton, not a Redux slice.
- **Allowed writers:** every dispatched action triggers the debounce.
- **Observers / readers:** `loadPersistedState` at store init; `clearPersistedState` on demand.
- **Persistence seam:** none — IS the persistence seam; calls `localStorage` directly without injection.
- **Async mutation entry points:** debounce timer, module-global `saveTimeout` (`persistenceMiddleware.ts:9`).
- **Verdict:** Split and ambiguous (no test seam; ambient access causes test-environment leaks)

## Strengths That Matter
- `packages/core` domain layer is genuinely framework-free — no React imports in `packages/core/src/`; domain logic tested with 11 suites, 69 tests covering pure functions end-to-end.
- RTK slice ownership is one clear writer per concern per slice; `selectors.ts` provides memoized derived state covering all 6 slices.
- Monorepo DAG is enforced by workspace package.json: no circular dependencies; `core` imports nothing from `state` or `apps`.
- E2E suite (8 spec files) provides feature-level regression coverage: tier-board, H2H, analytics, themes, import/export, keyboard accessibility, batch operations.
- `HeadToHeadLogic` (Wilson score, two-phase algorithm, adaptive budget) is deeply implemented and tested in `packages/core/test/headToHead.test.ts` and `headToHeadInternals.test.ts`.

## Findings

### Finding #1: `persistenceMiddleware` writes ambient `localStorage` without injection — untestable seam

**Why it matters** — The persistence module calls `localStorage.getItem`/`setItem` at import time and on every action without any DOM guard or injected interface, causing test-environment warnings on every `npm run test:state` run and making the persistence behavior untestable.

**What is wrong** — `persistenceMiddleware.ts:63` calls `localStorage.getItem(STORAGE_KEY)` at store initialization (synchronously, at module load in tests). `persistenceMiddleware.ts:40` calls `localStorage.setItem(...)` inside a debounce timer that fires 500ms after any dispatched action. Both are bare `localStorage` references with no `typeof window === 'undefined'` guard and no injected dependency. The test output shows "ExperimentalWarning: localStorage is not available" and "Cannot log after tests are done" (the debounce timer fires after test teardown).

**Evidence** —
- `packages/state/src/persistenceMiddleware.ts:63` — `localStorage.getItem(STORAGE_KEY)` called from `loadPersistedState()` which is called at `store.ts:21` (module evaluation).
- `packages/state/src/persistenceMiddleware.ts:40` — `localStorage.setItem(...)` in debounce `setTimeout` fires after test assertions complete.
- Test output: "ExperimentalWarning: localStorage is not available because --localstorage-file was not provided." + "Cannot log after tests are done" printed on every `npm run test:state` run.

**Architectural test failed** — Two-adapter rule (one production impl, zero behavior-faithful test adapter)

**Dependency category** — `local-substitutable` (localStorage has local test stand-ins; the seam is missing)

**Leverage impact** — Callers must know that `persistenceMiddleware` depends on a global browser API — this is leaked into the test environment.

**Locality impact** — Persistence failure behavior (corrupted JSON, missing key, quota exceeded) is untestable; bugs there cannot be caught by the unit test suite.

**Metric signal, if any** — "ExperimentalWarning" + "Cannot log after tests are done" on every test run.

**Why this weakens submission** — A middleware that writes durable user state cannot be unit-tested; any regression in save/load behavior is invisible to CI until a user loses data.

**Severity** — Serious deduction

**ADR conflicts** — none

**Minimal correction path** — Add a `typeof localStorage !== 'undefined'` guard in `loadPersistedState` and `clearPersistedState`. In the middleware, guard `localStorage.setItem` with the same check. This keeps the fix contained and makes `test:state` warnings disappear without changing the production path. A full injection refactor (passing a `Storage` interface) would also satisfy the two-adapter rule but is heavier than needed for the guard-only fix.

**Blast radius** — Change: `packages/state/src/persistenceMiddleware.ts`. Avoid: `packages/state/src/store.ts`, `packages/state/test/` (no new tests required for the guard-only fix; injection approach would require a new adapter).

---

### Finding #2: `undoRedoThunks` — multi-slice behavior with zero direct tests

**Why it matters** — The undo/redo path reads `undoRedoSlice.past/future` and dispatches into `tierSlice` — it is the most complex cross-slice behavior in the state package and has zero unit tests. A regression here silently breaks a primary user-visible feature.

**What is wrong** — `undoRedoThunks.ts:22-56` (`performUndo`/`performRedo`) coordinates two slices: dispatches `undoAction()` (moves snapshot between `past`/`future` in `undoRedoSlice`), then reads the mutated state to restore `tiers`/`tierOrder` via `setTiers`/`setTierOrder` in `tierSlice`. The snapshot round-trip — push → undo → redo → state restored — is not tested anywhere in `packages/state/test/`. The `undoRedoSlice.test.ts` file does not exist.

**Evidence** —
- `packages/state/src/undoRedoThunks.ts:22-39` (`performUndo`), `packages/state/src/undoRedoThunks.ts:45-62` (`performRedo`).
- `find /Users/Shared/git/Tiercade-React/packages/state/test/ -name 'undoRedo*'` — zero results.
- `packages/state/test/` has 4 files: `headToHeadSlice.test.ts`, `importJSON.test.ts`, `themeSlice.test.ts`, `tierSlice.test.ts` — no undo/redo tests.

**Architectural test failed** — Interface-as-test-surface (the undo/redo thunk interface lacks tests)

**Dependency category** — `in-process`

**Leverage impact** — Without tests, every future change to `undoRedoThunks` or the snapshot path carries blind regression risk.

**Locality impact** — The bug surface for undo/redo is spread across two slice reducers and one thunk file — a tester cannot verify the round-trip without running it end-to-end.

**Metric signal, if any** — 0 tests for undo/redo in `packages/state/test/`.

**Why this weakens submission** — Undo/redo is a primary user feature. Absence of unit tests at the thunk interface means no CI protection against regressions introduced by future refactors.

**Severity** — Serious deduction

**ADR conflicts** — none

**Minimal correction path** — Add `packages/state/test/undoRedoThunks.test.ts`. Test: (1) `captureSnapshot` pushes a snapshot to `past`; (2) `performUndo` restores the prior state; (3) `performRedo` restores the undone state; (4) new action after undo clears `future`. Use a real `store` instance (same pattern as `importJSON.test.ts`).

**Blast radius** — Change: new file `packages/state/test/undoRedoThunks.test.ts`. Avoid: `packages/state/src/undoRedoThunks.ts` (no production code changes needed).

---

### Finding #3: `TierBoardPage.tsx` at 757 LOC — god-component fails shallow-module test

**Why it matters** — A 757-LOC React component that owns modal state, drag-drop handlers, URL sharing, export, keyboard shortcuts, presentation mode activation, and item management cannot be modified in one concern without risk to the others.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` contains: (1) 7 `useState` calls for modal/UI state (`showAddItem`, `showTierSettings`, `showKeyboardHelp`, `showStreamingPanel`, `editingItem`, `showCelebration`, `celebrationTier`); (2) 3 `useEffect` calls for theme init, project load, and URL share import; (3) custom hook usage (`useTierBoardKeyboard`, `useExport`, `usePresentationHandlers`); (4) inline drag-drop event handlers; (5) `useMemo` for tier colors/labels computation; (6) full render tree including `ItemModal`, `TierSettingsModal`, `BatchActionBar`, `TierBoard`, `SortFilterBar`. Shallow module test: removing this component's implementation detail (e.g., URL sharing) requires editing this one file — it's not modular, but complexity does not vanish when you imagine deleting the component.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-757` — LOC count confirmed.
- `apps/web/src/pages/TierBoardPage.tsx:101-113` — 7 `useState` declarations for independent concerns.
- `apps/web/src/pages/TierBoardPage.tsx:139-154` — URL sharing `useEffect` directly in TierBoardPage.

**Architectural test failed** — Shallow module (Interface ≈ Implementation — the component bundles too many responsibilities behind one React component identity)

**Dependency category** — `in-process`

**Leverage impact** — Every concern bundled into TierBoardPage must be understood to modify any one of them; callers (tests, reviewers) must learn too much.

**Locality impact** — Bug in URL sharing or export requires navigating 757 LOC of unrelated code.

**Metric signal, if any** — 757 LOC vs. 95 LOC for `ThemesPage.tsx` (simplest page); ratio 8:1 suggests severe imbalance.

**Why this weakens submission** — Tests at the `TierBoardPage` surface are impractical at this size; E2E tests substitute but provide no unit-level regression coverage for individual behaviors.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Extract URL-sharing import logic from the `useEffect` at line 139-154 into a custom hook `useShareImport` (co-locate with `urlSharing.ts`). That is the smallest, most isolated extraction — one behavior, ~15 lines, low blast radius. Do not attempt to split all 7 modals in one loop.

**Blast radius** — Change: `apps/web/src/pages/TierBoardPage.tsx` (remove the URL-share `useEffect` block), new file `apps/web/src/hooks/useShareImport.ts`. Avoid: `apps/web/src/utils/urlSharing.ts` (public API unchanged), any other page.

## Simplification Check
- Structurally necessary: Guarding `localStorage` in `persistenceMiddleware` — passes Deletion test on the ambient dependency (deleting the bare call; complexity (the guard) reappears only at the call site, not across N callers).
- New seam justified: no new seam for the guard-only fix. A Storage interface injection would satisfy Two-adapter rule but is heavier than the smallest honest fix.
- Helpful simplification: undo/redo tests add zero ceremony — pure behavioral assertion at the thunk interface.
- Should NOT be done: introduce a full `Storage` port with two adapters as Priority 1 — overshoots the smallest honest fix for the persistence finding.
- Tests after fix: no test deletions; add `undoRedoThunks.test.ts` at the thunk interface.

## Improvement Backlog

### Priority 1: Add `localStorage` guard to `persistenceMiddleware` — clear test-environment leaks
- Why it matters: Every `npm run test:state` run emits visible warnings from bare `localStorage` access at module load time; the save debounce fires after test teardown. These are not cosmetic — they signal a real untestable production dependency.
- Score impact: Framework idioms +0.5; Test strategy +0.5; Overall credibility +0.5
- Kind: structural (local-substitutable seam without guard)
- Rank: needed for winning

### Priority 2: Add `undoRedoThunks.test.ts` — cover multi-slice undo/redo round-trip
- Why it matters: The primary undo/redo path crosses two slices with zero unit test coverage; a regression here breaks a primary user feature invisibly to CI.
- Score impact: Test strategy +1.0; Overall credibility +0.5
- Kind: structural (missing test at the thunk interface)
- Rank: needed for winning

### Priority 3: Extract `useShareImport` from `TierBoardPage` — reduce god-component scope
- Why it matters: Smallest concrete step to decompose the 757-LOC TierBoardPage; URL sharing import is a self-contained behavior with no dependencies on other page state.
- Score impact: Code simplicity +0.5; Architecture quality +0.5
- Kind: simplification
- Rank: helpful

## Deepening Candidates

### `persistenceMiddleware` — inject Storage interface for test isolation
- Source friction proven: F1 (test-environment leaks from ambient `localStorage`)
- Why shallow or misplaced: The middleware calls `localStorage` directly — the dependency is not threaded through any interface, making failure path testing (quota exceeded, corrupted JSON, SSR) impossible.
- Behavior to move behind deeper interface: `getItem`, `setItem`, `removeItem` calls in `persistenceMiddleware.ts`.
- Dependency category: `local-substitutable` (in-memory `Storage` stand-in runs in tests with no network)
- Test surface after change: `persistenceMiddleware.test.ts` asserts save/load/clear behavior against an in-memory `Storage` stub.
- Smallest first step: Add `typeof localStorage !== 'undefined'` guard (Priority 1); injection refactor is next-loop work.
- What not to do: Do not introduce a new `StoragePort` protocol with one prod adapter today — that is heavier than the guard-only fix needed to clear Priority 1.

## Builder Notes
1. **Pattern** — Ambient browser globals in middleware. **How to recognize** — Test output shows "ExperimentalWarning: localStorage is not available" or "Cannot read properties of undefined (reading 'getItem')". The `window` or `localStorage` object is accessed at module evaluation time (not inside a user gesture handler), making it fire before the test environment sets up globals. **Smallest coding rule** — Always guard `localStorage`/`sessionStorage` access with `typeof localStorage !== 'undefined'` before use, or inject the Storage interface so tests can pass a stub. **Stack example** — `persistenceMiddleware.ts:63`: `const saved = localStorage.getItem(STORAGE_KEY)` should be `const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null`.
2. **Pattern** — Cross-slice thunks with no integration test. **How to recognize** — A thunk file dispatches to two different slice reducers (e.g., `undoAction()` into `undoRedoSlice` then `setTiers()` into `tierSlice`). If the test suite has coverage for each slice independently but no test that exercises the combined round-trip, the cross-slice coordination is in a test gap. **Smallest coding rule** — For every thunk that spans ≥2 slices, add one integration test using a real store instance that asserts the final state across both slices after dispatch. **Stack example** — `undoRedoThunks.ts:captureSnapshot → performUndo → performRedo`: each action dispatches into a different slice; a test should check `state.undoRedo.past`, `state.undoRedo.future`, AND `state.tier.tiers` after each call.
3. **Pattern** — God-page-component. **How to recognize** — A React page component over ~300 LOC with 5+ `useState` calls for independent concerns and 3+ `useEffect` calls. Each modal/behavior that could be lifted into its own hook is a candidate. **Smallest coding rule** — Each self-contained behavior (URL sharing on mount, keyboard shortcuts, export, presentation) becomes one custom hook named `use<Behavior>`. The page component becomes a coordinator of hooks and a single JSX tree; all imperative logic lives in hooks. **Stack example** — `TierBoardPage.tsx:139-154` (URL share import `useEffect`) has no local state dependencies — it only calls `dispatch` and URL utilities. Extracting it to `useShareImport()` costs ~15 lines and zero blast radius.

## Final Judge Narrative
Good app, place but not win in current state. Five loops to reach green baseline; the first structural review confirms the monorepo package boundaries and RTK slice ownership are architecturally honest — `packages/core` is framework-free, tested deeply, and genuinely domain-focused. The gaps are real but fixable in the remaining 5 loops: persistence middleware writes ambient `localStorage` without isolation, making test warnings fire on every run; undo/redo — the most complex multi-slice behavior — has zero unit tests; and `TierBoardPage.tsx` at 757 LOC is a god-component that resists maintenance. Runtime ownership is trustworthy within Redux state. Concurrency is not a concern (single-threaded JS, synchronous thunks). Tests reduce regressions in `packages/core` but are thin in `packages/state`. Future work should not over-engineer: the persistence guard is a 3-line fix; the undo/redo test is a ~40-line addition; the TierBoardPage decomposition should be incremental, one hook at a time.

## Loop 5 Result

Fixed one file: `packages/state/test/importJSON.test.ts` — updated the test fixture from a stale legacy `{tiers: {S: [], ...}, tierOrder: [...]}` shape (never supported by `ModelResolver.decodeProject`) to a valid `Project` schema (`schemaVersion: 1`, `projectId`, `tiers: ProjectTier[]`, `items: Record<string, ProjectItem>`, `audit`). Test renamed to "loads a project JSON with items in the unranked tier." Assertions preserved: `tierOrder` equals `["S","A","B","C","D","F"]`, `unranked` has 5 items, first item `name` is "Item Alpha".

`npm run test:core && npm run test:state && npm run test:ui` (loop 5): 17 suites, 84 tests — ALL PASS. This is the first globally green run across all three workspaces. Targeted finding F-001 "Build failure blocks structural review" is `resolved` — no test failures remain in current source. First real structural scorecard produced this loop. No unintended scorecard regression: all 9 dimensions moved UP from 1 (build-failure floor) to honest mid-range scores (5-7) based on source inspection.
