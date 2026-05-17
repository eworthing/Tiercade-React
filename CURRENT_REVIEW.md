### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 29 of 30 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 29: Extracted `createAppStore` factory from `packages/state/src/store.ts`. The ambient module-level store construction is now a named, documented Interface with explicit lifetime contract. Production singleton unchanged. 4 Interface tests added. state_management 6.5→8.0 (UP). 9 suites, 59 tests in state package; 13 suites, 109 tests in core. All green.

## Scorecard (1-10)
- Architecture quality: 8.0 | UP | `packages/state/src/store.ts:createAppStore` — store construction now concentrated behind a named Interface with explicit `CreateStoreOptions` type; module ownership explicit; implicit global replaced by documented singleton. 9-anchor not yet met (H2H action dep-cluster still in `useHeadToHeadHandlers.ts`).
- State management and runtime ownership: 8.0 | UP | `packages/state/src/store.ts:createAppStore` — factory export with `preloadedState?` + `persistenceMiddleware?` options; process-lifetime contract documented in JSDoc; isolated stores in tests use `createAppStore({ preloadedState: {} })`; 4 Interface tests in `packages/state/test/createStore.test.ts`. 9-anchor not fully met: architecture_quality dep-cluster gap carries through.
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` + `apps/web/src/components/ItemModal.tsx:114-135` — createItem smart constructor + ItemMedia discriminated union; primary caller migrated. Residual: `packages/core/src/models.ts:22-31` parallel URL fields (backward compat, framework-constrained, accepted).
- Data flow and dependency design: 8.0 | SAME | `packages/core/test/dag.test.ts` — 7 DAG tests enforce cross-package and within-app layer ordering. Ambient Redux global now documented. Exceeds 7-anchor but full 9-anchor blocked by ambient store (now partially resolved).
- Framework / platform best practices: 8.5 | SAME | `apps/web/src/pages/AnalyticsPage.tsx:63-64` — named selectors from `@tiercade/state`; all 6 pages use centralized RTK selectors.
- Concurrency and runtime safety: 8.0 | SAME | `apps/web/src/hooks/useImportHandlers.ts:35-38` — useEffect cleanup; abort previous reader on second call. Two abort tests at Interface.
- Code simplicity and clarity: 9.5 | SAME | `packages/state/src/store.ts` — factory is 72 lines total; no ceremony; options type is minimal. Accepted residual: `apps/web/src/pages/TierBoardPage.tsx:1-443`.
- Test strategy and regression resistance: 9.5 | SAME | `packages/state/test/createStore.test.ts` — 4 Interface tests for factory. All 6 web pages have direct page-level test files. DAG test suite (loop 28). 22 suites, 168 tests (state + core combined). Accepted residual: AppShell routing.
- Overall implementation credibility: 9.5 | SAME | Store construction now explicit and documented; factory earns its keep (concentrates preloadedState restoration DAG + middleware wiring). Accepted residual: `packages/core/src/models.ts:22-31`.

## Authority Map
(Re-emitting because state_management is Priority 1 this loop)

### Redux store (tier, theme, undoRedo, onboarding, presentation, headToHead)
- Owner: `packages/state/src/store.ts` — `createAppStore` factory
- Allowed writers: one slice per concern (6 slices); `undoRedoThunks.ts` coordinates undo/redo across slices
- Observers / readers: all web pages via `useAppSelector` + named selectors from `selectors.ts`
- Persistence seam: `createPersistenceMiddleware(storage)` — injection-friendly; fake storage in tests
- Async mutation entry points: `headToHeadThunks.ts`, `projectThunks.ts`, `undoRedoThunks.ts`
- Verdict: Single and clear

## Strengths That Matter
- `createAppStore` factory: process-lifetime contract documented; preloadedState + persistenceMiddleware injectable; 4 Interface tests at new seam.
- `packages/core` domain layer framework-free; 13 suites, 109 tests; `createItem` smart constructor + `ItemMedia` discriminated union enforces media invariant at construction.
- `ItemModal.tsx` add-item path uses `createItem` — media invariant enforced at primary caller.
- RTK slice ownership: one clear writer per concern across 6 slices; all derived state uses memoized named selectors from `selectors.ts`; pages fully centralized.
- Monorepo DAG enforced two ways: workspace `package.json` peer deps + `dag.test.ts` 7 tests catching violations at `npm test` time.
- All 6 web pages have direct page-level test files.

## Findings

### Finding #1: Redux store construction was ambient global — no process-lifetime factory (F-021)

**Why it matters** — Resolved this loop. The Redux store in `packages/state/src/store.ts` had no named Interface for construction. `loadPersistedState()` was called at module import time against ambient `localStorage`. Tests worked around this by duplicating store construction via `configureStore` directly (visible in `persistenceMiddleware.test.ts:makeStoreWithStorage`). No documented lifetime contract.

**What is wrong** — `packages/state/src/store.ts` — module-level `const persistedState = loadPersistedState()` ran at import time; no factory; `RootState`/`AppDispatch` derived from the singleton (circular inference risk). Tests could not obtain an isolated store without re-implementing the full construction pattern.

**Evidence** —
- `packages/state/src/store.ts` (pre-loop) — module-level `loadPersistedState()` call at import time; no exported factory
- `packages/state/test/persistenceMiddleware.test.ts:51-66` — `makeStoreWithStorage` duplicates the full `configureStore(...)` call with all 6 reducers because no factory existed

**Architectural test failed** — Interface-as-test-surface (tests reached past module Interface to re-construct the store)

**Dependency category** — `in-process`

**Leverage impact** — Factory concentrates preloadedState restoration DAG (3-branch `if persistedState?.tier / .theme / .undoRedo`) + middleware wiring into one named Interface. Callers see `CreateStoreOptions`; they no longer need to know the reducer list or serializableCheck config.

**Locality impact** — Process-lifetime contract is now documented in JSDoc; the ambient production singleton is identified as `createAppStore()` (no args). Future changes to slice list or middleware config have one location.

**Metric signal, if any** — 4 new Interface tests; state package: 9 suites, 59 tests (up from 8/55).

**Why this weakens submission** — state_management 6.5 blocked by implicit global; factory pattern resolves it.

**Severity** — Serious deduction

**ADR conflicts** — none

**Minimal correction path** — Extract `createAppStore(options?)` from `store.ts`; keep `export const store = createAppStore()`. Add `packages/state/test/createStore.test.ts` with 4 Interface tests.

**Blast radius** — change: `packages/state/src/store.ts`, `packages/state/test/createStore.test.ts`. avoid: all slice files, all web pages.

---

### Finding #2: `TierBoardPage.tsx` at 443 LOC — god-component at natural modal-coupled floor (F-004)

**Why it matters** — Accepted residual. Framework-constrained floor.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` bundles 7 `useState` modal/UI state declarations (lines 75-82) + 3 inline handlers all closing over modal setters.

