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
Loop 7 of 10 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 7 resolves F-003: three new test files cover `undoRedoThunks`, `persistenceMiddleware`, and `selectors` at their public Interfaces. Tests also caught and fixed two latent bugs in `selectors.ts`: `selectLastActionName` used `.actionName` (wrong field — `TierSnapshot` has `.action`), and `selectAvailableThemes`/`selectCurrentTheme` referenced a `ThemeState.availableThemes` property that does not exist. Full suite: 20 suites, 114 tests, all green. `test_strategy` moves 5→7, `credibility` moves 6→7.

## Scorecard (1-10)
- Architecture quality: 6 | SAME | Package DAG intact: `packages/core/src/index.ts` (no React imports); `packages/state` only imports from `@tiercade/core`. `TierBoardPage.tsx` still at ~757 LOC conflating 7 concerns. No structural change this loop on architecture dimension.
- State management and runtime ownership: 6 | SAME | RTK slice ownership solid across 6 slices. Module-level `saveTimeout` singleton (`persistenceMiddleware.ts:9`) still outside Redux. No change this loop.
- Domain modeling: 6 | SAME | `packages/core/src/models.ts:6` — `Item` interface well-structured. `Item.name?: string` (optional) vs mapping gaps unchanged. No change this loop.
- Data flow and dependency design: 6 | SAME | DAG enforced by workspace package.json. `localStorage` still ambient in `persistenceMiddleware`. No change this loop.
- Framework / platform best practices: 7 | SAME | All 4 `localStorage` guards in place from loop 6. RTK idioms correct. No regression.
- Concurrency and runtime safety: 7 | SAME | JavaScript single-threaded. Debounce timer correct. No change this loop.
- Code simplicity and clarity: 5 | SAME | `TierBoardPage.tsx:~757 LOC` unchanged. Selector bug-fix removes 6 lines of broken code — small net simplification.
- Test strategy and regression resistance: 7 | UP | `packages/state/test/undoRedoThunks.test.ts` (new, 8 tests — captureSnapshot/performUndo/performRedo/moveItemBetweenTiersWithUndo round-trip using real store); `packages/state/test/persistenceMiddleware.test.ts` (new, 14 tests — debounce save, loadPersistedState, hasPersistedState, clearPersistedState, non-browser guard); `packages/state/test/selectors.test.ts` (new, 8 tests — selectAllItems, selectHasSelection, selectCurrentThemeId, selectCanUndo/Redo, selectLastActionName). Full suite: 20 suites, 114 tests. Prior score: 5 ("Tests exist but mostly verify glue"); new files assert behavior at thunk/middleware/selector Interfaces — not glue.
- Overall implementation credibility: 7 | UP | `selectors.ts` had two latent bugs caught by new tests: (1) `packages/state/src/selectors.ts:136` — `selectLastActionName` read `.actionName` but `TierSnapshot.action` is the field name; (2) `packages/state/src/selectors.ts:103-108` — `selectAvailableThemes` / `selectCurrentTheme` referenced `state.theme.availableThemes` which does not exist on `ThemeState`. Both would have returned `undefined`/`null` silently in production. Tests caught them, source fixed.

## Authority Map
(see Loop 5 Discovery; persistence concern verdict unchanged)

### Persistence side effect (ambient `localStorage`)
- **Owner:** `persistenceMiddleware` — module-level singleton
- **Allowed writers:** every dispatched action triggers the debounce
- **Observers / readers:** `loadPersistedState` at store init; `clearPersistedState` on demand; `hasPersistedState`
- **Persistence seam:** none — IS the persistence seam; calls `localStorage` via guard (SSR-safe), still not injected
- **Async mutation entry points:** debounce timer, module-global `saveTimeout` (`persistenceMiddleware.ts:9`)
- **Verdict:** Split and ambiguous (dependency not injected; loop 7 adds behavior tests via fake storage)

## Strengths That Matter
- `packages/core` domain layer framework-free (no React imports); 11 suites 69 tests covering pure functions end-to-end.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace package.json: `core`←`state`←`apps`; no circular dependencies.
- E2E suite (8 spec files in `apps/web/e2e/`) provides feature-level regression coverage.
- `HeadToHeadLogic` (Wilson score, two-phase) deeply implemented and tested in `packages/core/test/`.
- `persistenceMiddleware.ts` guarded at all 4 call sites (loop 6) and now covered by 14 behavior tests (loop 7) using fake timers + fake storage.
- `undoRedoThunks.ts` — primary user feature now covered by 8 integration tests at thunk interface, using real store instances.

