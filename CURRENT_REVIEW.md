### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 28 of 30 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 28: Added `packages/core/test/dag.test.ts` — 7 tests enforcing cross-package and within-app DAG rules. data_flow 6.5→8.0 (UP). 35 suites, 234 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action dep-cluster behind Interface; package DAG now enforced by test; within-app module DAG enforced; implicit global store. 9-anchor not met.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — one writer per concern across 6 slices; store is implicit global, no process-lifetime pattern. 9-anchor not met.
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` + `apps/web/src/components/ItemModal.tsx:114-135` — createItem smart constructor + ItemMedia discriminated union; primary caller migrated. Residual: `packages/core/src/models.ts:22-31` parallel URL fields (backward compat, framework-constrained, accepted).
- Data flow and dependency design: 8.0 | UP | `packages/core/test/dag.test.ts` — 7 DAG tests enforce cross-package layer ordering (core/state/ui/theme) and within-app layer ordering (utils→hooks→components→pages); violations caught at `npm run test:core`. Package-level DAG also enforced by workspace package.json. Ambient Redux global store is the one remaining undocumented ambient dependency; RTK effects typed. Exceeds 7-anchor (convention-only) but full 9-anchor blocked by ambient store.
- Framework / platform best practices: 8.5 | SAME | `apps/web/src/pages/AnalyticsPage.tsx:63-64` — named selectors from `@tiercade/state`; all 6 pages use centralized RTK selectors (loop 27).
- Concurrency and runtime safety: 8.0 | SAME | `apps/web/src/hooks/useImportHandlers.ts:35-38` — useEffect cleanup; abort previous reader on second call. Two abort tests at Interface.
- Code simplicity and clarity: 9.5 | SAME | All simplification candidates exhausted. Accepted residual: `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC modal orchestration floor (framework-constrained).
- Test strategy and regression resistance: 9.5 | SAME | All 6 web pages have direct page-level test files. DAG test suite added (loop 28). Accepted residual: AppShell routing (thin wrapper; E2E covers integration paths).
- Overall implementation credibility: 9.5 | SAME | Code earns its architecture; few honesty leaks remain. Accepted residual: `packages/core/src/models.ts:22-31` — Item parallel URL fields backward compat.

## Strengths That Matter
- `packages/core` domain layer framework-free; 13 suites (incl. dag.test), 109 tests; `createItem` smart constructor + `ItemMedia` discriminated union enforces media invariant at construction.
- `ItemModal.tsx` primary add-item path uses `createItem` — media mutual exclusivity enforced at primary caller.
- RTK slice ownership: one clear writer per concern across 6 slices; all derived state uses memoized named selectors from `selectors.ts`; pages fully centralized (loop 27).
- Monorepo DAG enforced two ways: workspace `package.json` peer deps + `dag.test.ts` 7 tests catching violations at `npm test` time. Cross-package and within-app layer ordering both checked.
- `persistenceMiddleware` — fully injectable storage; per-instance timer.
- `useImportHandlers.ts` — FileReader abort on unmount + abort on second call; lifecycle gap closed.
- All 6 web pages have direct page-level test files.

## Findings

### Finding #1: data_flow DAG was convention-only — no machine enforcement (F-020)

**Why it matters** — Resolved this loop. Cross-package and within-app DAG were enforced only by developer convention; violations would not be caught at test time.

**What is wrong** — `packages/core/src/**` could import from `@tiercade/state`/`@tiercade/ui`/`@tiercade/theme` without any automated catch. Within-app, `hooks/` could import from `pages/` without detection.

**Evidence** —
- `packages/core/test/dag.test.ts` (new file, loop 28) — 7 tests covering: core no-upstream-deps, state no-ui/theme-deps, ui no-state-dep, theme no-tiercade-deps, utils/hooks/components within-app layer ordering
- Violation detection verified: injecting `import type { RootState } from "@tiercade/state"` into core source causes test failure with specific file+specifier in output.

**Architectural test failed** — n/a (data flow / dependency enforcement, not a module seam test)

**Dependency category** — `in-process`

**Leverage impact** — Without the test, callers of any package layer cannot trust the dependency contract; the test makes violations machine-detectable at CI time.

**Locality impact** — DAG violations that spread framework types into `packages/core` or `packages/state` would cause broad blast radius; the test catches them immediately.

**Metric signal, if any** — 7 new DAG assertions; 35 total suites, 234 tests passing.

**Why this weakens submission** — data_flow 6.5 blocked by convention-only enforcement; test changes this to machine-enforced.

**Severity** — Serious deduction

**ADR conflicts** — none

**Minimal correction path** — Add `packages/core/test/dag.test.ts` with import-scanning tests per DAG rules.

**Blast radius** — change: `packages/core/test/dag.test.ts`. avoid: all source files.

---

### Finding #2: `TierBoardPage.tsx` at 443 LOC — god-component at natural modal-coupled floor (F-004)

**Why it matters** — Accepted residual. Framework-constrained floor.

**What is wrong** — `apps/web/src/pages/TierBoardPage.tsx` bundles 7 `useState` modal/UI state declarations (lines 75-82) + 3 inline handlers all closing over modal setters.

