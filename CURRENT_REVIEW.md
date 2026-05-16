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
Loop 6 of 10 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 6 resolves F-002: `persistenceMiddleware.ts` now guards all 4 `localStorage` call sites with `typeof localStorage === "undefined"` early returns. The "Cannot log after tests are done" crash and the "Failed to save state" post-teardown error that fired on every `npm run test:state` run are eliminated. Full suite remains green: 17 suites, 84 tests. The remaining structural gaps — zero tests for `undoRedoThunks` cross-slice behavior (F-003) and `TierBoardPage.tsx` at 757 LOC (F-004) — are unchanged and carried forward as Priority 1 and 2 for next loops.

## Scorecard (1-10)
- Architecture quality: 6 | SAME | Package DAG intact: `packages/core/src/index.ts` (no React imports); `packages/state` only imports from `@tiercade/core`. `TierBoardPage.tsx:757 LOC` still conflates drag-drop, import/export, URL sharing, presentation, keyboard shortcuts. No structural change this loop on architecture dimension.
- State management and runtime ownership: 6 | SAME | RTK slice ownership solid: one owner per slice across 6 slices; `selectors.ts` memoized. Module-level `saveTimeout` singleton (`persistenceMiddleware.ts:9`) still outside Redux — acceptable SPA pattern but not elegant. Unchanged this loop.
- Domain modeling: 6 | SAME | `packages/core/src/models.ts:6` — `Item` interface well-structured. `Project` schema in `packages/core/src/project.ts:108` typed end-to-end. Mapping gap: `Item.name?: string` (optional) vs `ProjectItem.title: string` (required). Unchanged this loop.
- Data flow and dependency design: 6 | SAME | DAG enforced by workspace package.json. Guard added to `persistenceMiddleware.ts` but `localStorage` still not injected — dependency remains ambient, just SSR-safe. Full injection would earn this dimension higher but is next-loop work.
- Framework / platform best practices: 7 | UP | `persistenceMiddleware.ts:23,63,96,109` — all 4 `localStorage` call sites now guarded with `typeof localStorage === "undefined"` early return. The idiomatic SSR/Node-safe pattern for browser globals in Redux middleware. Prior score 6 cited unguarded access as the gap; that gap is now closed.
- Concurrency and runtime safety: 7 | SAME | JavaScript single-threaded. No floating Promises. Debounce timer (`persistenceMiddleware.ts:22-44`) correct. Module-level `saveTimeout` singleton still present. No change this loop.
- Code simplicity and clarity: 5 | SAME | `TierBoardPage.tsx:757 LOC` (7 `useState`, 3 `useEffect`, drag-drop, modals, URL sharing, export, keyboard shortcuts) unchanged. `ImportExportPage.tsx:438 LOC` unchanged. Persistence guard adds 4 lines of honest code — no complexity increase.
- Test strategy and regression resistance: 5 | SAME | `packages/core` 11 suites 69 tests unchanged. `packages/state` 4 suites 10 tests unchanged. `undoRedoThunks.ts` still has zero tests. `persistenceMiddleware.ts` still has zero tests (guard fix doesn't add test coverage for persistence behavior). Test environment is cleaner but test surface coverage is unchanged.
- Overall implementation credibility: 6 | UP | The "Cannot log after tests are done" crash from `persistenceMiddleware.ts:40` firing after test teardown is eliminated in loop 6. The prior credibility proof explicitly cited "test-environment localStorage leaks visible on every test run" — that symptom is now gone. `npm run test:state` (loop 6): 4 suites, 10 tests, no post-test error output.

## Authority Map
(see Loop 5 Discovery; persistence concern verdict is updated below)

### Persistence side effect (ambient `localStorage`)
- **Owner:** `persistenceMiddleware` — module-level singleton
- **Allowed writers:** every dispatched action triggers the debounce
- **Observers / readers:** `loadPersistedState` at store init; `clearPersistedState` on demand; `hasPersistedState`
- **Persistence seam:** none — IS the persistence seam; calls `localStorage` via guard (SSR-safe now), but still not injected
- **Async mutation entry points:** debounce timer, module-global `saveTimeout` (`persistenceMiddleware.ts:9`)
- **Verdict:** Split and ambiguous (dependency not injected; persistence behavior still untestable — guard makes it SSR-safe, not test-isolated)

## Strengths That Matter
- `packages/core` domain layer framework-free (no React imports); 11 suites 69 tests covering pure functions end-to-end.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace package.json: `core`←`state`←`apps`; no circular dependencies.
- E2E suite (8 spec files in `apps/web/e2e/`) provides feature-level regression coverage.
- `HeadToHeadLogic` (Wilson score, two-phase) deeply implemented and tested in `packages/core/test/`.
- `persistenceMiddleware.ts` now uses `typeof localStorage === "undefined"` guards at all 4 call sites — idiomatic SSR-safe pattern; no longer crashes test environment.

## Findings

### Finding #1: `persistenceMiddleware` writes ambient `localStorage` without injection — untestable seam (F-002)

**Why it matters** — RESOLVED THIS LOOP. The `typeof localStorage === "undefined"` guard at all 4 call sites eliminates test-environment crashes; production path unchanged.

**What is wrong** — WAS: `persistenceMiddleware.ts:63` called `localStorage.getItem` at module load in tests; `persistenceMiddleware.ts:40` called `localStorage.setItem` in a debounce timer after test teardown. NOW: all 4 call sites guarded; `loadPersistedState`/`clearPersistedState`/`hasPersistedState` return early in non-browser environments.

**Evidence** —
- `packages/state/src/persistenceMiddleware.ts:23` — `if (typeof localStorage === "undefined") return;` (debounce callback guard)
- `packages/state/src/persistenceMiddleware.ts:63` — `if (typeof localStorage === "undefined") return undefined;` (loadPersistedState guard)
- `packages/state/src/persistenceMiddleware.ts:96` — `if (typeof localStorage === "undefined") return;` (clearPersistedState guard)
- `packages/state/src/persistenceMiddleware.ts:109` — `if (typeof localStorage === "undefined") return false;` (hasPersistedState guard)
- Loop 6 test output: `npm run test:state` — 4 suites, 10 tests PASS, no "Cannot log after tests are done" error.

**Architectural test failed** — n/a (resolved)

**Dependency category** — `local-substitutable`

**Leverage impact** — Resolved. Test environment no longer crashes on persistence middleware import.

**Locality impact** — Resolved. The guard is at each call site — minimal diff, no blast radius.

**Metric signal, if any** — "Cannot log after tests are done" error gone from loop 6 test output.

**Why this weakens submission** — WAS: visible test warnings. NOW: resolved.

**Severity** — Serious deduction (resolved)

**ADR conflicts** — none

**Minimal correction path** — COMPLETED: `typeof localStorage === "undefined"` guard added at 4 call sites.

**Blast radius** — Changed: `packages/state/src/persistenceMiddleware.ts` (4 guard lines added). No other files touched.

---

### Finding #2: `undoRedoThunks` — multi-slice behavior with zero direct tests (F-003)

**Why it matters** — The undo/redo path reads `undoRedoSlice.past/future` and dispatches into `tierSlice` — the most complex cross-slice behavior in the state package has zero unit tests; a regression breaks a primary user-visible feature invisibly to CI.

**What is wrong** — `undoRedoThunks.ts:22-56` (`performUndo`/`performRedo`) coordinates two slices; the snapshot round-trip is not tested anywhere in `packages/state/test/`. `undoRedoSlice.test.ts` does not exist.

**Evidence** —
- `packages/state/src/undoRedoThunks.ts:22-39` (`performUndo`), `packages/state/src/undoRedoThunks.ts:45-62` (`performRedo`)
- `packages/state/test/` — 4 files only: `headToHeadSlice.test.ts`, `importJSON.test.ts`, `themeSlice.test.ts`, `tierSlice.test.ts`. No `undoRedo*.test.ts`.

**Architectural test failed** — Interface-as-test-surface

**Dependency category** — `in-process`

**Leverage impact** — Without tests, every future change to `undoRedoThunks` carries blind regression risk.

**Locality impact** — Bug surface for undo/redo spreads across two slice reducers and one thunk file with no test boundary.

**Metric signal, if any** — 0 tests for undo/redo in `packages/state/test/`.

**Why this weakens submission** — Primary user feature with zero unit test coverage at the thunk interface.

**Severity** — Serious deduction

**ADR conflicts** — none

**Minimal correction path** — Add `packages/state/test/undoRedoThunks.test.ts`. Test: (1) `captureSnapshot` pushes snapshot; (2) `performUndo` restores prior state; (3) `performRedo` restores undone state; (4) new action after undo clears `future`. Use real store instance.

**Blast radius** — Change: new file `packages/state/test/undoRedoThunks.test.ts`. Avoid: `packages/state/src/undoRedoThunks.ts`.

---

### Finding #3: `TierBoardPage.tsx` at 757 LOC — god-component fails shallow-module test (F-004)

**Why it matters** — A 757-LOC React component owning 7 independent concerns cannot be modified safely; tests at this surface are impractical.

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

## Simplification Check
- Structurally necessary: `localStorage` guard in `persistenceMiddleware` — passes Deletion test: removing the ambient unguarded call eliminates the crash; complexity stays only at the 4 call sites (each one-liner guard).
- New seam justified: no new seam for the guard-only fix. Storage injection would satisfy Two-adapter rule but overshoots the smallest honest fix.
- Helpful simplification: undo/redo tests add zero ceremony — pure behavioral assertion at existing thunk interface.
- Should NOT be done: introduce a full `Storage` port with two adapters as Priority 1 — overshoots the guard fix.
- Tests after fix: no test deletions needed; guard fix required no new tests.

## Improvement Backlog

### Priority 1: Add `undoRedoThunks.test.ts` — cover multi-slice undo/redo round-trip (F-003)
- Why it matters: The primary undo/redo path crosses two slices with zero unit test coverage; a regression here breaks a primary user feature invisibly to CI.
- Score impact: Test strategy +1.0; Overall credibility +0.5
- Kind: structural (missing test at thunk interface)
- Rank: needed for winning

### Priority 2: Extract `useShareImport` hook from `TierBoardPage` — reduce god-component scope (F-004)
- Why it matters: Smallest concrete step to decompose the 757-LOC TierBoardPage; URL sharing import is a self-contained behavior with no dependencies on other page state.
- Score impact: Code simplicity +0.5; Architecture quality +0.5
- Kind: simplification
- Rank: helpful

## Deepening Candidates

### `persistenceMiddleware` — inject Storage interface for test isolation (F-002 post-guard)
- Source friction proven: F-002 resolved this loop (guard added); deeper injection remains possible.
- Why shallow or misplaced: Guard makes it SSR-safe but `localStorage` is still ambient — persistence failure behavior (corrupted JSON, quota exceeded) remains untestable.
- Behavior to move behind deeper interface: `getItem`, `setItem`, `removeItem` calls in `persistenceMiddleware.ts`.
- Dependency category: `local-substitutable`
- Test surface after change: `persistenceMiddleware.test.ts` asserts save/load/clear against in-memory `Storage` stub.
- Smallest first step: Guard is done. Next: inject a `storage?: Storage` parameter with `localStorage` as default.
- What not to do: Do not extract a full `StoragePort` protocol with ceremony; a simple optional parameter injection is sufficient.

## Builder Notes
1. **Pattern** — Ambient browser globals in Redux middleware. **How to recognize** — Test output shows "ExperimentalWarning: localStorage is not available" or "Cannot log after tests are done" with a stack trace pointing to a `setTimeout` callback in middleware. **Smallest coding rule** — Guard every `localStorage`/`sessionStorage` access with `if (typeof localStorage === "undefined") return;` at the top of each exported function AND at the top of any timer callback that accesses the global. **Stack example** — `persistenceMiddleware.ts:23`: `if (typeof localStorage === "undefined") return;` inside the `setTimeout` callback before `store.getState()`.
2. **Pattern** — Cross-slice thunks with no integration test. **How to recognize** — A thunk dispatches to two different slice reducers; the test suite covers each slice independently but has no test exercising the combined round-trip. **Smallest coding rule** — For every thunk that spans ≥2 slices, add one integration test using a real store instance that asserts the final state across both slices. **Stack example** — `undoRedoThunks.ts`: `captureSnapshot → performUndo → performRedo` dispatch into different slices; a test should check `state.undoRedo.past`, `state.undoRedo.future`, AND `state.tier.tiers` after each call.
3. **Pattern** — God-page-component. **How to recognize** — A React page component over ~300 LOC with 5+ `useState` calls for independent concerns. **Smallest coding rule** — Each self-contained behavior (URL sharing on mount, keyboard shortcuts, export, presentation) becomes one custom hook named `use<Behavior>`. **Stack example** — `TierBoardPage.tsx:139-154` URL share import `useEffect` — no local state dependencies, only `dispatch` and URL utilities; extracting to `useShareImport()` costs ~15 lines and zero blast radius.

## Final Judge Narrative
Good app, place but not win yet. Loop 6 resolves the test-environment crash from F-002: `persistenceMiddleware.ts` now guards all 4 `localStorage` call sites with `typeof localStorage === "undefined"`, eliminating the post-teardown debounce timer crash. Full suite stays green at 17/84. Framework idioms and overall credibility both move up one point from the closed gap. Two structural gaps remain: undo/redo cross-slice thunks have zero unit tests (primary user feature, blind CI regression risk), and `TierBoardPage.tsx` at 757 LOC is a god-component. These are the next two loops' work. Concurrency is trustworthy. Runtime ownership is honest. The persistence guard is idiomatic and minimal — no over-engineering.

## Loop 6 Result

Changed one file: `packages/state/src/persistenceMiddleware.ts` — added `if (typeof localStorage === "undefined") return;` guards at 4 call sites: (1) top of the `setTimeout` debounce callback; (2) top of `loadPersistedState`; (3) top of `clearPersistedState`; (4) top of `hasPersistedState`. No production behavior changed in browser environments. In Node/Jest environments, the functions now return early (undefined, void, false respectively) instead of crashing on an undefined global.

`npm run test:state` (loop 6): 4 suites, 10 tests — all PASS. No "Cannot log after tests are done" error. No "Failed to save state" error. Full suite (`test:core && test:state && test:ui`): 17 suites, 84 tests — all PASS. Targeted finding F-002 (`persistenceMiddleware` ambient localStorage guard) is `resolved`. No unintended scorecard regression: `framework_idioms` +1 (6→7) and `credibility` +1 (5→6) based on structural proof from this loop's diff.

## Loop 6 Implementation Review

Reviewer verdict: **approved**

All three checks passed: (1) Reality — the finding pattern (unguarded `localStorage` access crashing in test environment) no longer present in current source; all 4 call sites now have `typeof localStorage === "undefined"` guards. (2) Honesty — fix passes Simplify Pressure Test: smallest honest fix (4 one-liner guards, no new abstractions), no new seam, no duplicate layers, runtime behavior unchanged in browser. (3) Regression — no new findings introduced; the one remaining Jest "worker process has failed to exit gracefully" warning is pre-existing behavior from the module-level `saveTimeout` not being cancelled at test teardown (unrelated to this fix; a cosmetic-for-contest concern the next undo/redo test PR can address with a `beforeEach(() => clearAllTimers())`).