## Findings

### Finding #1: `undoRedoThunks` + `persistenceMiddleware` + `selectors` — zero direct tests (F-003)

**Why it matters** — RESOLVED THIS LOOP. Three test files added covering all cited concerns at their public Interfaces.

**What is wrong** — WAS: `packages/state/test/` had 4 files; `undoRedoThunks`, `persistenceMiddleware`, and `selectors` were untested. Also exposed 2 latent bugs in `selectors.ts`. NOW: all three have direct test files; bugs fixed.

**Evidence** —
- `packages/state/test/undoRedoThunks.test.ts` (new) — 8 tests covering `captureSnapshot`, `performUndo`, `performRedo`, `moveItemBetweenTiersWithUndo`
- `packages/state/test/persistenceMiddleware.test.ts` (new) — 14 tests covering debounce write, `loadPersistedState`, `hasPersistedState`, `clearPersistedState`, non-browser guard paths
- `packages/state/test/selectors.test.ts` (new) — 8 tests covering `selectAllItems`, `selectTotalItemCount`, `selectHasSelection`, `selectSelectionCount`, `selectSelectionSet`, `selectCurrentThemeId`, `selectCanUndo`, `selectCanRedo`, `selectLastActionName`, `selectHasActiveFilters`
- `packages/state/src/selectors.ts:136` — `actionName` → `action` bug fix
- `packages/state/src/selectors.ts:103-108` — removed broken `selectAvailableThemes`/`selectCurrentTheme` (referenced nonexistent field)
- Loop 7 test output: 20 suites, 114 tests PASS

**Architectural test failed** — n/a (resolved)

**Dependency category** — `in-process`

**Leverage impact** — Resolved. Future changes to these modules are now caught by CI.

**Locality impact** — Resolved. Bug surface for undo/redo and persistence is now bounded by tests.

**Metric signal, if any** — +30 new tests; 3 new test suites.

**Why this weakens submission** — WAS: primary user feature (undo/redo) with zero unit test coverage. NOW: resolved.

**Severity** — Serious deduction (resolved)

**ADR conflicts** — none

**Minimal correction path** — COMPLETED: 3 new test files + 2 selector bug fixes.

**Blast radius** — Changed: `packages/state/test/undoRedoThunks.test.ts` (new), `packages/state/test/persistenceMiddleware.test.ts` (new), `packages/state/test/selectors.test.ts` (new), `packages/state/src/selectors.ts` (2 bug fixes). No other files touched.

---

### Finding #2: `TierBoardPage.tsx` at ~757 LOC — god-component fails shallow-module test (F-004)

**Why it matters** — A ~757-LOC React component owning 7 independent concerns cannot be modified safely; tests at this surface are impractical.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` contains: 7 `useState` calls for independent modal/UI state; 3 `useEffect` calls (theme init, project load, URL share import); inline drag-drop handlers; `useMemo` for tier colors; full render tree. Shallow module test: deleting this component's implementation for any one concern requires reading all 757 LOC.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-757` — LOC count
- `apps/web/src/pages/TierBoardPage.tsx:101-113` — 7 `useState` declarations
- `apps/web/src/pages/TierBoardPage.tsx:139-154` — URL sharing `useEffect` directly in page

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Every concern bundled into TierBoardPage must be understood to modify any one of them.

**Locality impact** — Bug in URL sharing or export requires navigating 757 LOC of unrelated code.

**Metric signal, if any** — 757 LOC vs 95 LOC for `ThemesPage.tsx`; ratio 8:1.

**Why this weakens submission** — God-component resists maintenance and unit testing at the individual behavior level.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Extract URL-sharing `useEffect` (lines 139-154) into `useShareImport` hook — self-contained, ~15 lines, zero blast radius to other page behaviors.

**Blast radius** — Change: `apps/web/src/pages/TierBoardPage.tsx`, new file `apps/web/src/hooks/useShareImport.ts`. Avoid: `apps/web/src/utils/urlSharing.ts`, other pages.

---

### Finding #3: `persistenceMiddleware` — ambient `localStorage` still not injected (F-002 post-resolution residual)

**Why it matters** — Tests now cover persistence behavior but use fake storage injected into `global.localStorage` — the middleware itself has no storage injection point, so production failure modes (quota exceeded, corrupted JSON round-trip) remain untestable at the Interface without environment manipulation.

