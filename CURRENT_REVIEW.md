### Discovery (first loop only)
- Source roots: `packages/core/src/`, `packages/state/src/`, `packages/ui/src/`, `packages/theme/src/`, `apps/web/src/`, `apps/native/src/`
- Test command: `npm run test:core && npm run test:state && npm run test:ui && npm run test:hooks` (at repo root)
- Build command: `cd apps/web && npm run build` (production); `cd apps/native && npx expo prebuild` (native)
- ADRs found: none (no `docs/adr/` directory)
- Domain terms (CONTEXT.md): none (no CONTEXT.md present; domain vocabulary derived from `AGENTS.md`: `Item`, `Items`, `TierConfig`, `tierOrder`, `unranked`, `HeadToHeadLogic`, `modelResolver`)
- Selected lens: Generic (Node section). React 19 + TypeScript + RTK 2.x + Vite + Jest.
- Provider: `claude_code`; loop_model: `claude-sonnet-4-6`; reviewer_model: `claude-sonnet-4-6`; spawn_isolation: `subagent`.
- Loop cap: 15 (bumped mid-session).
- Working tree: clean at Step 0.
- Test scope: full (no `--test-filter` set).

### Loop Counter
Loop 12 of 15 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 12 extracts `useItemInteraction` hook from TierBoardPage: 3 dispatch-only handlers (`handleItemClick`, `handleFileDrop`, `handleItemMediaDrop`) moved behind a stable Interface. TierBoardPage 507→456 LOC (51 LOC removed). 7 new Interface-level tests at `useItemInteraction.test.ts`. Suite: 23 suites, 153 tests, all green. Vite build clean. architecture_quality 6.5→7.0; simplicity 6.0→6.5.

