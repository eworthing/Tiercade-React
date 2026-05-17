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
Loop 14 of 18 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 14 extracts `useBatchActions` hook from TierBoardPage: 2 dispatch+selection handlers (`handleBatchMoveToTier`, `handleBatchDelete`) moved behind a stable Interface. TierBoardPage 456→443 LOC. 6 new Interface-level tests at `useBatchActions.test.ts`. Suite: 25 suites, 174 tests, all green. simplicity 6.5→7.0.

## Scorecard (1-10)
- Architecture quality: 7.0 | SAME | `apps/web/src/hooks/useBatchActions.ts:1-40` — 2 batch handlers behind `BatchActionHandlers` Interface; `TierBoardPage.tsx:1-443` (456→443 LOC). Package DAG enforced. 9-anchor still not met: ImportExportPage 438 LOC, HeadToHeadPage 378 LOC; page-level Module Depth below contest grade system-wide.
- State management and runtime ownership: 6.5 | SAME | RTK slice ownership clear. One writer per concern across 6 slices (`packages/state/src/tierSlice.ts:1-343`). Memoized selectors in `selectors.ts`. No process-lifetime ownership pattern (store is implicit global). 9-anchor sub-threshold.
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — `Item` interface is a data bag (`name?`, `imageUrl?`, `description?` all optional). `Items = Record<string, Item[]>` anemic. No smart constructors, no validated values. 9-anchor requires types prove most invariants by construction — not met.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json` (`core←state←apps`). No circular deps. `useTierFilter.ts`, `useTierDisplay.ts`, `useItemInteraction.ts`, `useBatchActions.ts` cleaner hook interfaces. Within-app no module-level DAG enforcement. 9-anchor requires "DAG enforced; effects typed" — partial.
- Framework / platform best practices: 7.0 | SAME | Custom hooks idiomatic (9 focused hooks in `apps/web/src/hooks/`). RTK patterns correct. `useId()` for stable IDs in modal. `ImportExportPage.tsx` at 438 LOC still mixes orchestration and display logic. 9-anchor nearly met but no documented carve-outs.
- Concurrency and runtime safety: 7.0 | SAME | JavaScript single-threaded. No floating promises found in `apps/web/src/`. `useEffect` cleanup present in `CelebrationEffect.tsx`. No AbortController for async fetches. `persistenceMiddleware` per-instance timer (loop 8). 9-anchor partial.
- Code simplicity and clarity: 7.0 | UP | `apps/web/src/hooks/useBatchActions.ts:1-40` — 2 batch handlers (13 LOC) extracted from `TierBoardPage.tsx:153-166`; page 456→443 LOC. `TierBoardPage` now has only 3 remaining inline handlers: `handleItemDoubleClick` (1-line modal setter), `handleCopyLink` (5-selector read), `handleMoveItemWithCelebration` (modal + celebration state) — all have clear modal-state coupling that keeps them inline by design.
- Test strategy and regression resistance: 8.0 | SAME | Suite: 25 suites, 174 tests. `useBatchActions.test.ts` — 6 tests: empty-selection guard (onBatchMoveToTier, onBatchDelete), move to target tier, delete selected item, undo snapshot assertions. Authority Map cross-check: `useBatchActions` Interface now directly tested. Remaining ceiling: TierBoardPage page-level surface still untested — 9-anchor not met.
- Overall implementation credibility: 8.0 | SAME | `useBatchActions` extraction passes deletion test: complexity vanishes from page (batch guards + dispatch logic concentrated in hook). Replace-don't-layer satisfied: no prior tests existed for these handlers; 6 new tests added at new Interface. Implementation reviewer approved. No fake-clean moves in loops 5-14.

## Authority Map
(Re-emitted because simplicity UP — structural change.)

**TierBoardPage modal state**
- Owner: `TierBoardPage` local state (7 `useState` declarations, lines 75-82)
- Allowed writers: `TierBoardPage` handlers (inline setters)
- Observers / readers: JSX render tree within `TierBoardPage`
- Persistence seam: none
- Async mutation entry points: `handleMoveItemWithCelebration` (celebration state)
- Verdict: Single and clear (local component state; not a shared concern)

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
- `undoRedoThunks` ��� direct test suite covering cross-slice behavior (F-003 resolved loop 7).
- `TierBoardPage.tsx` — reduced from 757 to 443 LOC; 7 focused modules/hooks extracted (loops 9, 12, 14).
- `useBatchActions.ts` — 40 LOC; Interface tested at `useBatchActions.test.ts` (6 tests, loop 14).
- `useItemInteraction.ts` — 81 LOC; Interface tested at `useItemInteraction.test.ts` (7 tests, loop 12).

## Findings

### Finding #1: `TierBoardPage.tsx` at 443 LOC — god-component reduced further; remaining handlers at natural modal-coupled floor (F-004)

**Why it matters** — At 443 LOC (down from 757 at loop 5 start), the page retains 3 inline handlers and 7 `useState` declarations. Shallow-module test applies to the page as a whole. The remaining handlers all require modal state context — further extraction would require co-extracting state, raising ceremony.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` still bundles: 7 `useState` modal/UI state declarations (lines 75-82); `handleItemDoubleClick` (1 line, only `setEditingItem`); `handleCopyLink` (reads 5 selectors + URL generation); `handleMoveItemWithCelebration` (calls modal state setters: `setCelebrationTier` + `setShowCelebration`). All remaining handlers require modal state context — no clean dispatch-only subset remains.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC
- `apps/web/src/pages/TierBoardPage.tsx:75-82` — 7 `useState` declarations
- `apps/web/src/pages/TierBoardPage.tsx:140-183` — 3 remaining inline handlers (`handleItemDoubleClick`, `handleCopyLink`, `handleMoveItemWithCelebration`)

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Modal coordination still requires reading 443 LOC.