**What is wrong** — `packages/state/src/persistenceMiddleware.ts:41` still calls `localStorage.setItem` directly. The guard makes it SSR-safe; the tests use fake storage; but `persistenceMiddleware` cannot be constructed with an explicit storage parameter, so test isolation requires `Object.defineProperty` manipulation.

**Evidence** —
- `packages/state/src/persistenceMiddleware.ts:41` — `localStorage.setItem(STORAGE_KEY, ...)` direct call
- `packages/state/test/persistenceMiddleware.test.ts:58-63` — test setup requires `Object.defineProperty(global, "localStorage", ...)` rather than constructor injection

**Architectural test failed** — Two-adapter rule (one prod adapter only; no injection)

**Dependency category** — `local-substitutable`

**Leverage impact** — Tests work but are fragile (rely on global override rather than Interface injection).

**Locality impact** — Adding a storage parameter would be a 3-line change; each test could pass an in-memory stub directly.

**Metric signal, if any** — none

**Why this weakens submission** — Minor — tests pass and behavior is covered, but the seam is still not clean.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Add optional `storage?: Storage` parameter to `persistenceMiddleware` factory with `localStorage` as default. Rewrite tests to pass `makeFakeStorage()` directly instead of manipulating `global.localStorage`.

**Blast radius** — Change: `packages/state/src/persistenceMiddleware.ts`, `packages/state/test/persistenceMiddleware.test.ts`. Avoid: `packages/state/src/store.ts` (caller; `storage` param is optional, no call site change needed).

## Simplification Check
- Structurally necessary: New test files assert behavior at public Interfaces (`captureSnapshot`/`performUndo`/`performRedo`/`loadPersistedState`/`hasPersistedState`/`clearPersistedState`/`selectAllItems` etc.) — passes Interface-as-test-surface test.
- New seam justified: no new seam. Tests use real store instances and fake `global.localStorage`; no new protocol/adapter added.
- Helpful simplification: Removed broken `selectAvailableThemes`/`selectCurrentTheme` selectors (dead code with nonexistent field reference); fixed `selectLastActionName` bug.
- Should NOT be done: Introduce a `Storage` port as Priority 1 — the `global.localStorage` override in tests is workable; injection is a polish step, not a winning move.
- Tests after fix: No old test deletions needed. New tests live at the thunk/middleware/selector Interfaces per Replace-don't-layer.

## Improvement Backlog

### Priority 1: Inject storage parameter into `persistenceMiddleware` — clean the seam (F-002 residual / F-003 aftermath)
- Why it matters: Tests currently rely on `Object.defineProperty(global, "localStorage")` manipulation. A simple optional `storage?: Storage` parameter makes each test pass its own stub directly — cleaner isolation, no global side effects.
- Score impact: Data flow +0.5; Code simplicity +0.5 (removes global manipulation from tests)
- Kind: simplification
- Rank: helpful

### Priority 2: Extract `useShareImport` hook from `TierBoardPage` — reduce god-component scope (F-004)
- Why it matters: Smallest concrete step to decompose the 757-LOC TierBoardPage; URL sharing import is a self-contained behavior with no dependencies on other page state.
- Score impact: Code simplicity +0.5; Architecture quality +0.5
- Kind: simplification
- Rank: helpful

## Deepening Candidates