**Evidence** — `apps/web/src/pages/TierBoardPage.tsx:1-443`

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept. Already accepted residual.

**Blast radius** — No change needed.

---

### Finding #3: `Item` interface backward-compat parallel URL fields (F-014)

**Why it matters** — Terminal accepted residual.

**What is wrong** — `packages/core/src/models.ts:22-31` — `Item.imageUrl`, `videoUrl`, `audioUrl`, `mediaType` remain independently optional.

**Evidence** — `packages/core/src/models.ts:22-31`

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Severity** — Noticeable weakness

**Minimal correction path** — Accept as terminal residual.

**Blast radius** — No change needed.

---

## Simplification Check
| field | value |
|---|---|
| structurally_necessary | `createAppStore` — passes deletion test: removing it collapses preloadedState restoration DAG + middleware wiring back into anonymous module-level code; `makeStoreWithStorage` duplication in tests would persist |
| new_seam_justified | false — deepens existing `store.ts` ownership, does not introduce a new Seam |
| helpful_simplification | `CreateStoreOptions` interface is 2 optional fields; factory body is ~30 lines; no ceremony |
| should_not_be_done | Migrating `persistenceMiddleware.test.ts:makeStoreWithStorage` to use `createAppStore` — test has specific middleware injection concern; the helper can stay |
| tests_after_fix | No tests deleted; 9 suites 59 tests (state) + 13 suites 109 tests (core), all green |

