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
Loop 17 of 18 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 17 extracts `useHeadToHeadHandlers` hook from HeadToHeadPage: 5 inline action `useCallback` blocks (`handleStart`, `handleVoteLeft`, `handleVoteRight`, `handleSkip`, `handleFinish`) + keyboard shortcut `useEffect` moved behind a stable Interface. HeadToHeadPage 378→312 LOC (-66 lines). 5 new Interface-level tests at `useHeadToHeadHandlers.test.ts`. Suite: 28 suites, 189 tests, all green. simplicity 8.0→8.5.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action dep-cluster behind Interface; HeadToHeadPage reduced to display-only orchestration. Package DAG enforced. 9-anchor still not met: domain model anemic, store implicit global, page-level tests absent.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — one writer per concern across 6 slices; store is implicit global, no process-lifetime pattern. 9-anchor sub-threshold.
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — `Item` interface all-optional fields; `Items = Record<string, Item[]>` anemic. No smart constructors. 9-anchor not met.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json`. Within-app no module-level DAG enforcement. 9-anchor partial.
- Framework / platform best practices: 7.5 | SAME | `apps/web/src/hooks/` — 12 focused hooks (up from 11); RTK patterns correct; `useId()` for stable IDs; keyboard shortcut effect co-located with action handlers in hook. No undocumented carve-outs.
- Concurrency and runtime safety: 7.0 | SAME | JavaScript single-threaded. No floating promises found. `useEffect` cleanup present — `useHeadToHeadHandlers` removes `keydown` listener on cleanup. `persistenceMiddleware` per-instance timer (loop 8). 9-anchor partial.
- Code simplicity and clarity: 8.5 | UP | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — 5 H2H action handlers + keyboard `useEffect` extracted from HeadToHeadPage; page 378→312 LOC (-66 lines). 5 `useCallback` blocks + keyboard `useEffect` + 2 internal selectors removed from page. Hook returns `{onStart, onVoteLeft, onVoteRight, onSkip, onFinish, onGoHome}` — clean destructured Interface.
- Test strategy and regression resistance: 8.0 | SAME | Suite: 28 suites, 189 tests. `useHeadToHeadHandlers.test.ts` — 5 tests: onStart activates, onVoteLeft advances pair, onSkip moves pair, onFinish dispatches+navigates, onGoHome navigates without finishing. Authority Map cross-check: `useHeadToHeadHandlers` Interface directly tested. Remaining ceiling: page-level surfaces still untested — 9-anchor not met.
- Overall implementation credibility: 8.0 | SAME | `useHeadToHeadHandlers` passes deletion test: keyboard shortcut routing + action dispatch complexity vanishes from page. Replace-don't-layer satisfied: no prior tests for these handlers; 5 new tests at new Interface. Implementation reviewer approved.

## Authority Map
(Re-emitted because simplicity UP — structural change.)

**Head-to-Head action handlers + keyboard routing**
- Owner: `apps/web/src/hooks/useHeadToHeadHandlers.ts`
- Allowed writers: n/a (no mutable state; dispatches RTK actions + navigate)
- Observers / readers: `HeadToHeadPage` via `useHeadToHeadHandlers(onOpenEndConfirm)` return value
- Persistence seam: none
- Async mutation entry points: none (all synchronous dispatch)
- Verdict: Single and clear — **test surface: `useHeadToHeadHandlers.test.ts` (5 tests, loop 17)**

**TierBoardPage modal state**
- Owner: `TierBoardPage` local state (7 `useState` declarations, lines 75-82)
- Allowed writers: `TierBoardPage` handlers (inline setters)
- Observers / readers: JSX render tree within `TierBoardPage`
- Persistence seam: none
- Async mutation entry points: `handleMoveItemWithCelebration` (celebration state)
- Verdict: Single and clear (local component state; not a shared concern)

**Export handlers (text serialization + URL generation)**
- Owner: `apps/web/src/hooks/useExportHandlers.ts`
- Allowed writers: n/a (no mutable state; dispatches downloads + clipboard)
- Observers / readers: `ImportExportPage` via `useExportHandlers(exportAsPNG)` return value
- Persistence seam: none (delegates to `downloadFile` + `copyToClipboard` utils)
- Async mutation entry points: `onCopyLink` — async clipboard write
- Verdict: Single and clear — **test surface: `useExportHandlers.test.ts` (5 tests, loop 16)**

**Import handlers (file I/O + format dispatch)**
- Owner: `apps/web/src/hooks/useImportHandlers.ts`
- Allowed writers: n/a (dispatches to RTK store via thunks)
- Observers / readers: `ImportExportPage` via `useImportHandlers(dispatch)` return value
- Persistence seam: none
- Async mutation entry points: `onImportFile` — FileReader.onload callback
- Verdict: Single and clear — **test surface: `useImportHandlers.test.ts` (5 tests, loop 15)**

**Batch action handlers**
- Owner: `apps/web/src/hooks/useBatchActions.ts`
- Allowed writers: n/a (dispatches to RTK store)
- Observers / readers: `TierBoardPage` via `useBatchActions(dispatch)` return value
- Persistence seam: none
- Async mutation entry points: none
- Verdict: Single and clear — **test surface: `useBatchActions.test.ts` (6 tests, loop 14)**

**Tier/Item domain state**
- Owner: `packages/state/src/tierSlice.ts`
- Allowed writers: dispatched actions (captureSnapshot, moveItemBetweenTiersWithUndo, addItemToTier, updateItem, deleteItems, moveItemsBetweenTiers)
- Observers / readers: all page components via `useAppSelector`
- Persistence seam: `persistenceMiddleware` (injectable storage, per-instance timer, loop 8)
- Async mutation entry points: thunks in `packages/state/src/`
- Verdict: Single and clear — **test surface: `undoRedoThunks.test.ts`, `tierSlice.test.ts`**

## Strengths That Matter
- `packages/core` domain layer framework-free; 12 suites, 94 tests covering pure functions end-to-end.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace `package.json`: `core←state←apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage (F-005 resolved loop 8); per-instance timer (F-006 resolved loop 8).
- `undoRedoThunks` — direct test suite covering cross-slice behavior (F-003 resolved loop 7).
- `TierBoardPage.tsx` — reduced from 757 to 443 LOC; 7 focused modules/hooks extracted (loops 9, 12, 14).
- `ImportExportPage.tsx` — reduced from 438 to 253 LOC; both import and export handlers extracted (loops 15-16).
- `HeadToHeadPage.tsx` — reduced from 378 to 312 LOC; action handlers + keyboard effect extracted (loop 17).
- `useHeadToHeadHandlers.ts` — 115 LOC; Interface tested at `useHeadToHeadHandlers.test.ts` (5 tests, loop 17).
- `useExportHandlers.ts` — 182 LOC; Interface tested at `useExportHandlers.test.ts` (5 tests, loop 16).
- `useImportHandlers.ts` — 62 LOC; Interface tested at `useImportHandlers.test.ts` (5 tests, loop 15).
- `useBatchActions.ts` — 40 LOC; Interface tested at `useBatchActions.test.ts` (6 tests, loop 14).
- `useItemInteraction.ts` — 81 LOC; Interface tested at `useItemInteraction.test.ts` (7 tests, loop 12).