**Evidence** —
- `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC
- `apps/web/src/pages/TierBoardPage.tsx:75-82` — 7 `useState` declarations

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Modal coordination still requires reading 443 LOC.

**Locality impact** — Remaining handlers coupled to modal state; no clean extraction path.

**Metric signal, if any** — 443 LOC vs 95 LOC `ThemesPage.tsx`.

**Why this weakens submission** — Page shell still broad; accepted residual.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept. Already accepted residual.

**Blast radius** — No change needed.

---

### Finding #3: `Item` interface backward-compat parallel URL fields (F-014)

**Why it matters** — Terminal accepted residual. `Item` interface retains parallel URL fields for backward compat with persisted data. `createItem` enforces invariant at construction; direct construction still possible.

**What is wrong** — `packages/core/src/models.ts:22-31` — `Item.imageUrl`, `videoUrl`, `audioUrl`, `mediaType` remain independently optional.

**Evidence** —
- `packages/core/src/models.ts:22-31`

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — No new leverage lost. Primary path enforced.

**Locality impact** — Terminal: changing `Item` interface would break all existing persisted data deserialization.

**Metric signal, if any** — none

**Why this weakens submission** — domain_modeling can't reach 10 without `Item` using `ItemMedia` natively; persisted state migration is cross-cutting.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Accept as terminal residual.

**Blast radius** — No change needed.

---

## Simplification Check
| field | value |
|---|---|
| structurally_necessary | DAG test — passes deletion test: removing `dag.test.ts` loses machine-enforcement of the layer contracts; violations could silently enter source without detection |
| new_seam_justified | false |
| helpful_simplification | Uses only Node built-ins (fs, path) — no new dependencies required |
| should_not_be_done | Adding eslint-plugin-import (would require npm install — prohibited by skill guardrails); adding TypeScript path aliases (runtime complexity for build-time concern) |
| tests_after_fix | No tests deleted; 35 suites 234 tests all green |

## Improvement Backlog
1. **state_management 6.5 — ambient Redux store undocumented** (structural, needed for winning). The Redux store in `packages/state/src/store.ts` has no comment or factory pattern making its process-lifetime and injection point explicit. Smallest fix: add a `configureStore` factory export and document the lifetime. Score impact: state_management 6.5 → 7.5. But requires architectural change to how the store is consumed in `apps/web/src/main.tsx`.

## Deepening Candidates
None. Remaining blockers (state_management, architecture_quality) require process-lifetime ownership changes beyond the test surface.

## Builder Notes
1. **Pattern** — DAG enforcement via import-scanning tests. Walk source files with `fs.readdirSync`, read each file, grep for `from "..."` patterns, assert no forbidden specifiers. No external dependencies needed — Node built-ins sufficient. **How to recognize** — Any monorepo where "don't import X from layer Y" is a doc convention but not a CI check. **Smallest coding rule** — Put the test in the lowest package (`packages/core/test/dag.test.ts`) where `testEnvironment: "node"` is already configured; walk the repo via `path.resolve(__dirname, '../../..')`.
2. **Pattern** — Within-app layer ordering: utils → hooks → components → pages. Components importing hooks is idiomatic React (hooks are MORE primitive). The forbidden direction is `hooks → components`, `hooks → pages`, `components → pages`. **How to recognize** — `useAppDispatch` imported in a component = allowed. A component imported inside a hook = violation. **Smallest coding rule** — Enforce via DAG test: `hooks/` must not import from `components/` or `pages/`; `components/` must not import from `pages/`.
3. **Pattern** — Two enforcement levels for monorepo DAG: (1) workspace package.json peer deps (catches npm install-time circular deps), (2) import-scanning test (catches source-level layer violations that npm workspace doesn't see because packages are linked by path). Level 2 is essential because `@tiercade/state` in `packages/core/src/` would resolve via the workspace symlink without error — only the test catches it. **Smallest coding rule** — Both levels are cheap. Level 2 runs in 3s alongside other unit tests.
4. **Pattern** — CardView in S2 uses a render-prop pattern (children as factory function). When stubbing for jsdom tests, the mock must call `props.items.map((item) => props.children(item))` to render each card. **How to recognize** — `<CardView items={...}>{(item) => ...}</CardView>` — children is a callback, not a node. **Smallest coding rule** — Stub CardView as: `({ items, children }) => <div>{...items.map(item => children(item))}</div>`.

## Final Judge Narrative
Good app, place but not win. Loop 28: data_flow 6.5→8.0 via `dag.test.ts` — 7 tests enforce cross-package and within-app layer DAG at `npm test` time. Convention-only enforcement replaced by machine-detectable checks. 35 suites, 234 tests, all green. Remaining hard blockers: implicit global Redux store (state_management 6.5), architecture_quality 7.5 (follows from both structural gaps). avg ~8.44 (up from 8.33).

## Loop 28 Result
One new file: `packages/core/test/dag.test.ts` — 7 DAG enforcement tests. Cross-package rules: `packages/core/src` no `@tiercade/{state,ui,theme}` imports; `packages/state/src` no `@tiercade/{ui,theme}` imports; `packages/ui/src` no `@tiercade/state` import; `packages/theme` no `@tiercade/*` imports. Within-app rules: `utils/` no higher layers; `hooks/` no `components/`/`pages/` imports; `components/` no `pages/` imports. Violation detection verified via inline Node script (injecting a forbidden import string caught immediately). Finding F-020 resolved. data_flow UP: 6.5→8.0. Tests: 35 suites, 234 tests, all green.