## Improvement Backlog
1. **architecture_quality 8.0 — H2H action dep-cluster** (structural, needed for winning). `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action handlers are concentrated behind the hook Interface, but the dep-cluster (useAppDispatch + multiple slice imports + H2H algorithm calls) still blocks the 9-anchor. Smallest fix: none identified that passes Simplify Pressure Test without adding ceremony. Accept as current ceiling. Score impact: architecture_quality 8.0 → 8.5 possible if H2H handler Interface is deepened.

## Deepening Candidates
None. Both remaining blockers (architecture_quality dep-cluster in H2H handlers, data_flow ambient store) are now at accepted-or-documented state.

## Builder Notes
1. **Pattern** — Store factory for isolated test instances. `createAppStore({ preloadedState: {} })` returns a store that starts empty, with no localStorage reads. Each test suite gets its own store; no test pollution. **How to recognize** — Any RTK setup where tests call `configureStore(...)` with a duplicate reducer list to avoid the production store's `loadPersistedState()` side effect. **Smallest coding rule** — Extract the `configureStore` call into `createAppStore(options?)`. The singleton stays as `export const store = createAppStore()`.
2. **Pattern** — `RootState` derived from `rootReducer` (not `store.getState`). `type RootState = ReturnType<typeof rootReducer>`. This avoids the circular type inference risk where `AppDispatch = typeof store.dispatch` and `RootState = ReturnType<typeof store.getState>` co-depend on the singleton. With the factory, derive both from the factory's return type or from `rootReducer`. **Smallest coding rule** — `export type RootState = ReturnType<typeof rootReducer>`.
3. **Pattern** — `CreateStoreOptions` with optional fields. `preloadedState?` — caller supplies explicit state for test isolation. `persistenceMiddleware?` — caller supplies custom middleware (fake storage) for middleware-specific tests. Both fields optional so the production call remains `createAppStore()`. **How to recognize** — Any factory where some callers need full production wiring and others need isolated wiring. Optional fields with documented defaults.
4. **Pattern** — CardView in S2 uses render-prop pattern (children as factory function). Stub: `({ items, children }) => <div>{items.map(item => children(item))}</div>`.

## Final Judge Narrative
Good app, place but not win. Loop 29: state_management 6.5→8.0 via `createAppStore` factory. The ambient module-level store construction is now a named Interface with documented process-lifetime contract. Production singleton unchanged (`export const store = createAppStore()`). Tests call `createAppStore({ preloadedState: {} })` for isolation. 4 Interface tests added at `packages/state/test/createStore.test.ts`. Architecture quality lifts to 8.0 as the implicit global that blocked the 9-anchor is now explicit. Remaining: architecture_quality H2H dep-cluster; data_flow ambient store documented but not fully resolved. 22 suites combined (state + core), 168 tests, all green. avg ~8.78 (up from 8.44).

## Loop 29 Result
Extracted `createAppStore({ preloadedState?, persistenceMiddleware? })` factory from `packages/state/src/store.ts`. Production singleton preserved as `export const store = createAppStore()`. `RootState` type now derived from `rootReducer` (breaks circular inference path). `CreateStoreOptions` interface exported. Added `packages/state/test/createStore.test.ts` — 4 Interface tests: returns functional store; preloadedState honoured; multiple stores isolated (no shared state); persistenceMiddleware option wired. Finding F-021 resolved. state_management UP: 6.5→8.0. architecture_quality UP: 7.5→8.0. Tests: 9 suites / 59 tests (state), 13 suites / 109 tests (core), all green.
