### Discovery (first loop only)
- Source roots: `packages/core/src/`, `packages/state/src/`, `packages/ui/src/`, `packages/theme/src/`, `apps/web/src/`, `apps/native/src/`
- Test command: `npm run test:core && npm run test:state && npm run test:ui && npm run test:hooks` (at repo root)
- Build command: `cd apps/web && npm run build` (production); `cd apps/native && npx expo prebuild` (native)
- ADRs found: none (no `docs/adr/` directory)
- Domain terms (CONTEXT.md): none (no CONTEXT.md present; domain vocabulary derived from `AGENTS.md`: `Item`, `Items`, `TierConfig`, `tierOrder`, `unranked`, `HeadToHeadLogic`, `modelResolver`)
- Selected lens: Generic (Node section). React 19 + TypeScript + RTK 2.x + Vite + Jest.
- Provider: `claude_code`; loop_model: `claude-sonnet-4-6`; reviewer_model: `claude-sonnet-4-6`; spawn_isolation: `subagent`.
- Loop cap: 18 (bumped mid-session).
- Working tree: clean at Step 0.
- Test scope: full (no `--test-filter` set).

### Loop Counter
Loop 15 of 18 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 15 extracts `useImportHandlers` hook from ImportExportPage: `handleImportFile` + `handleImportFileSelection` (FileReader + format dispatch + toast) moved behind a stable Interface. ImportExportPage 438→401 LOC. Also fixes a latent bug: unsupported-extension files no longer capture an undo snapshot. 5 new Interface-level tests at `useImportHandlers.test.ts`. Suite: 26 suites, 179 tests, all green. simplicity 7.0→7.5.

