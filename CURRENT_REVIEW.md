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
Loop 9 of 10 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 9 resolves F-004 partially: `TierBoardPage.tsx` split from 757 LOC to 507 LOC by extracting 5 focused modules — `useShareImport`, `useTierDisplay`, `useTierFilter`, `CelebrationEffect`, `TierBoardToolbar`. Each module passes deletion test. Full suite: 20 suites, 114 tests, all green. Build clean. `simplicity` moves 5→6, `architecture_quality` moves 6→6.5.

## Scorecard (1-10)
- Architecture quality: 6.5 | UP | `apps/web/src/hooks/useTierFilter.ts` (new 91-LOC module concentrating sort/filter concern); `TierBoardPage.tsx:1-507` (250 LOC reduction from 757). Five extracted modules each pass deletion test. Package DAG intact; no costume layers introduced.
- State management and runtime ownership: 6.5 | SAME | RTK slice ownership unchanged. No new state ownership changes this loop.
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — `Item` interface sound. No domain model changes this loop.
- Data flow and dependency design: 6.5 | SAME | `useTierFilter` and `useTierDisplay` create cleaner interfaces, but the broader data flow complexity (no explicit DAG enforcement) unchanged.
- Framework / platform best practices: 7.0 | SAME | React custom hook extraction is idiomatic. RTK patterns unchanged.
- Concurrency and runtime safety: 7.0 | SAME | JavaScript single-threaded. No concurrency model changes.
- Code simplicity and clarity: 6.0 | UP | `TierBoardPage.tsx:1-507` — 250 LOC removed. Five extracted modules at 33-107 LOC each; all focused single-concern. Prior 757-LOC god-component reduced to 507-LOC orchestration shell. Deletion test: each extracted module earns its keep (`useTierFilter`: concentrates filterAllTiers + sortItems + 4 dispatch callbacks; `useTierDisplay`: concentrates theme resolution + color/label merging; `useShareImport`: URL share import effect; `CelebrationEffect`: self-contained animation; `TierBoardToolbar`: pure props toolbar).
- Test strategy and regression resistance: 7.0 | SAME | No new unit test surfaces added. Extracted modules behavior covered transitively: `sortItems` tested at `packages/core/test/sorting.test.ts:27`; toolbar/board render exercised at `apps/web/e2e/tier-board.spec.ts:94-105`. No regression: full suite 20 suites 114 tests green.
- Overall implementation credibility: 7.5 | SAME | No fake-clean moves. Each extracted module is genuinely self-contained. No re-export shells. No empty protocols.