**Locality impact** — Remaining handlers are coupled to modal state; no clean extraction path without co-moving modal state.

**Metric signal, if any** — 443 LOC vs 95 LOC `ThemesPage.tsx`; `ImportExportPage.tsx` also 438 LOC.

**Why this weakens submission** — Page shell still broad; remaining reduction requires either modal-state co-extraction (complexity increase) or accepting 443 LOC as the natural floor.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept 443 LOC as the natural orchestration floor given modal state coupling. The remaining handlers (`handleItemDoubleClick` at 1 LOC, `handleCopyLink`, `handleMoveItemWithCelebration`) are too coupled to modal state for clean extraction without ceremony. Alternatively: evaluate `ImportExportPage.tsx` at 438 LOC for hook delegation — more extraction potential there.

**Blast radius** — Change: `apps/web/src/pages/TierBoardPage.tsx` (if extracting further) OR `apps/web/src/pages/ImportExportPage.tsx`. Avoid: `apps/web/src/components/ItemModal.tsx`, `@tiercade/ui`.

---

### Finding #2: `ImportExportPage.tsx` at 438 LOC — no hook delegation applied (new, F-new)

**Why it matters** — `ImportExportPage.tsx` is the second-largest page at 438 LOC with no hook extraction applied. Import/export orchestration (file parsing, format dispatch, download triggering) is mixed with UI display inline. It has the same dispatch-only pattern potential as earlier extractions.

**What is wrong** — `apps/web/src/pages/ImportExportPage.tsx:1-438` bundles: file import dispatch (JSON, CSV), export format selection, download triggers, drop zone handling — all mixed with presentational JSX. No custom hooks delegate any of this logic.

**Evidence** —
- `apps/web/src/pages/ImportExportPage.tsx:1-438` — 438 LOC with no hook delegation
- `apps/web/src/pages/ImportExportPage.tsx:1-62` — `EXPORT_FORMATS` constant array + inline styles mixed with page logic

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — All import/export logic requires reading 438 LOC.

