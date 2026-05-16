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
Loop 8 of 10 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 8 resolves F-005: `createPersistenceMiddleware(storage)` factory pattern replaces the ambient `localStorage` dependency with injectable storage at all four public functions. Module-level `saveTimeout` singleton moved inside the factory closure — each store instance now has an independent debounce timer. Tests rewritten to pass `makeFakeStorage()` directly; all `Object.defineProperty(global, "localStorage")` blocks eliminated. Full suite: 20 suites, 114 tests, all green. `data_flow` moves 6→6.5, `state_management` moves 6→6.5, `credibility` moves 7→7.5.

## Scorecard (1-10)
- Architecture quality: 6 | SAME | Package DAG intact: `packages/core/src/index.ts` (no React imports). `TierBoardPage.tsx` still at 757 LOC, 7 bundled concerns. No structural change to module graph this loop.
- State management and runtime ownership: 6.5 | UP | `packages/state/src/persistenceMiddleware.ts:22` — `saveTimeout` moved from module-level singleton into factory closure. Prior: one shared debounce timer across all store instances. Now: each `createPersistenceMiddleware(storage)` call creates an independent debounce timer. RTK slice ownership unchanged across 6 slices.
- Domain modeling: 6 | SAME | `packages/core/src/models.ts:6` — `Item` interface sound. No domain model changes this loop.
- Data flow and dependency design: 6.5 | UP | `packages/state/src/persistenceMiddleware.ts:21` — `createPersistenceMiddleware(storage: Storage | undefined = _globalStorage)`. Prior: 7 direct `localStorage` call sites; ambient dependency injected via global override in tests. Now: single injection point; each caller can supply a storage instance directly. F-005 resolved.
- Framework / platform best practices: 7 | SAME | RTK idioms correct. No framework changes.
- Concurrency and runtime safety: 7 | SAME | JavaScript single-threaded. Debounce timer now closure-local (better isolation). No async concurrency model changes.
- Code simplicity and clarity: 5 | SAME | `TierBoardPage.tsx:1-757` — 757 LOC god-component unchanged. Source file for `persistenceMiddleware` adds factory pattern (+5 lines net) but eliminates 7 scattered guards; net wash. God-component score anchor remains 5.
- Test strategy and regression resistance: 7 | SAME | Tests for `persistenceMiddleware` are now cleaner (no global override), but no new test cases or surfaces added. Suite: 20 suites, 114 tests all green.
- Overall implementation credibility: 7.5 | UP | `packages/state/test/persistenceMiddleware.test.ts:64` — `makeStoreWithStorage(fakeStorage)` — `createPersistenceMiddleware(fakeStorage)` used directly; no global mutation. Prior: `Object.defineProperty(global, "localStorage", ...)` in 4 `beforeEach`/`afterEach` pairs. Now: zero global manipulation. The module's Interface is honest and isolation-clean.

