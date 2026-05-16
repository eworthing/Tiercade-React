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
Loop 11 of 15 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 11 resolves F-007 (useTierFilter unit test) and F-008 (filterAllTiers unit test). Suite grows from 20→22 suites, 114→146 tests, all green. test_strategy moves 7.0→7.5: two Interface-level test gaps closed. Scorecard re-derived from source per G26; all other dimensions unchanged (no structural changes to non-test files).

## Scorecard (1-10)
- Architecture quality: 6.5 | SAME | `apps/web/src/pages/TierBoardPage.tsx:1-507` (507 LOC, 20 hook calls, shallow orchestration shell); `apps/web/src/pages/ImportExportPage.tsx:1-438` (438 LOC); `apps/web/src/pages/HeadToHeadPage.tsx:1-378` (378 LOC). 9-anchor requires contest-grade module graph with Interface Depth; page shells remain orchestration wrappers. Package DAG enforced by workspace. No structural changes to source this loop.
- State management and runtime ownership: 6.5 | SAME | RTK slice ownership clear. One writer per concern across 6 slices (`packages/state/src/tierSlice.ts:1-343`). Memoized selectors in `selectors.ts`. No process-lifetime ownership pattern (store is implicit global). 9-anchor sub-threshold: process lifetime ownership not explicit.
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — `Item` interface is a data bag (`name?`, `imageUrl?`, `description?` all optional). `Items = Record<string, Item[]>` anemic. No smart constructors, no validated values. 9-anchor requires types prove most invariants by construction — not met.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json` (`core←state←apps`). No circular deps. `useTierFilter.ts`, `useTierDisplay.ts` create cleaner hook interfaces. Within-app no module-level DAG enforcement. 9-anchor requires "DAG enforced; effects typed" — partial.
- Framework / platform best practices: 7.0 | SAME | Custom hooks idiomatic (6 focused hooks in `apps/web/src/hooks/`). RTK patterns correct. `useId()` for stable IDs in modal. `ImportExportPage.tsx` at 438 LOC still mixes orchestration and display logic without hook delegation. 9-anchor nearly met but no documented carve-outs.
- Concurrency and runtime safety: 7.0 | SAME | JavaScript single-threaded. No floating promises found in `apps/web/src/`. `useEffect` cleanup present in `CelebrationEffect.tsx`. No AbortController pattern for async fetches. No timer races (persistenceMiddleware per-instance after loop 8). 9-anchor partial.
- Code simplicity and clarity: 6.0 | SAME | `apps/web/src/pages/TierBoardPage.tsx:1-507` (507 LOC, 20 hook calls). `ImportExportPage.tsx:1-438`. `AppShell.tsx:1-385`. `HeadToHeadPage.tsx:1-378`. `TemplatesPage.tsx:1-361`. All large orchestration shells. No simplification changes this loop.
- Test strategy and regression resistance: 7.5 | UP | `packages/core/test/filtering.test.ts` — 25 new tests covering `filterAllTiers` happy path (line 128-175), multi-tier structure preservation (lines 129-147), empty tiers (line 150-152), `hasMedia` filter cross-tier (lines 153-172), plus `hasActiveFilters`, `itemMatchesFilters`, `filterItems`. `apps/web/src/hooks/useTierFilter.test.ts` — 7 new tests using `renderHook` + `Provider` wrapper: filter derivation (lines 67-82), searchText filter (lines 84-95), alphabetical sort (lines 97-106), custom order preservation (lines 108-115), all 3 dispatch callbacks (lines 121-162). 22 suites, 146 tests. Authority Map cross-check: useTierFilter Interface now directly tested at `useTierFilter.test.ts:67-162`; filterAllTiers Interface tested at `filtering.test.ts:96-176`. G24 score-ceiling for 7.5 validated: F-007 and F-008 gaps closed; remaining test-strategy ceiling is the TierBoardPage page-level surface (no direct page test), which keeps the 9-anchor unmet.
- Overall implementation credibility: 8.0 | UP | Loop 11 adds 32 tests at the Interfaces of two untested Modules (filterAllTiers, useTierFilter). Both additions pass deletion test and Replace-don't-layer: no shallow unit tests existed before, so no deletion required. Implementation reviewer approved (see below). Credibility raised because the test gap was the one remaining honesty leak in the otherwise-clean loop 5-10 trajectory.

## Authority Map
(Re-emitted because test_strategy UP — G24 cross-check.)

**TierBoardPage modal state**
- Owner: `TierBoardPage` local state (7 `useState` declarations, lines 80-86)
- Allowed writers: `TierBoardPage` handlers only (inline setters)
- Observers / readers: JSX render tree within the same component
- Persistence seam: none
- Async mutation entry points: `handleMoveItemWithCelebration` (celebration state)
- Verdict: Single and clear (local component state; not a shared concern)

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
- `packages/core` domain layer framework-free; 12 suites, 94 tests covering pure functions end-to-end (filtering.test.ts adds 25 tests loop 11).
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace `package.json`: `core←state←apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage (F-005 resolved loop 8); per-instance timer (F-006 resolved loop 8).
- `undoRedoThunks` — direct test suite covering cross-slice behavior (F-003 resolved loop 7).
- `TierBoardPage.tsx` — reduced from 757 to 507 LOC; 5 focused modules extracted (loop 9).
- `useTierFilter.ts` — 91 LOC; Interface now directly tested (`useTierFilter.test.ts`; 7 tests, loop 11).