### `persistenceMiddleware` — inject Storage interface for clean test isolation
- Source friction proven: F-003 aftermath — tests require `Object.defineProperty(global, "localStorage")` manipulation instead of constructor injection (Finding #3 this loop).
- Why shallow or misplaced: Middleware directly calls `localStorage` global; no injection point exists at the Interface level.
- Behavior to move behind deeper interface: `getItem`, `setItem`, `removeItem` calls in `persistenceMiddleware.ts`.
- Dependency category: `local-substitutable`
- Test surface after change: `persistenceMiddleware.test.ts` passes `makeFakeStorage()` directly to factory; no more global override.
- Smallest first step: Add `storage?: Storage` optional parameter with `/* default: localStorage */` at the factory signature.
- What not to do: Do not extract a full `StoragePort` protocol; a simple optional parameter is sufficient.

## Builder Notes
1. **Pattern** — Latent type bugs in selectors referencing nonexistent fields. **How to recognize** — A selector returns `undefined` or `null` in production for a field that "should" exist; TypeScript doesn't catch it if the type definition and the runtime state diverge. **Smallest coding rule** — Write a single test for each selector that asserts a non-null/non-undefined value against a constructed state; the compile error surfaces the field mismatch before reaching production. **Stack example** — `selectors.ts:103`: `state.theme.availableThemes` — `ThemeState` only has `selectedThemeId`; TypeScript compiled because `any` implicit typing from `createSelector`.
2. **Pattern** — Cross-slice thunk integration tests. **How to recognize** — A thunk dispatches to two or more slice reducers; the test suite covers each slice independently but no test builds a real store and exercises the combined round-trip. **Smallest coding rule** — For each thunk spanning ≥2 slices, one `configureStore`-based test that dispatches the thunk and asserts `getState()` across both slices. **Stack example** — `undoRedoThunks.test.ts`: `captureSnapshot` + `performUndo` tested against a real store instance asserting both `state.undoRedo.past` and `state.tier.tiers`.
3. **Pattern** — Global dependency manipulation in tests (`Object.defineProperty(global, "localStorage")`). **How to recognize** — Test `beforeEach` installs a global override; `afterEach` removes it; tests are order-sensitive if teardown fails. **Smallest coding rule** — Add an optional `storage?: Storage` parameter to the middleware/function under test with `localStorage` as default; tests pass an in-memory stub directly. **Stack example** — `persistenceMiddleware.ts`: `export const persistenceMiddleware = (store, storage = localStorage) => ...` eliminates all `Object.defineProperty` in tests.

## Final Judge Narrative
Good app, place but not win yet. Loop 7 resolves F-003: three new test files cover `undoRedoThunks`, `persistenceMiddleware`, and `selectors` at their public Interfaces (30 new tests, +3 suites). Tests also caught two latent bugs in `selectors.ts` that would have silently returned wrong values in production — both fixed. Full suite: 20 suites, 114 tests, all green. `test_strategy` moves 5→7 (Interface-level behavioral tests now exist for primary state modules), `credibility` moves 6→7 (bug fixes proven by tests). Remaining gaps: `localStorage` injection (workable but not clean — global override in tests), and `TierBoardPage.tsx` god-component (~757 LOC). Both are solvable in the next two loops. Architecture, state management, data flow, and domain modeling are steady but not yet contest-grade — the god-component and ambient dependency are the remaining structural blockers.

## Loop 7 Result

Changed four files:
- `packages/state/test/undoRedoThunks.test.ts` (new) — 8 tests covering `captureSnapshot`/`performUndo`/`performRedo`/`moveItemBetweenTiersWithUndo` against a real `configureStore` instance.
- `packages/state/test/persistenceMiddleware.test.ts` (new) — 14 tests covering debounce write (fake timers), `loadPersistedState`, `hasPersistedState`, `clearPersistedState` with fake `global.localStorage`.
- `packages/state/test/selectors.test.ts` (new) — 8 tests covering all cited selector concerns.
- `packages/state/src/selectors.ts` — fixed two latent bugs: (1) `selectLastActionName`: `.actionName` → `.action` (correct `TierSnapshot` field); (2) removed `selectAvailableThemes`/`selectCurrentTheme` (referenced `ThemeState.availableThemes` which does not exist); added `selectCurrentThemeId` alias.

Full suite (`test:core && test:state && test:ui`): 20 suites, 114 tests — all PASS. Prior state: 17 suites, 84 tests. Targeted finding F-003 (`undoRedoThunks + persistenceMiddleware + selectors` zero tests) is `resolved`. `test_strategy`: 5→7 (structural proof: Interface-level behavioral tests now exist). `credibility`: 6→7 (latent selector bugs caught and fixed by new tests).

## Loop 7 Implementation Review

Reviewer verdict: **approved**

All three checks passed: (1) Reality — `undoRedoThunks`, `persistenceMiddleware`, and `selectors` now have direct test files at their public Interfaces; the cited F-003 pattern (zero direct tests for these three concerns) no longer exists in the current source. (2) Honesty — test additions pass Simplify Pressure Test: smallest honest addition (new test files only, no new abstractions, no ceremony), no new seam, tests live at the Interface per Replace-don't-layer. The two selector bug fixes are subtractive (removed dead broken code) and independently verified by the new tests. Global `localStorage` override in `persistenceMiddleware.test.ts` is workable (finding #3 in this loop's review flags it as a polish step, not a regression). (3) Regression — no new findings introduced at same or higher severity. The two selector bugs were pre-existing latent issues; fixing them is strictly subtractive. Full suite green at 114 tests.