## Scorecard (1-10)
- Architecture quality: 7.0 | SAME | `apps/web/src/hooks/useImportHandlers.ts:1-62` — file I/O orchestration now behind Interface. Package DAG enforced. 9-anchor still not met: import handlers extracted but export handlers (5 `useCallback` blocks) still inline in ImportExportPage. Page-level depth gap persists system-wide.
- State management and runtime ownership: 6.5 | SAME | RTK slice ownership clear. One writer per concern across 6 slices (`packages/state/src/tierSlice.ts:1-343`). Memoized selectors in `selectors.ts`. No process-lifetime ownership pattern (store is implicit global). 9-anchor sub-threshold.
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — `Item` interface is a data bag (`name?`, `imageUrl?`, `description?` all optional). `Items = Record<string, Item[]>` anemic. No smart constructors, no validated values. 9-anchor requires types prove most invariants by construction — not met.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json` (`core←state←apps`). No circular deps. 10 focused hooks in `apps/web/src/hooks/` with clean dep clusters. Within-app no module-level DAG enforcement. 9-anchor requires "DAG enforced; effects typed" — partial.
- Framework / platform best practices: 7.0 | SAME | Custom hooks idiomatic (10 hooks in `apps/web/src/hooks/`). RTK patterns correct. `useId()` for stable IDs in modal. `ImportExportPage.tsx` at 401 LOC still has 5 export `useCallback` blocks inline. 9-anchor nearly met but no documented carve-outs.
- Concurrency and runtime safety: 7.0 | SAME | JavaScript single-threaded. No floating promises found. `useEffect` cleanup present in `CelebrationEffect.tsx`. No AbortController for async fetches. `persistenceMiddleware` per-instance timer (loop 8). 9-anchor partial.
- Code simplicity and clarity: 7.5 | UP | `apps/web/src/hooks/useImportHandlers.ts:1-62` — FileReader + format dispatch + toast handlers (37 LOC) extracted from `ImportExportPage.tsx`; page 438→401 LOC. 2 `useCallback` blocks removed. Also eliminates unsupported-format snapshot bug. `useImportHandlers` hook is 62 LOC with a clean `dispatch`-only dep cluster.
- Test strategy and regression resistance: 8.0 | SAME | Suite: 26 suites, 179 tests. `useImportHandlers.test.ts` — 5 tests: JSON import dispatch, CSV import dispatch, empty-content guard, unsupported-extension guard, file-selection delegate. Authority Map cross-check: `useImportHandlers` Interface directly tested. Remaining ceiling: page-level surfaces still untested — 9-anchor not met.
- Overall implementation credibility: 8.0 | SAME | `useImportHandlers` extraction passes deletion test: complexity (FileReader + format dispatch) vanishes from page. Replace-don't-layer satisfied: no prior tests for these handlers; 5 new tests at new Interface. Bug fix (unsupported snapshot) is an honest improvement, not polish. Implementation reviewer approved.

## Authority Map
(Re-emitted because simplicity UP — structural change.)

**TierBoardPage modal state**
- Owner: `TierBoardPage` local state (7 `useState` declarations, lines 75-82)
- Allowed writers: `TierBoardPage` handlers (inline setters)
- Observers / readers: JSX render tree within `TierBoardPage`
- Persistence seam: none
- Async mutation entry points: `handleMoveItemWithCelebration` (celebration state)
- Verdict: Single and clear (local component state; not a shared concern)

**Import handlers (file I/O + format dispatch)**
- Owner: `apps/web/src/hooks/useImportHandlers.ts`
- Allowed writers: n/a (dispatches to RTK store via thunks)
- Observers / readers: `ImportExportPage` via `useImportHandlers(dispatch)` return value
- Persistence seam: none (delegates to `importJSON` / `importCSV` thunks)
- Async mutation entry points: `onImportFile` — FileReader.onload callback
- Verdict: Single and clear — **test surface: `useImportHandlers.test.ts` (5 tests, loop 15)**

**Batch action handlers**
- Owner: `apps/web/src/hooks/useBatchActions.ts`
- Allowed writers: n/a (dispatches to RTK store)
- Observers / readers: `TierBoardPage` via `useBatchActions(dispatch)` return value
- Persistence seam: none (delegates to tierSlice)
- Async mutation entry points: none (synchronous dispatch)
- Verdict: Single and clear — **test surface: `useBatchActions.test.ts` (6 tests, loop 14)**

**Item interaction (dispatch-only handlers)**
- Owner: `apps/web/src/hooks/useItemInteraction.ts`
- Allowed writers: n/a (dispatches to RTK store)
- Observers / readers: `TierBoardPage` via `useItemInteraction(dispatch)` return value
- Persistence seam: none
- Async mutation entry points: none
- Verdict: Single and clear — **test surface: `useItemInteraction.test.ts` (7 tests, loop 12)**

**Tier/Item domain state**
- Owner: `packages/state/src/tierSlice.ts`
- Allowed writers: dispatched actions (captureSnapshot, moveItemBetweenTiersWithUndo, addItemToTier, updateItem, deleteItems, moveItemsBetweenTiers)
- Observers / readers: all page components via `useAppSelector`
- Persistence seam: `persistenceMiddleware` (injectable storage, per-instance timer, loop 8)
- Async mutation entry points: thunks in `packages/state/src/`
- Verdict: Single and clear — **test surface: `undoRedoThunks.test.ts`, `tierSlice.test.ts`**

**Sort/filter derived state**
- Owner: `apps/web/src/hooks/useTierFilter.ts`
- Allowed writers: `setSortMode`, `setFilters` dispatched from hook callbacks
- Observers / readers: `TierBoardPage` via `useTierFilter` return value
- Persistence seam: none
- Async mutation entry points: none
- Verdict: Single and clear — **test surface: `useTierFilter.test.ts:67-162` (F-007 resolved loop 11)**

**filterAllTiers (core pure function)**
- Owner: `packages/core/src/filtering.ts`
- Allowed writers: n/a (pure function)
- Observers / readers: `useTierFilter` (line 41)
- Persistence seam: none
- Async mutation entry points: none
- Verdict: Single and clear — **test surface: `filtering.test.ts:96-176` (F-008 resolved loop 11)**

## Strengths That Matter
- `packages/core` domain layer framework-free; 12 suites, 94 tests covering pure functions end-to-end.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace `package.json`: `core←state←apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage (F-005 resolved loop 8); per-instance timer (F-006 resolved loop 8).
- `undoRedoThunks` — direct test suite covering cross-slice behavior (F-003 resolved loop 7).
- `TierBoardPage.tsx` — reduced from 757 to 443 LOC; 7 focused modules/hooks extracted (loops 9, 12, 14).
- `ImportExportPage.tsx` — reduced from 438 to 401 LOC; import handlers extracted to `useImportHandlers` (loop 15).
- `useImportHandlers.ts` — 62 LOC; Interface tested at `useImportHandlers.test.ts` (5 tests, loop 15).
- `useBatchActions.ts` — 40 LOC; Interface tested at `useBatchActions.test.ts` (6 tests, loop 14).
- `useItemInteraction.ts` — 81 LOC; Interface tested at `useItemInteraction.test.ts` (7 tests, loop 12).

## Findings

### Finding #1: `TierBoardPage.tsx` at 443 LOC — god-component at natural modal-coupled floor (F-004)