## Findings

### Finding #1: `TierBoardPage.tsx` at 507 LOC — god-component partially resolved, carried forward (F-004)

**Why it matters** — At 507 LOC with 20 hook calls (7 useState, 2 useEffect, 8 useCallback, 3 useMemo), the page remains a shallow orchestration wrapper. Shallow-module test still partially applies. No loop-11 changes target this.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` still bundles: 7 `useState` modal/UI state declarations (lines 80-86); 4 item interaction handlers (`handleFileDrop`, `handleItemMediaDrop`, `handleItemClick`, `handleMoveItemWithCelebration`) sharing `dispatch` + `captureSnapshot` scope; 2 `useEffect` calls; JSX render tree. Item interaction handlers could pass deletion test as a `useItemInteraction` hook, but evaluation not completed.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-507` — 507 LOC
- `apps/web/src/pages/TierBoardPage.tsx:80-86` — 7 `useState` declarations
- `apps/web/src/pages/TierBoardPage.tsx:133-237` — 8 `useCallback` declarations

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Modal coordination and item handling require reading 507 LOC.

**Locality impact** — Bug in file drop handling requires navigating 507 LOC of orchestration.

**Metric signal, if any** — 507 LOC vs 95 LOC `ThemesPage.tsx`; 438 LOC `ImportExportPage.tsx` also large.

**Why this weakens submission** — Page shell still concentrates multiple concerns; test surface at page level is impractical.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Evaluate `useItemInteraction` hook (handleFileDrop + handleItemMediaDrop + handleItemClick + handleItemDoubleClick): if 4 handlers share only `dispatch` + `captureSnapshot` with no modal state dependency, extraction passes deletion test. Otherwise accept 507 LOC as natural page orchestration floor.

**Blast radius** — Change: `apps/web/src/pages/TierBoardPage.tsx`, potentially `apps/web/src/hooks/useItemInteraction.ts`. Avoid: `apps/web/src/components/ItemModal.tsx`, `@tiercade/ui`.

---

## Simplification Check
- Structurally necessary: F-008 — `filterAllTiers` Interface had zero tests vs `sortItems` 8 tests; Interface-as-test-surface test required parity. F-007 — `useTierFilter` is the highest-risk extracted hook; Interface-as-test-surface test proved filter+sort+dispatch correctness.
- New seam justified: No new seams introduced. No new modules. Test-only files.
- Helpful simplification: `apps/web/jest.config.ts` + root `test:hooks` script adds a sustainable path for testing web-layer hooks without adding npm dependencies.
- Should NOT be done: Adding a mock Redux store factory abstraction — one-off `makeStore` function per test file is the idiomatic pattern (established in `undoRedoThunks.test.ts`).
- Tests after fix: For F-008: `packages/core/test/filtering.test.ts` at filtering Interface (Replace-don't-layer not triggered — no prior tests existed). For F-007: `apps/web/src/hooks/useTierFilter.test.ts` at hook Interface (Replace-don't-layer not triggered — no prior tests existed).

## Improvement Backlog

### Priority 1: Evaluate `useItemInteraction` extraction — may reduce TierBoardPage below 400 LOC (F-004)
- Why it matters: 4 item interaction handlers (`handleFileDrop`, `handleItemMediaDrop`, `handleItemClick`, `handleMoveItemWithCelebration`) share only `dispatch` + `captureSnapshot`. If none call local `setShow*` modal setters, extraction to `useItemInteraction.ts` passes deletion test and reduces TierBoardPage from 507 to approximately 400 LOC.
- Score impact: `architecture_quality` +0.5; `simplicity` +0.5; `test_strategy` +0.5 (new test at useItemInteraction Interface)
- Kind: structural
- Rank: helpful

## Deepening Candidates