## Strengths That Matter
- `packages/core` domain layer framework-free; 11 suites 69 tests covering pure functions end-to-end.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace package.json: `core`←`state`←`apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage (F-005 resolved); debounce timer per-instance (not module-global singleton).
- `undoRedoThunks` — primary user feature covered by 8 integration tests at thunk interface using real store instances.
- `persistenceMiddleware` — 14 behavior tests using injected fake storage (no global override).

## Findings

### Finding #1: `TierBoardPage.tsx` at ~757 LOC — god-component fails shallow-module test (F-004)

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

### Finding #2: `persistenceMiddleware` ambient localStorage injection — RESOLVED THIS LOOP (F-005)

**Why it matters** — RESOLVED. Factory pattern eliminates all `Object.defineProperty(global, "localStorage")` manipulation from tests.

**What is wrong** — WAS: `persistenceMiddleware.ts:41` called `localStorage.setItem` directly; tests required global override. NOW: `createPersistenceMiddleware(storage)` factory with injected storage default.

**Evidence** —
- `packages/state/src/persistenceMiddleware.ts:21` — `createPersistenceMiddleware(storage: Storage | undefined = _globalStorage)`
- `packages/state/test/persistenceMiddleware.test.ts:64` — `makeStoreWithStorage(fakeStorage)` uses `createPersistenceMiddleware(storage)` directly

**Architectural test failed** — n/a (resolved)

**Dependency category** — `local-substitutable`

**Leverage impact** — Resolved. Any caller can now inject a storage stub without global manipulation.

**Locality impact** — Resolved. Storage dependency is explicit at one seam.

**Metric signal, if any** — 4 `beforeEach`/`afterEach` `Object.defineProperty` blocks eliminated from test file.

**Why this weakens submission** — WAS: fragile global override required in tests. NOW: resolved.

**Severity** — Noticeable weakness (resolved)

**ADR conflicts** — none

**Minimal correction path** — COMPLETED: `createPersistenceMiddleware(storage)` factory + test rewrite.

**Blast radius** — Changed: `packages/state/src/persistenceMiddleware.ts`, `packages/state/test/persistenceMiddleware.test.ts`.

---

### Finding #3: `saveTimeout` was module-level singleton — timer interference between store instances

**Why it matters** — Prior to this loop, `let saveTimeout` at module scope meant all `persistenceMiddleware` instances shared one debounce timer. Multiple test stores dispatching simultaneously would cancel each other's save. Now per-instance.

**What is wrong** — WAS: `persistenceMiddleware.ts:9` — `let saveTimeout: ReturnType<typeof setTimeout> | null = null` at module scope; any store instance would cancel another's pending save. NOW: `saveTimeout` is declared at `persistenceMiddleware.ts:22` inside `createPersistenceMiddleware` factory closure.

**Evidence** —
- `packages/state/src/persistenceMiddleware.ts:22` — `let saveTimeout` now closure-local
- `packages/state/test/persistenceMiddleware.test.ts:70,85` — two test stores in the same suite no longer share a timer

**Architectural test failed** — n/a (resolved this loop)

**Dependency category** — `in-process`

**Leverage impact** — Resolved. Multiple store instances are now independent.

**Locality impact** — Resolved. Timer state is bounded to the middleware instance, not the module.

**Metric signal, if any** — none

**Why this weakens submission** — WAS: latent bug where concurrent tests could cancel each other's debounce. NOW: resolved.

**Severity** — Cosmetic for contest (resolved)

**ADR conflicts** — none

**Minimal correction path** — COMPLETED: `saveTimeout` moved inside factory closure.

**Blast radius** — `packages/state/src/persistenceMiddleware.ts` only.

## Simplification Check
- Structurally necessary: `createPersistenceMiddleware(storage)` factory passes Deletion test — deleting the old ambient dependency removes scattered `typeof localStorage === "undefined"` guards; caller can now supply storage explicitly. Passes Two-adapter rule (production store passes no arg = `_globalStorage`; tests pass `makeFakeStorage()` = second adapter).
- New seam justified: Two real adapters exist — production `_globalStorage` (default) and `makeFakeStorage()` in tests. Two-adapter rule met.
- Helpful simplification: `saveTimeout` singleton eliminated; `Object.defineProperty` global manipulation eliminated from 4 test describe blocks.
- Should NOT be done: Introduce a full `StoragePort` protocol interface — a simple optional parameter is sufficient; protocol would be protocol soup (one prod adapter).
- Tests after fix: No old test deletions needed. Tests rewritten at same Interface level with cleaner isolation. `persistenceMiddleware.test.ts` import updated from `persistenceMiddleware` to `createPersistenceMiddleware`.

## Improvement Backlog

### Priority 1: Extract `useShareImport` hook from `TierBoardPage` — reduce god-component scope (F-004)
- Why it matters: URL-sharing `useEffect` (lines 139-154) is self-contained behavior with zero dependencies on other page state. Extracting it is the smallest honest decomposition step for the 757-LOC god-component.
- Score impact: Code simplicity +0.5; Architecture quality +0.5
- Kind: simplification
- Rank: helpful

## Deepening Candidates

No new deepening candidates this loop. F-005 resolved. The `TierBoardPage` god-component (F-004) has a concrete extraction path via `useShareImport` hook but does not require a new Seam — extraction is a simplification.

## Builder Notes
1. **Pattern** — Module-level mutable state shared across instances. **How to recognize** — `let timeout` or `let state` declared at module scope (outside any class or function), used inside an exported function or middleware. When two calls to the same module-level function run concurrently, they share and potentially clobber the timer/counter/flag. **Smallest coding rule** — Move mutable state into a factory function closure so each invocation gets its own instance. Production caller invokes with no arg; tests invoke with an injected stub. **Stack example** — `persistenceMiddleware.ts`: `let saveTimeout` was at module scope; moving it inside `createPersistenceMiddleware` closure gives each store instance its own independent debounce timer.
2. **Pattern** — Ambient dependency hidden in module initialization. **How to recognize** — Function calls `localStorage.setItem` / `localStorage.getItem` directly at multiple call sites; tests must install a fake via `Object.defineProperty`. The factory pattern fixes this: one `storage` parameter, one injection point, zero global overrides needed in tests. **Smallest coding rule** — Add `storage: Storage | undefined = globalThis.localStorage` to the factory/function signature. Production uses default; tests pass a `makeFakeStorage()`. **Stack example** — `loadPersistedState(storage?)` — each test now passes its own storage instance.
3. **Pattern** — God-component at the page level (757 LOC). **How to recognize** — Single React component with ≥5 `useState` calls managing independent concerns and ≥2 `useEffect` calls with different dependency arrays. **Smallest coding rule** — Identify one `useEffect` that depends on no other state in the component and extract it into a `use<Verb>` hook in `apps/web/src/hooks/`. The hook encapsulates one concern; the page component becomes shallower. **Stack example** — `TierBoardPage.tsx:139-154` — URL sharing `useEffect` uses only URL parameters and dispatch; zero dependency on modal state or drag-drop state. Extract to `useShareImport`.

## Final Judge Narrative
Good app, place but not win yet. Loop 8 resolves F-005: `createPersistenceMiddleware(storage)` factory cleans the ambient `localStorage` seam — injectable storage, per-instance debounce timer, zero global override in tests. Structural proof: `persistenceMiddleware.ts:21` (factory signature) and `persistenceMiddleware.test.ts:64` (direct injection). `data_flow` and `state_management` each move to 6.5; `credibility` to 7.5. Full suite 20 suites, 114 tests, green. Remaining gap: `TierBoardPage.tsx` at 757 LOC — the lone Priority 1 for loop 9. Architecture, state, data flow, and domain modeling are improving but still below contest threshold; the god-component and overall module depth keep the submission from contention.

## Loop 8 Result

Changed two files:
- `packages/state/src/persistenceMiddleware.ts` — converted from ambient `localStorage` direct calls to `createPersistenceMiddleware(storage: Storage | undefined = _globalStorage)` factory; standalone functions `loadPersistedState`, `clearPersistedState`, `hasPersistedState` each gained `storage` parameter with same default; module-level `saveTimeout` singleton moved inside factory closure; backward-compat `export const persistenceMiddleware = createPersistenceMiddleware()` alias kept for production store.
- `packages/state/test/persistenceMiddleware.test.ts` — rewrote all 4 test describe blocks to pass `makeFakeStorage()` directly via `createPersistenceMiddleware(storage)` and `loadPersistedState(storage)` etc.; eliminated all `Object.defineProperty(global, "localStorage")` in `beforeEach`/`afterEach`.

Full suite (`test:core && test:state && test:ui`): 20 suites, 114 tests — all PASS. Build (`apps/web npm run build`): clean. Targeted finding F-005 (`persistenceMiddleware ambient localStorage — global override required in tests`) is `resolved`. `data_flow`: 6→6.5 (injectable seam). `state_management`: 6→6.5 (saveTimeout no longer module-global). `credibility`: 7→7.5 (tests pass without global manipulation).