**Why it matters** — At 443 LOC (down from 757 at loop 5 start), the page retains 3 inline handlers and 7 `useState` declarations. All remaining handlers require modal state context — further extraction would require co-extracting state, raising ceremony. Proposing acceptance as residual.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` bundles: 7 `useState` modal/UI state declarations (lines 75-82); `handleItemDoubleClick` (1 line, only `setEditingItem`); `handleCopyLink` (reads 5 selectors + URL generation); `handleMoveItemWithCelebration` (calls modal state setters + presentation context). All remaining handlers require modal state — no clean dispatch-only subset.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC
- `apps/web/src/pages/TierBoardPage.tsx:75-82` — 7 `useState` declarations
- `apps/web/src/pages/TierBoardPage.tsx:140-183` — 3 remaining inline handlers

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Modal coordination still requires reading 443 LOC.

**Locality impact** — Remaining handlers are coupled to modal state; no clean extraction path without co-moving modal state (ceremony).

**Metric signal, if any** — 443 LOC vs 95 LOC `ThemesPage.tsx`.

**Why this weakens submission** — Page shell still broad; floor is real but not yet documented as accepted residual.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept 443 LOC as the natural orchestration floor. Promote F-004 to accepted residual. No further extraction attempts.

**Blast radius** — No change needed; acceptance only.

---

### Finding #2: `ImportExportPage.tsx` export handlers — 5 `useCallback` blocks still inline after import extraction (F-010)

**Why it matters** — `ImportExportPage.tsx` at 401 LOC still contains 5 inline export handlers (`handleCopyLink`, `handleExportJSON`, `handleExportCSV`, `handleExportMarkdown`, `handleExport`). All close over 5 shared selectors. `useExport` already handles PNG/clipboard. Export text handlers could be extracted but share a different dep cluster (5 selectors, not just `dispatch`).

**What is wrong** — `apps/web/src/pages/ImportExportPage.tsx:127-260` — 5 export `useCallback` handlers sharing `projectName`, `tierOrder`, `tierLabels`, `tierColors`, `tiers`. No extraction applied.

**Evidence** —
- `apps/web/src/pages/ImportExportPage.tsx:127-260` — 5 inline export callbacks
- `apps/web/src/pages/ImportExportPage.tsx:401` — still 401 LOC after import extraction

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Export orchestration mixed with JSX; 5-selector dep cluster repeated across 3 handlers.

**Locality impact** — Export format changes require reading the full page.

**Metric signal, if any** — 401 LOC; 5 export callbacks share identical selector deps.

**Why this weakens submission** — Export handlers share a natural cluster; extraction opportunity remains, though more complex than import (5 selectors vs 1 dispatch).

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Extract `handleExportJSON`, `handleExportCSV`, `handleExportMarkdown`, `handleExport` (switch) to `useExportHandlers` hook — reads selectors internally. Check for duplicate-layer concern with existing `useExport` (PNG/clipboard): no overlap, different concerns.

**Blast radius** — Change: `apps/web/src/pages/ImportExportPage.tsx`, `apps/web/src/hooks/useExportHandlers.ts` (new). Avoid: `@tiercade/core/ExportFormatter`, `useExport.ts`.

---

## Simplification Check
- Structurally necessary: `useImportHandlers` extraction — `handleImportFile` and `handleImportFileSelection` share exactly `dispatch` as their only dependency; extraction concentrates FileReader + format dispatch behind a stable Interface. Deletion test passes: complexity (FileReader + format check + error handling) vanishes from ImportExportPage.
- New seam justified: No new architectural Seam introduced. `useImportHandlers` is an in-process hook, not a protocol/port abstraction.
- Helpful simplification: ImportExportPage.tsx 438→401 LOC; 2 `useCallback` blocks removed; `importJSON`/`importCSV` imports removed from page. Latent bug fixed: unsupported-extension files no longer capture undo snapshot (now only .json/.csv trigger `captureSnapshot`).
- Should NOT be done: Extracting export handlers to a protocol/port — adds ceremony. Extracting `handleReset` — closes over `dispatch` + `setShowResetConfirm` modal state; extraction would pass setter as param (costume layer).
- Tests after fix: `apps/web/src/hooks/useImportHandlers.test.ts` — 5 tests at new Interface. No old tests to delete (Replace-don't-layer: no prior tests existed for these handlers).

## Improvement Backlog

### Priority 1: Extract export handlers from `ImportExportPage.tsx` to `useExportHandlers` hook (F-010)
- Why it matters: 5 export `useCallback` handlers share 5 identical selectors — same dep-cluster pattern as prior extractions. ImportExportPage still 401 LOC.
- Score impact: `architecture_quality` +0.0-0.5; `simplicity` +0.0-0.5 if extracted cleanly
- Kind: structural
- Rank: helpful

### Priority 2: Accept F-004 residual — TierBoardPage at natural modal floor
- Why it matters: Remaining TierBoardPage handlers are all modal-state coupled; no further clean extraction without co-moving state. Accept 443 LOC as the design floor.
- Score impact: Promotes F-004 to accepted residual; architecture_quality assessment changes slightly.
- Kind: polish
- Rank: minor

## Deepening Candidates

**ImportExportPage export handler extraction**
- Candidate module: Export dispatch handlers in `ImportExportPage`
- Source friction proven: F-010 — `ImportExportPage.tsx:127-260` (5 export callbacks, 5 shared selectors)
- Why shallow or misplaced: `handleExportJSON`, `handleExportCSV`, `handleExportMarkdown` all read the same 5 state values — the dep cluster is tight and extractable
- Behavior to move behind Interface: format-specific serialization dispatch + `downloadFile` trigger + toast feedback
- Dependency category: `in-process`
- Test surface after change: `apps/web/src/hooks/useExportHandlers.test.ts` (renderHook + Provider pattern; assert file content via mocked `downloadFile` or assert DOM side-effect)
- Smallest first step: Grep for `useCallback` blocks in ImportExportPage that close over `tiers`/`tierOrder`/`tierLabels`/`tierColors`/`projectName`; extract to `useExportHandlers.ts` reading selectors internally
- What not to do: Do not wrap `downloadFile` in a seam — it's a one-line DOM utility, not a policy concern. Do not merge with existing `useExport` — different concern (text serialization vs image capture).

## Builder Notes
1. **Pattern** — Unsupported-format bug revealed by test: original page called `captureSnapshot` before checking file extension, so .xml files would pollute undo history. **How to recognize** — When extracting a multi-branch handler, trace each branch's side-effects independently; the guard belongs before the side-effect, not after. **Smallest coding rule** — "Mutation (snapshot/dispatch) only runs when the guard passes — never before the `if`." **Stack example** — `useImportHandlers.ts:31-40`: `captureSnapshot` now inside each `if`/`else if` branch, not before the conditional.
2. **Pattern** — 5-selector dep cluster in export handlers — all five closures share `projectName`, `tierOrder`, `tierLabels`, `tierColors`, `tiers`. **How to recognize** — Look for `useCallback` blocks with identical dependency arrays listing 4+ state values. Each is a candidate for a single hook that reads the selectors internally, eliminating the repeated `useAppSelector` calls. **Smallest coding rule** — "When 3+ callbacks share the same 4+ deps, they belong in one hook." **Stack example** — `handleExportJSON`, `handleExportCSV`, `handleExportMarkdown` all have `[projectName, tierOrder, tierLabels, tierColors, tiers]` as deps.
3. **Pattern** — Test-at-new-Interface discipline: 5th hook now tested. The FileReader async callback tested synchronously via `jest.spyOn(globalThis, "FileReader")` — the spy intercepts instantiation and calls `onload` synchronously. **How to recognize** — Any hook whose side-effect flows through a DOM/platform callback (FileReader, XHR, setTimeout) requires a synchronous test double. **Smallest coding rule** — "Spy on the global, not on the module — `jest.spyOn(globalThis, 'FileReader')` overrides new FileReader() calls; `jest.mock('FileReader')` does not."

## Final Judge Narrative
Good app, place but not win. Loop 15 executes `useImportHandlers` extraction: FileReader + format dispatch moves behind a stable Interface; ImportExportPage 438→401 LOC. simplicity 7.0→7.5: structural proof is the hook + removed useCallback blocks + bug fix. Remaining backlog: export handlers extraction (5 callbacks, shared selector cluster) is the next opportunity; F-004 should be accepted as residual. Average score holding at 7.1. architecture_quality still at 7.0 — page-level Depth gap persists across both major pages; individual hook extractions improve Locality but system-level 9-anchor needs export-side improvement too.

## Loop 15 Result

Three files changed: `useImportHandlers.ts` (new, 62 LOC), `useImportHandlers.test.ts` (new, 5 tests), `ImportExportPage.tsx` (438→401 LOC, 2 `useCallback` blocks removed, `importJSON`/`importCSV` imports removed).

`useImportHandlers` extracts `handleImportFile` and `handleImportFileSelection` from `ImportExportPage.tsx`. Both closed over `dispatch` only. The hook returns `{ onImportFile, onImportFileSelection }`. Page calls `const { onImportFile: handleImportFile, onImportFileSelection: handleImportFileSelection } = useImportHandlers(dispatch)`. The hook also fixes a latent bug: unsupported-extension files previously triggered `captureSnapshot` before the format guard; now `captureSnapshot` only fires for .json/.csv.

Tests: `npm run test:hooks` (4 suites, 25 tests — 7 `useTierFilter` + 7 `useItemInteraction` + 6 `useBatchActions` + 5 `useImportHandlers`). Full suite: 26 suites, 179 tests, all green. Targeted finding F-010 (ImportExportPage 438 LOC): **carried forward** (import handlers extracted; export handlers remain — Priority 1 next loop).

## Loop 15 Implementation Review

See `implementation_review` in CURRENT_REVIEW.json.