**`useItemInteraction` (evaluation target)**
- Candidate module: Item interaction handlers in `TierBoardPage`
- Source friction proven: F-004 — `apps/web/src/pages/TierBoardPage.tsx:133-237` (8 useCallback declarations; 4 item handlers may share only `dispatch` + `captureSnapshot`)
- Why shallow or misplaced: If 4 handlers (`handleFileDrop`, `handleItemMediaDrop`, `handleItemClick`, `handleMoveItemWithCelebration`) share only `dispatch` and `captureSnapshot` without modal state dependency, the Interface is misplaced inside the page shell
- Behavior to move behind Interface: file drop, media drop, item click/double-click, celebration trigger
- Dependency category: `in-process`
- Test surface after change: `apps/web/src/hooks/useItemInteraction.test.ts` using `renderHook` + Provider wrapper (same pattern as `useTierFilter.test.ts`)
- Smallest first step: Verify no `setShow*` modal state setters called from within the 4 handlers; if clean, extract to `hooks/useItemInteraction.ts`
- What not to do: Do not extract `handleCopyLink` (uses clipboard side-effect differently); do not extract modal setters (tightly coupled to JSX)

## Builder Notes
1. **Pattern** — Test gap after extraction. **How to recognize** — A new hook file exists with no corresponding `.test.ts`. **Smallest coding rule** — For any hook that calls `dispatch` or reads from the store, add one `renderHook` test: create store with known state; trigger the callback; assert state changed. **Stack example** — `useTierFilter.test.ts:67-82`: `renderHook(() => useTierFilter(), { wrapper: wrapper(store) })`; assert `processedTiers` counts reflect the loaded tiers.
2. **Pattern** — Coverage asymmetry between parallel pure functions. **How to recognize** — One function (`sortItems`) has 8 tests; a parallel function (`filterAllTiers`) called from the same consumer has 0. **Smallest coding rule** — When adding tests for any function in `packages/core/`, check its sibling functions in the same file and add proportional tests. **Stack example** — `filtering.ts` and `sorting.ts` both called from `useTierFilter`; loop 11 closed the asymmetry.
3. **Pattern** — God-component with partially extractable handlers. **How to recognize** — Page component with 8+ `useCallback` hooks; some share only Redux `dispatch` + domain state; others call local `setShow*` modal state setters. **Smallest coding rule** — Group handlers by their dependencies: handlers touching only `dispatch` + domain state extract cleanly; handlers calling local `setShow*` must stay in the component. **Stack example** — `handleFileDrop` and `handleItemMediaDrop` in `TierBoardPage` likely share only `dispatch` + `captureSnapshot`; `handleMoveItemWithCelebration` calls `setShowCelebration`.

## Final Judge Narrative
Good app, place but not win. Loop 11 closes the two test-strategy gaps (F-007, F-008) that held test_strategy at 7.0 for loops 9-10. 32 new tests at the real Interfaces — no shallow mocks, no implementation mirroring. Suite at 146 tests, 22 suites; all green. credibility moves to 8.0 because the one remaining honesty leak (untested extracted Modules) is now resolved. Remaining backlog: F-004 (TierBoardPage 507 LOC; evaluation needed for useItemInteraction extraction). architecture_quality and simplicity are held at 6.5/6.0 by page shell Depth — the 9-anchor requires Module Depth, not just LOC reduction, and the page-shell pattern is a real gap. Future risk: the useItemInteraction extraction requires a careful dependency audit; premature extraction without confirming modal state independence would add ceremony.

## Loop 11 Result

Two new test files added targeting open Findings F-007 and F-008.

**F-008 (resolved)**: `packages/core/test/filtering.test.ts` — 25 tests across `hasActiveFilters` (7 tests), `itemMatchesFilters` (8 tests), `filterItems` (3 tests), and `filterAllTiers` (7 tests). Test targets include: passthrough when no active filters (`filtering.test.ts:128-130` — referential identity check); multi-tier structure preservation with matching items across S/A/unranked (`filtering.test.ts:133-147`); empty-tiers edge case (`filtering.test.ts:149-152`); `hasMedia` cross-tier filter (`filtering.test.ts:153-172`). `npm run test:core`: 12 suites, 94 tests, all green.

**F-007 (resolved)**: `apps/web/src/hooks/useTierFilter.test.ts` — 7 tests using `renderHook` + `Provider(makeStore())` wrapper. `apps/web/jest.config.ts` added (jsdom environment, uses root-level devDependencies, no new package installs). Root `package.json` gains `test:hooks` script. Tests cover: passthrough when no filters (`useTierFilter.test.ts:67-82`), searchText filter (`lines 84-95`), alphabetical sort (`lines 97-106`), custom order preservation (`lines 108-115`), `handleSearchChange` dispatch (`lines 121-132`), `handleClearFilters` dispatch (`lines 134-145`), `handleSortModeChange` dispatch (`lines 147-162`). `npm run test:hooks`: 1 suite, 7 tests, all green.

Full suite: `npm run test:core && npm run test:state && npm run test:ui && npm run test:hooks` → 22 suites, 146 tests, all green. Targeted findings F-007 and F-008: **resolved**. No unintended scorecard regression observed.

## Loop 11 Implementation Review

See `implementation_review` in CURRENT_REVIEW.json.