## Findings

### Finding #1: `TierBoardPage.tsx` at 443 LOC — god-component at natural modal-coupled floor (F-004)

**Why it matters** — At 443 LOC (down from 757 at loop 5 start), the page retains 3 inline handlers and 7 `useState` declarations. All remaining handlers require modal state context — further extraction would require co-extracting state, raising ceremony.

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

**Why this weakens submission** — Page shell still broad; floor is real — should be documented as accepted residual.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept 443 LOC as natural orchestration floor. Promote F-004 to accepted residual. No further extraction attempts.

**Blast radius** — No change needed; acceptance only.

---

### Finding #2: Domain model anemic — `Item` all-optional fields, no smart constructors (F-011)

**Why it matters** — `packages/core/src/models.ts` defines `Item` as a bag with all optional fields (`name?`, `imageUrl?`, `description?`). `Items = Record<string, Item[]>` allows any string key including invalid tier names. No construction-time validation, no smart constructors. Impossible states (e.g. `Item` with no `id`) are representable — convention-only guards in reducers.

**What is wrong** — `packages/core/src/models.ts:1-30` — `Item.id` is the only non-optional field; `name`, `imageUrl`, `description`, `seasonString` all optional. `Items` type is a plain Record, no key-set enforcement. Domain invariants (all tierOrder tiers must have entries) are enforced by comments in `CLAUDE.md`, not the type system.