## Scorecard (1-10)
- Architecture quality: 7.0 | UP | `apps/web/src/hooks/useItemInteraction.ts:1-81` — 3 dispatch-only handlers behind `ItemInteractionHandlers` Interface; page shell 507→456 LOC (`TierBoardPage.tsx:1-456`). Package DAG enforced. 9-anchor still not met: ImportExportPage at 438 LOC and HeadToHeadPage at 378 LOC are still large shells; page-level Module Depth across the app remains below contest grade.
- State management and runtime ownership: 6.5 | SAME | RTK slice ownership clear. One writer per concern across 6 slices (`packages/state/src/tierSlice.ts:1-343`). Memoized selectors in `selectors.ts`. No process-lifetime ownership pattern (store is implicit global). 9-anchor sub-threshold: process lifetime ownership not explicit.
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — `Item` interface is a data bag (`name?`, `imageUrl?`, `description?` all optional). `Items = Record<string, Item[]>` anemic. No smart constructors, no validated values. 9-anchor requires types prove most invariants by construction — not met.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json` (`core←state←apps`). No circular deps. `useTierFilter.ts`, `useTierDisplay.ts`, `useItemInteraction.ts` create cleaner hook interfaces. Within-app no module-level DAG enforcement. 9-anchor requires "DAG enforced; effects typed" — partial.
- Framework / platform best practices: 7.0 | SAME | Custom hooks idiomatic (7 focused hooks in `apps/web/src/hooks/`). RTK patterns correct. `useId()` for stable IDs in modal. `ImportExportPage.tsx` at 438 LOC still mixes orchestration and display logic without hook delegation. 9-anchor nearly met but no documented carve-outs.
- Concurrency and runtime safety: 7.0 | SAME | JavaScript single-threaded. No floating promises found in `apps/web/src/`. `useEffect` cleanup present in `CelebrationEffect.tsx`. No AbortController pattern for async fetches. No timer races (persistenceMiddleware per-instance after loop 8). 9-anchor partial.
- Code simplicity and clarity: 6.5 | UP | `apps/web/src/pages/TierBoardPage.tsx:1-456` (456 LOC, down from 507; 51 LOC extracted to `useItemInteraction.ts`). `ImportExportPage.tsx:1-438`. `AppShell.tsx:1-385`. `HeadToHeadPage.tsx:1-378`. `TemplatesPage.tsx:1-361`. TierBoardPage shrink structural proof: `useItemInteraction.ts` concentrates 3 handlers (82 LOC) behind a 17-line Interface.
- Test strategy and regression resistance: 7.5 | SAME | Suite: 23 suites, 153 tests (7 new in `useItemInteraction.test.ts`). `useItemInteraction.test.ts` — 7 tests: `onItemClick` toggleSelection (lines 60-75), `onFileDrop` image/video/audio variants (lines 79-117), `onItemMediaDrop` image/video (lines 121-153). Authority Map cross-check: `useItemInteraction` Interface now directly tested. Remaining ceiling: TierBoardPage page-level surface still has no direct test — 9-anchor not met.
- Overall implementation credibility: 8.0 | SAME | `useItemInteraction` extraction passes deletion test: complexity does not redistribute to callers (page receives single object). Replace-don't-layer satisfied: no prior tests for these handlers existed (no deletion needed); new tests added at the new Interface. Implementation reviewer approved. No fake-clean moves in loops 5-12.

## Authority Map
(Re-emitted because architecture_quality UP — structural change.)

**TierBoardPage modal state**
- Owner: `TierBoardPage` local state (5 `useState` declarations remain post-extraction: `showAddItem`, `showTierSettings`, `showKeyboardHelp`, `showStreamingPanel`, `editingItem`, `showCelebration`, `celebrationTier`)
- Allowed writers: `TierBoardPage` handlers only (inline setters)
- Observers / readers: JSX render tree within the same component
- Persistence seam: none
- Async mutation entry points: `handleMoveItemWithCelebration` (celebration state)
- Verdict: Single and clear (local component state; not a shared concern)

**Item interaction (dispatch-only handlers)**
- Owner: `apps/web/src/hooks/useItemInteraction.ts`
- Allowed writers: n/a (dispatches to RTK store)
- Observers / readers: `TierBoardPage` via `useItemInteraction(dispatch)` return value
- Persistence seam: none (delegates to tierSlice)
- Async mutation entry points: none (synchronous dispatch)
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
- Async mutation entry points: none (synchronous derivation)
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
- `TierBoardPage.tsx` — reduced from 757 to 456 LOC; 6 focused modules/hooks extracted (loops 9, 12).
- `useItemInteraction.ts` — 81 LOC; Interface tested at `useItemInteraction.test.ts` (7 tests, loop 12).

## Findings

### Finding #1: `TierBoardPage.tsx` at 456 LOC — god-component further reduced, carried forward (F-004)

**Why it matters** — At 456 LOC with 14 hook calls (7 useState, 1 useEffect on theme, 1 useEffect on data load, 5 useCallback, 3 useMemo/custom), the page remains a broad orchestration shell. Shallow-module test applies. Loop 12 removed 3 dispatch-only handlers but modal-coupled handlers remain.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` still bundles: 7 `useState` modal/UI state declarations (lines 80-86); `handleItemDoubleClick` (1 line, only `setEditingItem`); `handleMoveItemWithCelebration` (calls `setCelebrationTier` + `setShowCelebration`); `handleCopyLink` (reads 5 selectors); `handleBatchMoveToTier`/`handleBatchDelete` (read `selection`). All remaining handlers require modal state context or multi-selector reads — they either can't extract cleanly or would need the modal state to move with them.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-456` — 456 LOC (down from 507)
- `apps/web/src/pages/TierBoardPage.tsx:80-86` — 7 `useState` declarations (unchanged)
- `apps/web/src/pages/TierBoardPage.tsx:113-129` — 5 remaining useCallback handlers

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Modal coordination still requires reading 456 LOC.

**Locality impact** — Remaining handlers are coupled to modal state; no clean extraction path remains without co-extracting modal state.

**Metric signal, if any** — 456 LOC vs 95 LOC `ThemesPage.tsx`; 438 LOC `ImportExportPage.tsx` also large.