## Strengths That Matter
- `packages/core` domain layer framework-free; 11 suites 69 tests covering pure functions end-to-end.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace package.json: `core`←`state`←`apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage (F-005 resolved); debounce timer per-instance.
- `TierBoardPage.tsx` — reduced from 757 to 507 LOC; 5 focused modules extracted; page shell is genuine orchestration.
- `useTierFilter.ts` — concentrates all sort/filter derived state + dispatch callbacks behind one interface (91 LOC).
- `useTierDisplay.ts` — concentrates all theme resolution + color/label merging behind one interface (63 LOC).

## Findings

### Finding #1: `TierBoardPage.tsx` at 507 LOC — god-component partially resolved, still over threshold (F-004)

**Why it matters** — At 507 LOC, the page still has 7 `useState` calls and 3 major item interaction handlers bundled together. Progress made (250 LOC removed), but the shallow-module test still applies to remaining content.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` still contains: 7 `useState` calls for modal/UI state (showAddItem, showTierSettings, showKeyboardHelp, showStreamingPanel, editingItem, showCelebration, celebrationTier); 2 `useEffect` calls; 4 item interaction handlers (handleFileDrop, handleItemMediaDrop, handleItemClick, handleItemDoubleClick); batch operation handlers; celebration handler; JSX render. These concerns are more tightly coupled than what was extracted — modal state coordinates with JSX; item handlers need dispatch + tiers context.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-507` — 507 LOC (down from 757)
- `apps/web/src/pages/TierBoardPage.tsx:79-87` — 7 `useState` declarations for modal/UI state
- `apps/web/src/pages/TierBoardPage.tsx:133-220` — item interaction handlers bundled with modal state setters

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Modal coordination and item handling still require reading the full 507-LOC page.

**Locality impact** — Bug in file drop handling requires navigating 507 LOC of orchestration code.

**Metric signal, if any** — 507 LOC vs 95 LOC for `ThemesPage.tsx`; ratio 5:1 (improved from 8:1).

**Why this weakens submission** — The page shell still concentrates concerns that could be isolated — though further extraction risks costume-layer territory without careful evaluation.

**Severity** — Noticeable weakness (reduced from prior evaluation)

**ADR conflicts** — none

**Minimal correction path** — Evaluate whether `useItemInteraction` hook (handleFileDrop + handleItemMediaDrop + handleItemClick + handleItemDoubleClick) passes deletion test — these 4 handlers share `dispatch` and `captureSnapshot` but no modal state. If they pass deletion test, extract to `useItemInteraction.ts`. Otherwise, accept 507 LOC as natural page orchestration floor.

**Blast radius** — Change: `apps/web/src/pages/TierBoardPage.tsx`, potentially new `apps/web/src/hooks/useItemInteraction.ts`. Avoid: `apps/web/src/components/ItemModal.tsx`, `@tiercade/ui`.

---

### Finding #2: No unit test surface for extracted hooks — indirect coverage only

**Why it matters** — `useShareImport`, `useTierDisplay`, `useTierFilter` are new modules with real behavior but no direct unit tests. If their logic changes, the only regression signal is E2E tests (slow) or manual testing.

**What is wrong** — Three new hooks exported from `apps/web/src/hooks/` have no corresponding test files. `useTierFilter` has the most risk: `filterAllTiers` behavior has no direct core test; `useTierDisplay` theme resolution path has no test. The extracted modules are not deeper than the original inline code — they're equally shallow from a testing perspective.

**Evidence** —
- `apps/web/src/hooks/useTierFilter.ts` — 91 LOC, no test file
- `apps/web/src/hooks/useTierDisplay.ts` — 63 LOC, no test file
- `apps/web/src/hooks/useShareImport.ts` — 33 LOC, no test file
- `packages/core/test/` — no `filterAllTiers.test.ts`

**Architectural test failed** — Interface-as-test-surface

**Dependency category** — `in-process`

**Leverage impact** — Extracted modules improve Leverage (callers learn less) but without tests the Locality gain is incomplete — maintainers cannot refactor safely.

**Locality impact** — Bug in `useTierFilter` requires manual testing to detect regression.

**Metric signal, if any** — 3 new hooks, 0 new test files.

**Why this weakens submission** — Test strategy score ceiling stays at 7 until at least one of the extracted hooks has a test at its new Interface.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Add one test for `useTierFilter` using `renderHook` from `@testing-library/react`: mount with a mock store, dispatch `setSortMode`, assert `processedTiers` reflects sorted order. This is the highest-leverage test addition — it covers `filterAllTiers` + `sortItems` integration at the hook Interface.

**Blast radius** — Change: new `apps/web/src/hooks/useTierFilter.test.ts`. Avoid: touching the hook implementation.

---

### Finding #3: `filterAllTiers` has no direct test in `@tiercade/core`

**Why it matters** — `filterAllTiers` is called by `useTierFilter` (which is now used in the main page) but has no test in `packages/core/test/`. `sortItems` is tested but the filter+sort integration path lacks coverage.

**What is wrong** — `packages/core/src/filters.ts` (or wherever `filterAllTiers` is defined) has no test file. The function filters all tiers by text/mediaType — any regression would be silent until E2E or manual testing.

**Evidence** —
- `packages/core/test/` — no filtering.test.ts or filterAllTiers.test.ts
- `apps/web/src/hooks/useTierFilter.ts:42-53` — `filterAllTiers` called inside `processedTiers` useMemo

**Architectural test failed** — Interface-as-test-surface

**Dependency category** — `in-process`

**Leverage impact** — `filterAllTiers` is used in the main page path; untested regression would affect all users.

**Locality impact** — Filter logic regression requires E2E or manual detection.

**Metric signal, if any** — 0 filter tests in core; `sortItems` has 8 tests.

**Why this weakens submission** — Test coverage asymmetry between sorting (8 tests) and filtering (0 tests) is a credibility gap.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Add `packages/core/test/filtering.test.ts` with 3-4 tests: searchText filter, mediaType filter, combined filter. Import `filterAllTiers` or `filterItems` directly.

**Blast radius** — Change: new `packages/core/test/filtering.test.ts`. Avoid: production code.

## Simplification Check
- Structurally necessary: Extracting `useTierFilter`, `useTierDisplay`, `useShareImport` passes Deletion test — each concentrates real behavior; TierBoardPage would re-absorb the complexity if deleted. Moving `CelebrationEffect` and `TierBoardToolbar` to own files passes Deletion test — zero page-state dependencies.
- New seam justified: No new Seams introduced. Extractions are simplification (concentration), not new Seam creation. No new protocols, no new Interface contracts.
- Helpful simplification: TierBoardPage 757→507 LOC; page shell is now genuine orchestration. Five focused modules at 33-107 LOC.
- Should NOT be done: Extract modal state into a `useModalState` hook — modal state is tightly coupled to JSX (setShowAddItem called directly in onPress handlers); extracting would add ceremony without structural benefit.
- Tests after fix: No old tests to delete (TierBoardPage had no unit tests). New modules have no tests yet — F-002 in this loop's backlog addresses this gap.

## Improvement Backlog

### Priority 1: Add `useTierFilter` unit test — close test gap for extracted hook (F-007)
- Why it matters: `useTierFilter` is the highest-risk extracted module (filterAllTiers + 4 dispatch handlers); no test currently covers its Interface. Adding one `renderHook` test with a mock store proves the filter+sort integration path and satisfies the test-strategy gap.
- Score impact: Test strategy +0.5; Architecture quality credibility improved
- Kind: structural
- Rank: helpful

### Priority 2: Add `filterAllTiers` unit test in `@tiercade/core` (F-008)
- Why it matters: `sortItems` has 8 tests in core; `filterAllTiers` has 0. Asymmetry is a test-strategy credibility gap that keeps `test_strategy` below 7.5.
- Score impact: Test strategy +0.5
- Kind: structural
- Rank: helpful

## Deepening Candidates

No new deepening candidates this loop. The extracted hooks are concentrated; further extraction of TierBoardPage requires evaluating whether `useItemInteraction` passes deletion test — this is a Step 2 concern for loop 10 only if F-007/F-008 are resolved first (test-strategy gaps take priority since they affect contest credibility more).

## Builder Notes
1. **Pattern** — God-component decomposition. **How to recognize** — Page component with 5+ `useState` calls and multiple `useMemo`/`useCallback` blocks managing independent concerns. **Smallest coding rule** — Identify concerns that depend only on Redux state + dispatch (not on other `useState` values in the same component); extract each to a `use<Concern>` hook. The hook reads its own selectors and returns computed state + stable callbacks. **Stack example** — `useTierFilter.ts`: reads `selectTiers`, `selectSortMode`, `selectFilters`; returns `processedTiers`, `filteredItems`, and 4 dispatch callbacks. Zero dependency on modal state.
2. **Pattern** — Extraction without tests at new Interface. **How to recognize** — New hook file is created; no corresponding `.test.ts` file. The behavior was untested inline before and remains untested after. **Smallest coding rule** — For every new hook that calls `dispatch` or reads from the store, add one `renderHook` test: mount with a configured store, trigger the side effect, assert state changed. **Stack example** — `useTierFilter` test: create store with items in S tier; call `handleSortModeChange({type: 'alphabetical', ascending: true})`; assert `processedTiers.S` is sorted alphabetically.
3. **Pattern** — Test coverage asymmetry between similar functions. **How to recognize** — One function in a module has 8 tests; a similar function has 0. Both are called from the same consumer path. **Smallest coding rule** — When you add tests for `sortItems`, add tests for `filterItems`/`filterAllTiers` in the same test run. **Stack example** — `packages/core/test/sorting.test.ts` has 8 tests; `packages/core/test/filtering.test.ts` does not exist. Both are called inside `useTierFilter`'s `processedTiers` useMemo.

## Final Judge Narrative
Good app, place but not win yet. Loop 9 reduces `TierBoardPage` from 757 to 507 LOC via honest structural extraction — no costume layers, no empty wrappers, each module passes deletion test. `simplicity` moves 5→6; `architecture_quality` moves 6→6.5. Full suite 20 suites, 114 tests, green. Build clean. The extraction is real but incomplete: three new hooks have no unit tests, and `filterAllTiers` has no core tests. These gaps keep `test_strategy` at 7 and prevent top-tier standing. Loop 10 should close the test gaps (useTierFilter test + filterAllTiers test) — these are small, mechanical additions that would move `test_strategy` to 7.5 and strengthen the overall credibility of the restructured codebase.

## Loop 9 Result

Changed six files:
- `apps/web/src/pages/TierBoardPage.tsx` — reduced from 757 to 507 LOC by extracting 5 modules: `useShareImport`, `useTierDisplay`, `useTierFilter` (hooks), `CelebrationEffect`, `TierBoardToolbar` (components). Page shell now contains genuine orchestration: modal state (7 useState), 2 useEffect (theme init + project load), item interaction handlers, JSX render tree.
- `apps/web/src/hooks/useShareImport.ts` (new, 33 LOC) — URL share import effect; self-contained; depends only on dispatch and URL utilities.
- `apps/web/src/hooks/useTierDisplay.ts` (new, 63 LOC) — tier colors + labels computation; reads 4 selectors + theme library; returns resolved `{tierColors, tierLabels}`.
- `apps/web/src/hooks/useTierFilter.ts` (new, 91 LOC) — processedTiers derivation + filteredItems count + 4 sort/filter dispatch callbacks; reads 3 selectors.
- `apps/web/src/components/CelebrationEffect.tsx` (new, 69 LOC) — full-screen celebration overlay; pure props component (onComplete callback only).
- `apps/web/src/components/TierBoardToolbar.tsx` (new, 107 LOC) — action toolbar; pure props component.

Full suite (`test:core && test:state && test:ui`): 20 suites, 114 tests — all PASS. Build (`apps/web npm run build`): clean. Targeted finding F-004 (`TierBoardPage 757 LOC god-component`) is `carried_forward` (507 LOC — substantial reduction but not fully resolved; remaining content is genuine orchestration). `architecture_quality`: 6→6.5 (UP). `simplicity`: 5→6 (UP).