**Evidence** —
- `packages/core/src/models.ts:6-17` — `Item` interface definition
- `packages/core/src/models.ts:19` — `Items = Record<string, Item[]>`
- `packages/core/src/tierLogic.ts:1-50` — tier operations assume callers pass valid tier names

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Every caller must guard against undefined fields or invalid tier keys independently.

**Locality impact** — Domain invariants scattered across reducers and helpers rather than enforced at construction.

**Metric signal, if any** — `?? "Unknown"` patterns in `handleExportJSON` (substitutes for type weakness).

**Why this weakens submission** — Contest-grade domain modeling requires invariants proved at construction, not documentation. This is the primary reason domain_modeling stays at 6.0.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — This is a cross-cutting change requiring core type refactor; given 2 loops remaining and no clear safe path (would need all consumers updated), promote as accepted residual for this run. Not a valid backlog item at cap 18.

**Blast radius** — Change: `packages/core/src/models.ts` and all consumers. Avoid: touching slices / pages until models stabilize.

---

## Simplification Check
- Structurally necessary: `useHeadToHeadHandlers` extraction — `handleStart`, `handleVoteLeft`, `handleVoteRight`, `handleSkip`, `handleFinish` all dispatch to H2H slice; keyboard `useEffect` depends on `isActive`, `currentPair`, and all 3 vote/skip handlers. Extraction concentrates the action dep-cluster + keyboard routing behind a stable Interface. Deletion test passes: complexity vanishes from HeadToHeadPage.
- New seam justified: No new architectural Seam introduced. `useHeadToHeadHandlers` is an in-process hook, not a protocol/port abstraction.
- Helpful simplification: HeadToHeadPage.tsx 378→312 LOC (-66 lines); 5 `useCallback` blocks removed; keyboard `useEffect` (43 lines) removed; `selectHeadToHeadIsActive`, `selectHeadToHeadCurrentPair` selectors removed from page; `useNavigate`, `useAppDispatch`, action creators removed from page imports.
- Should NOT be done: Extracting `showEndConfirm` modal state — page-local boolean, not a shared concern. Extracting display-only selectors (pairsQueue, deferredPairs, phase, totalItems) — render-only; no dep cluster.
- Tests after fix: `apps/web/src/hooks/useHeadToHeadHandlers.test.ts` — 5 tests at new Interface. No old tests to delete (Replace-don't-layer: no prior tests existed for these handlers).

## Improvement Backlog

### Priority 1: Accept F-004 residual — TierBoardPage at natural modal floor
- Why it matters: Remaining TierBoardPage handlers are all modal-state coupled; no further clean extraction without co-moving state. Accept 443 LOC as the design floor. Removes F-004 from findings.
- Score impact: `architecture_quality` residual documentation; minor narrative clean-up.
- Kind: polish
- Rank: minor

### Priority 2: Accept F-011 residual — domain model anemic (Item all-optional, no smart constructors)
- Why it matters: Domain modeling at 6.0 due to convention-only invariants. A full type-system refactor is out of scope at cap 18. Documenting as accepted residual is honest.
- Score impact: `domain_modeling` accepted residual (6.0 stays, no false promotion).
- Kind: polish
- Rank: minor

## Deepening Candidates

No further deepening candidates with real structural friction remaining at current cap. Both remaining backlog items are residual acceptance, not structural extraction.

## Builder Notes
1. **Pattern** — 5-selector dep cluster shared across N handlers: identical `useAppSelector` dep arrays signal a hook extraction opportunity. **How to recognize** — When 3+ `useCallback` blocks list the same 4+ state selectors in their dep arrays, they belong in a single hook that reads those selectors internally. **Smallest coding rule** — "Same 4+ deps in 3+ callbacks = one hook." **Stack example** — `handleExportJSON`, `handleExportCSV`, `handleExportMarkdown` all had `[projectName, tierOrder, tierLabels, tierColors, tiers]` — identical dep arrays exposed the cluster.
2. **Pattern** — jsdom missing `URL.createObjectURL` in test environments. **How to recognize** — Spy on `URL.createObjectURL` fails with "Property does not exist" error in jsdom. **Smallest coding rule** — Install via `Object.defineProperty(URL, 'createObjectURL', { writable: true, configurable: true, value: jest.fn() })` in beforeEach rather than `jest.spyOn`. **Stack example** — `useExportHandlers.test.ts:72-84` installs stubs before spy.
3. **Pattern** — `handleExport` dispatcher pattern: a switch delegating to per-format handlers. Belongs in the same hook as the handlers — not a separate abstraction. **How to recognize** — A `useCallback` whose body is a `switch` calling other `useCallback`s is a routing artifact; it follows its handlers. **Smallest coding rule** — "A router belongs with its routes."
4. **Pattern** — keyboard shortcut `useEffect` belongs in the same hook as the handlers it routes to. **How to recognize** — `useEffect` deps list contains N action handlers defined in the same component — the effect's dep cluster IS the handler set. **Smallest coding rule** — "Effect that only calls handlers = belongs in the handler hook." **Stack example** — `useHeadToHeadHandlers` keyboard effect deps: `[isActive, currentPair, onVoteLeft, onVoteRight, onSkip, onOpenEndConfirm]` — all owned by the hook except the modal callback (passed as param).

## Final Judge Narrative
Good app, place but not win. Loop 17 executes `useHeadToHeadHandlers` extraction: action dispatch + keyboard routing moves behind stable Interface; HeadToHeadPage 378→312 LOC. simplicity 8.0→8.5: structural proof is the hook + removed useCallback blocks + keyboard useEffect + 5 new Interface tests. One loop remains at cap 18. Priority 1 and 2 are residual acceptances — no further extraction candidates pass the deletion test at current scope. Average score holding near 7.3. Remaining sub-9.5 scores reflect honest structural blockers (anemic domain model, implicit global store, no process-lifetime pattern) — not addressable in remaining budget.

## Loop 16 Result

Three files changed: `useExportHandlers.ts` (new, 182 LOC), `useExportHandlers.test.ts` (new, 5 tests), `ImportExportPage.tsx` (401→253 LOC, 5 `useCallback` blocks removed, 3 `useAppSelector` calls removed, `downloadFile` helper removed, `ExportFormatter` import removed).

`useExportHandlers` extracts `handleCopyLink`, `handleExportJSON`, `handleExportCSV`, `handleExportMarkdown`, `handleExport` from `ImportExportPage.tsx`. All 4 format handlers closed over the same 5 selectors (`projectName`, `tierOrder`, `tierLabels`, `tierColors`, `tiers`); the hook reads them internally. Hook accepts `exportAsPNG` as a parameter (from `useExport`, different concern). Returns `{ onCopyLink, onExportJSON, onExportCSV, onExportMarkdown, onExport }`. Page calls `const { onExport: handleExport } = useExportHandlers(exportAsPNG)`. The `downloadFile` utility moved to the hook file (no longer a page-level helper). `ExportFormatter`, `copyToClipboard`, `generateShareUrl` imports removed from page.

Tests: `npm run test:hooks` (5 suites, 30 tests). Full suite: 27 suites, 184 tests, all green. Targeted finding F-010 (ImportExportPage export handlers inline): **resolved** (all 5 export handlers now in `useExportHandlers`; page no longer imports format utilities).

## Loop 17 Result

Three files changed: `useHeadToHeadHandlers.ts` (new, 115 LOC), `useHeadToHeadHandlers.test.ts` (new, 5 tests), `HeadToHeadPage.tsx` (378→312 LOC, 5 `useCallback` blocks removed, keyboard `useEffect` removed, `useNavigate`/`useAppDispatch`/action creator imports removed from page).

`useHeadToHeadHandlers` extracts `handleStart`, `handleVoteLeft`, `handleVoteRight`, `handleSkip`, `handleFinish` from `HeadToHeadPage.tsx`. Hook reads `selectHeadToHeadIsActive` and `selectHeadToHeadCurrentPair` internally. Accepts `onOpenEndConfirm: () => void` (modal state owned by page — clean inversion for Escape key). Keyboard shortcut `useEffect` (ArrowLeft/1 → voteLeft, ArrowRight/2 → voteRight, Space → skip, Escape → openEndConfirm) co-located inside hook with the actions it routes to. Adds `onGoHome` (for empty-state navigation — page previously had inline `navigate("/")`). Returns `{ onStart, onVoteLeft, onVoteRight, onSkip, onFinish, onGoHome }`.

Tests: `npm run test:hooks` (6 suites, 35 tests). Full suite: 28 suites, 189 tests, all green. New finding F-012 (HeadToHeadPage action handlers inline): **resolved** this loop.