**Locality impact** — File handling changes spread across one large file with no extraction boundary.

**Metric signal, if any** — 438 LOC second only to TierBoardPage at 443 LOC.

**Why this weakens submission** — Second-largest page without any hook delegation; pattern established by TierBoardPage should apply.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Identify dispatch-only handlers in ImportExportPage (JSON import, CSV import, clear/reset actions). Extract to `useImportHandlers` hook. Leave download/export side effects in the page or `useExport` hook (already exists).

**Blast radius** — Change: `apps/web/src/pages/ImportExportPage.tsx`, `apps/web/src/hooks/useImportHandlers.ts` (new). Avoid: `@tiercade/core/modelResolver`, `@tiercade/state/importJSON`.

---

## Simplification Check
- Structurally necessary: `useBatchActions` extraction — 2 batch handlers share exactly `dispatch` + `selection` as their dependencies; extraction concentrates them behind a stable Interface. Deletion test passes: complexity vanishes from the page (both guards + dispatch calls move to hook; caller receives single object).
- New seam justified: No new architectural Seam introduced. `useBatchActions` is an in-process hook, not a protocol/port abstraction.
- Helpful simplification: TierBoardPage.tsx 456→443 LOC; 2 `useCallback` blocks + 3 import lines removed.
- Should NOT be done: Extracting `handleItemDoubleClick` — single-line body (`setEditingItem(item)`); extraction would be a costume layer. Extracting `handleMoveItemWithCelebration` �� calls `setCelebrationTier`/`setShowCelebration` modal state + `presentation.*` context; extraction without co-moving state would require passing setters as params (ceremony).
- Tests after fix: `apps/web/src/hooks/useBatchActions.test.ts` — 6 tests at new Interface. No old tests to delete (Replace-don't-layer: no prior tests existed for these handlers).

## Improvement Backlog

### Priority 1: Evaluate hook delegation for `ImportExportPage.tsx` at 438 LOC (F-new)
- Why it matters: Second-largest page with no hook delegation. Dispatch-only import handlers (JSON import, CSV import) follow the same pattern as `useItemInteraction` and `useBatchActions`.
- Score impact: `architecture_quality` +0.0-0.5; `simplicity` +0.0-0.5 if extracted cleanly
- Kind: structural
- Rank: helpful

### Priority 2: Accept F-004 residual — TierBoardPage at natural modal floor
- Why it matters: Remaining TierBoardPage handlers are all modal-state coupled; no further clean extraction without co-moving state. Accept 443 LOC as the design floor.
- Score impact: `architecture_quality` +0.0 (acceptance changes no score); promote F-004 to accepted residual
- Kind: polish
- Rank: minor

## Deepening Candidates

**ImportExportPage import handler extraction**
- Candidate module: Import dispatch handlers in `ImportExportPage`
- Source friction proven: F-002 (new) — `ImportExportPage.tsx:1-438` (438 LOC, no hook delegation)
- Why shallow or misplaced: JSON/CSV import dispatch handlers share only `dispatch` and file data as dependencies — same pattern as `useItemInteraction`
- Behavior to move behind Interface: import-json, import-csv dispatch, clear/reset actions
- Dependency category: `in-process`
- Test surface after change: `apps/web/src/hooks/useImportHandlers.test.ts` (renderHook + Provider pattern, same as useBatchActions.test.ts)
- Smallest first step: Grep for `useCallback` blocks in ImportExportPage that only close over `dispatch`; extract to `useImportHandlers.ts`
- What not to do: Do not extract handlers that trigger DOM APIs (file download links, clipboard) without abstracting the side-effect; `useExport` already handles PNG/clipboard

No deeper structural candidates remain after this loop — the page-shell depth gap is a real concern but the remaining cleavages are more complex.

## Builder Notes
1. **Pattern** — Repeated successful extraction: same dispatch-only pattern across 3 hooks (`useItemInteraction`, `useBatchActions`, and the potential `useImportHandlers`). **How to recognize** — Look for `useCallback` blocks that close only over `dispatch` (and optionally a single selector like `selection`); no `setState` calls inside. **Smallest coding rule** — "If a handler's only dependencies are `dispatch` and at most one `useAppSelector` value, it belongs in its own hook." Single-line handlers (body is one `setX(y)`) never pass this test. **Stack example** — `handleBatchMoveToTier` + `handleBatchDelete` both had `[dispatch, selection]` deps and no modal state access; extracted cleanly to `useBatchActions`.
2. **Pattern** — 443 LOC page at natural floor. **How to recognize** — All remaining `useCallback` blocks close over `setState` setters or multiple disparate selectors — the dependency graph is tangled, not clustered. Extracting would require passing setters as params (ceremony) or co-moving all modal state. **Smallest coding rule** — Extraction only when the dependency cluster is clean (1-2 deps max). Passing `setShowModal` as a parameter to a hook produces a costume layer, not Depth. **Stack example** — `handleMoveItemWithCelebration` closes over `dispatch`, `presentation.isPresenting`, `presentation.celebrateSTier`, `setCelebrationTier`, `setShowCelebration` — 5 dependencies across 3 concerns; no clean hook boundary.
3. **Pattern** — Test-at-new-Interface discipline maintained across 4 loops. **How to recognize** — Every new hook has a `*.test.ts` companion created in the same commit. The tests use `renderHook` + real RTK store (not mocks) to exercise the actual dispatch-and-read cycle. **Smallest coding rule** — "New hook = new test file in the same PR. Tests assert state changes in the store, not just that the handler was called." **Stack example** — `useBatchActions.test.ts` seeds items, seeds selection via `toggleSelection`, calls `onBatchDelete`, asserts `state.tier.tiers["S"]` no longer contains the deleted item.

## Final Judge Narrative
Good app, place but not win. Loop 14 executes the `useBatchActions` extraction that loops 12-13 backlogged. TierBoardPage 456→443 LOC; 2 dispatch+selection handlers now behind a stable Interface with 6 tests. simplicity moves 6.5→7.0: structural proof is the new hook + removed useCallback blocks. Remaining backlog: F-004 at natural modal floor (accept as residual); ImportExportPage at 438 LOC is the next extraction target. architecture_quality holds at 7.0 — the system-level pattern (page shells without Interface Depth) persists across app; individual hook extractions improve Locality but do not yet meet the 9-anchor. Average score 7.0 up from 6.89 (previous loop avg).

## Loop 14 Result

Three files changed: `useBatchActions.ts` (new, 40 LOC), `useBatchActions.test.ts` (new, 175 LOC, 6 tests), `TierBoardPage.tsx` (456→443 LOC, 2 handlers removed, 2 imports removed).

`useBatchActions` extracts `handleBatchMoveToTier` and `handleBatchDelete` — the two batch-operation handlers from `TierBoardPage.tsx:153-166`. Both closed over `dispatch` + `selection`; selection is now read internally via `useAppSelector(selectSelection)`. The hook returns `{ onBatchMoveToTier, onBatchDelete }` as a single object. Page calls `const { onBatchMoveToTier: handleBatchMoveToTier, onBatchDelete: handleBatchDelete } = useBatchActions(dispatch)`. Remaining handlers (`handleItemDoubleClick`, `handleCopyLink`, `handleMoveItemWithCelebration`) stay in the page due to modal state or multi-selector dependencies.

Tests: `npm run test:hooks` (3 suites, 20 tests — 7 `useTierFilter` + 7 `useItemInteraction` + 6 `useBatchActions`). Full suite: `npm run test:core && npm run test:state && npm run test:ui && npm run test:hooks` → 25 suites, 174 tests, all green. Targeted finding F-004: **carried forward** (page further reduced; remaining handlers at natural modal-coupled floor — promote to accepted residual next loop).

## Loop 14 Implementation Review

See `implementation_review` in CURRENT_REVIEW.json.