**Why this weakens submission** — Page shell still broad; further reduction requires modal state extraction as a co-move (higher-complexity change than handler extraction).

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Evaluate `useBatchActions` hook (`handleBatchMoveToTier` + `handleBatchDelete` share `dispatch` + `selection` — similar pattern to `useItemInteraction` but require `selection` as well). If selection is passed as argument, those 2 handlers extract cleanly. Otherwise accept 456 LOC as the natural orchestration floor given modal state coupling.

**Blast radius** — Change: `apps/web/src/pages/TierBoardPage.tsx`, potentially `apps/web/src/hooks/useBatchActions.ts`. Avoid: `apps/web/src/components/ItemModal.tsx`, `@tiercade/ui`.

---

## Simplification Check
- Structurally necessary: `useItemInteraction` extraction — 3 dispatch-only handlers share exactly `dispatch` as their dependency; extraction concentrates them behind a stable Interface. Deletion test passes: complexity vanishes from the page (not redistributed to callers — callers receive a single object).
- New seam justified: No new architectural Seam introduced. `useItemInteraction` is an in-process hook, not a protocol/port abstraction.
- Helpful simplification: TierBoardPage.tsx 507→456 LOC; 3 `useCallback` blocks + 2 import lines removed.
- Should NOT be done: Extracting `handleItemDoubleClick` — single-line body (`setEditingItem(item)`); extraction would be a costume layer. Extracting `handleMoveItemWithCelebration` — calls `setCelebrationTier`/`setShowCelebration` modal state; extraction without co-moving state would require passing setters as params (adding ceremony).
- Tests after fix: `apps/web/src/hooks/useItemInteraction.test.ts` — 7 tests at new Interface. No old tests to delete (Replace-don't-layer: no prior tests existed for these handlers).

## Improvement Backlog

### Priority 1: Evaluate `useBatchActions` extraction — may reduce TierBoardPage to ~420 LOC (F-004)
- Why it matters: `handleBatchMoveToTier` + `handleBatchDelete` share `dispatch` + `selection`. If `selection` is passed as an argument (read from store in the hook), extraction passes deletion test and removes 2 more useCallback blocks from TierBoardPage.
- Score impact: `architecture_quality` +0.0-0.5; `simplicity` +0.0-0.5 (modest; handlers are 10 LOC total; evaluate whether LOC reduction justifies the hook)
- Kind: structural
- Rank: minor

### Priority 2: ImportExportPage.tsx at 438 LOC — second largest page shell
- Why it matters: `ImportExportPage.tsx` has no hook delegation pattern applied. Some logic (file parsing, export format selection) may be extractable.
- Score impact: `architecture_quality` +0.5; `simplicity` +0.5 if extracted cleanly
- Kind: structural
- Rank: helpful

## Deepening Candidates

**`useBatchActions` (evaluation target)**
- Candidate module: Batch action handlers in `TierBoardPage`
- Source friction proven: F-004 — `TierBoardPage.tsx:113-129` (2 useCallback blocks sharing dispatch + selection)
- Why shallow or misplaced: Both handlers (`handleBatchMoveToTier`, `handleBatchDelete`) share `dispatch` + `selection` as their only dependencies
- Behavior to move behind Interface: batch-move-to-tier, batch-delete
- Dependency category: `in-process`
- Test surface after change: `apps/web/src/hooks/useBatchActions.test.ts` using `renderHook` + Provider wrapper (seeded selection in store)
- Smallest first step: Extract to `hooks/useBatchActions.ts`; pass `dispatch` and optionally read `selection` internally via `useAppSelector`
- What not to do: Do not pass `setters` as arguments; if selection is needed, read from the store inside the hook

**ImportExportPage orchestration depth**
- Candidate module: ImportExportPage handlers
- Source friction proven: F-004 carries forward; ImportExportPage at 438 LOC also flagged in loop 11
- Why shallow or misplaced: Page bundles file format logic, download triggers, and clipboard behavior without hook delegation
- Behavior to move behind Interface: export format selection, file download triggering
- Dependency category: `in-process`
- Test surface after change: `apps/web/src/hooks/useExportFormat.test.ts` (renderHook pattern)
- Smallest first step: Audit ImportExportPage for dispatch-only handlers; extract the dispatch-only subset first
- What not to do: Do not extract handlers that call DOM APIs directly without abstracting the side-effect

## Builder Notes
1. **Pattern** — Partial extraction opportunity in large page shells. **How to recognize** — Page has 8+ useCallback hooks; sorting them by dependency reveals a clean subset sharing only `dispatch` and a messier subset calling `setShow*` modal state setters. **Smallest coding rule** — Group handlers by their closure over local modal state vs. only `dispatch`; the dispatch-only group extracts cleanly; the modal-coupled group stays. **Stack example** — `handleFileDrop`, `handleItemMediaDrop`, `handleItemClick` in `TierBoardPage` shared only `dispatch`; extracted to `useItemInteraction.ts` (loop 12). `handleItemDoubleClick` (body: `setEditingItem(item)`) stayed in page.
2. **Pattern** — Batch operation handlers sharing a selector. **How to recognize** — Two useCallback handlers both read `selection` from the store AND both dispatch to the same concern (batch move / batch delete). **Smallest coding rule** — Extract both to a hook that reads `selection` internally via `useAppSelector`; the hook takes only `dispatch`. **Stack example** — `handleBatchMoveToTier` and `handleBatchDelete` in `TierBoardPage` both check `selection.length === 0` — same guard, same selector dependency.
3. **Pattern** — Extraction earns its keep when 3+ handlers share the same dependency. **How to recognize** — If only 1-2 handlers would move, the new hook's Interface is nearly as wide as its Implementation (shallow module test triggers). **Smallest coding rule** — Require ≥3 related handlers OR ≥2 handlers with substantial logic per handler before extracting a custom hook. Single-line handlers (`setEditingItem(item)`) stay inline. **Stack example** — `handleItemDoubleClick` has 1 line body; its extraction to `useItemDoubleClick.ts` would be a costume layer.

## Final Judge Narrative
Good app, place but not win. Loop 12 executes the `useItemInteraction` extraction that loop 10-11 evaluated. TierBoardPage 507→456 LOC; 3 dispatch-only handlers now behind a stable Interface with 7 tests. architecture_quality moves 6.5→7.0; simplicity 6.0→6.5. Both moves are honest: the structural proof is the new hook + removed handlers in the diff. Remaining backlog: F-004 still open (further reduction requires either `useBatchActions` extraction or modal state co-extraction — both more complex than this loop's clean dispatch-only group). architecture_quality and simplicity remain below 9-anchor because page shells across the app lack Interface Depth at the page level; `useItemInteraction` is local progress, not a system-level pattern change.

## Loop 12 Result

Three files changed: `useItemInteraction.ts` (new, 81 LOC), `useItemInteraction.test.ts` (new, 153 LOC, 7 tests), `TierBoardPage.tsx` (507→456 LOC, 3 handlers removed).

`useItemInteraction` extracts `handleItemClick`, `handleFileDrop`, `handleItemMediaDrop` — the three dispatch-only handlers from `TierBoardPage.tsx:133-190`. All three closed over only `dispatch`; no modal state dependency. The hook returns `{ onItemClick, onFileDrop, onItemMediaDrop }` as a single object. Page calls `const { onItemClick: handleItemClick, ... } = useItemInteraction(dispatch)`. Remaining handlers (`handleItemDoubleClick`, `handleCopyLink`, `handleMoveItemWithCelebration`, `handleBatchMoveToTier`, `handleBatchDelete`) stay in the page due to modal state or multi-selector dependencies.

Tests: `npm run test:hooks` (2 suites, 14 tests — 7 existing useTierFilter + 7 new useItemInteraction). Full suite: `npm run test:core && npm run test:state && npm run test:ui && npm run test:hooks` → 23 suites, 153 tests, all green. `npm run build` in `apps/web` → Vite build clean in 2.01s. Targeted finding F-004: **carried forward** (page further reduced; remaining handlers at natural modal-coupled floor).

## Loop 12 Implementation Review

See `implementation_review` in CURRENT_REVIEW.json.
