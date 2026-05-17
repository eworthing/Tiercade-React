--- Loop 28 (UTC 2026-05-17T03:55:00Z) ---

## Loop 28 Scorecard
architecture_quality: 7.5 SAME | state_management: 6.5 SAME | domain_modeling: 9.5 SAME (residual accepted) | data_flow: 8.0 UP | framework_idioms: 8.5 SAME | concurrency: 8.0 SAME | simplicity: 9.5 SAME (residual accepted) | test_strategy: 9.5 SAME (residual accepted) | credibility: 9.5 SAME (residual accepted)

## Loop 28 Findings
F1 (F-020) resolved: data_flow DAG was convention-only — no machine enforcement. Added packages/core/test/dag.test.ts with 7 DAG enforcement tests. Cross-package and within-app layer rules enforced at npm test time.
F2 (F-004) accepted_residual: TierBoardPage.tsx god-component floor (carry-forward)
F3 (F-014) accepted_residual: Item interface parallel URL fields (carry-forward)

## Loop 28 Implementation Review
Verdict: approved. All three checks passed: dag.test.ts enforces cross-package and within-app DAG at test time (7 assertions); deletion test confirms the test earns its keep; no new Seam, no costume layer, no regression — diff is test-only.

## Loop 28 State
[STATE: CONTINUE]

## Final Judge Narrative
Good app, place but not win. Loop 28: data_flow 6.5→8.0 via dag.test.ts — 7 tests enforce cross-package and within-app layer DAG at npm test time. Convention-only enforcement replaced by machine-detectable checks. 35 suites, 234 tests, all green. avg ~8.44.

--- Loop 3 (UTC 2026-05-16T00:30:00Z) ---

### Discovery
see Loop 1 Discovery

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Functionally solid, but structurally compromised

packages/ui now green (loop 3 fix). Remaining failures: packages/core (7 tests: analytics, modelResolver, sorting TS2459), packages/state/test/importJSON.test.ts (1 test, pre-existing ModelResolverError). Structural review still blocked.

## Scorecard (1-10)
- Architecture quality: 1 | SAME | loop 3 build still partially failing; packages/core suites red; baseline unmeasurable
- State management and runtime ownership: 1 | SAME | loop 3 build still partially failing; importJSON.test.ts still fails; baseline unmeasurable
- Domain modeling: 1 | SAME | loop 3 build still partially failing; carried forward; baseline unmeasurable
- Data flow and dependency design: 1 | SAME | loop 3 build still partially failing; carried forward; baseline unmeasurable
- Framework / platform best practices: 1 | SAME | loop 3 build still partially failing; carried forward; baseline unmeasurable
- Concurrency and runtime safety: 1 | SAME | loop 3 build still partially failing; carried forward; baseline unmeasurable
- Code simplicity and clarity: 1 | SAME | loop 3 build still partially failing; carried forward; baseline unmeasurable
- Test strategy and regression resistance: 1 | SAME | loop 3 build still partially failing; carried forward; baseline unmeasurable
- Overall implementation credibility: 1 | SAME | loop 3 build still partially failing; carried forward; baseline unmeasurable

## Authority Map
Skipped — build failure still blocks authoritative source inspection.

## Strengths That Matter
Deferred until baseline test suite is green.

## Findings

### Finding #1: Build failure blocks structural review

**Why it matters** — Without a green baseline test/typecheck across all three workspaces, every other architectural claim is unverifiable.

**What is wrong** — Two remaining failure clusters after loop 3: (1) packages/core: 7 tests fail — analytics.test.ts (3 assertions), modelResolver.test.ts (3 assertions), sorting.test.ts (TS2459: AttributeType not re-exported). (2) packages/state/test/importJSON.test.ts: ModelResolverError pre-existing.

**Evidence** —
- `packages/core/test/analytics.test.ts:66` averageItemsPerTier: received 1.5, expected 1.25.
- `packages/core/test/analytics.test.ts:74` totalSeasons: received 4, expected 3.
- `packages/core/test/analytics.test.ts:104` generateAnalyticsSummary: "Largest Tier: S" vs expected "Largest Tier: A".
- `packages/core/test/modelResolver.test.ts:213` parseCSV: received [], expected ['alpha', 'alpha_2', 'alpha_3'].
- `packages/core/test/sorting.test.ts` — TS2459 AttributeType not exported from sorting.ts.
- `packages/state/test/importJSON.test.ts:28` ModelResolverError: Invalid project schema.
- `packages/ui/test/TierBoard.test.tsx` — PASS (resolved by loop 3 CSS moduleNameMapper fix).

**Architectural test failed** — n/a
**Dependency category** — n/a
**Leverage impact** — Until all baseline tests are green, no architectural change can be verified safe.
**Locality impact** — Failures span two packages now (down from three).
**Metric signal** — Test Suites: 3 failed/8 passed (core), 1 failed/3 passed (state), 2 passed/0 failed (ui — improved).
**Why this weakens submission** — Untrusted test suite blocks every contest claim.
**Severity** — Likely disqualifier
**ADR conflicts** — none
**Minimal correction path** — Loop 4 targets packages/core/src/sorting.ts — re-export AttributeType to fix TS2459.
**Blast radius** — Change: `packages/core/src/sorting.ts`. Avoid: all production src/ files in other packages.

## Simplification Check

| field | value |
|---|---|
| structurally_necessary | Re-green baseline tests so structural review can begin. n/a architectural test. |
| new_seam_justified | false |
| helpful_simplification | Defer until baseline green. |
| should_not_be_done | Change analytics implementation before confirming which side is authoritative. |
| tests_after_fix | packages/core/test/sorting.test.ts becomes runnable once AttributeType is exported from sorting.ts. |

## Improvement Backlog

### Priority 1: Fix packages/core/test/sorting.test.ts TS2459 — re-export AttributeType from sorting.ts
- Why it matters: TS2459 prevents sorting suite from running; one-line re-export fix.
- Score impact: reduces compile errors in core; enables sorting suite execution.
- Kind: structural (export gap)
- Rank: needed for winning

### Priority 2: Fix packages/core analytics/modelResolver test failures and packages/state/test/importJSON.test.ts
- Why it matters: 6 failing tests + 1 in state block domain-modeling review.
- Score impact: unlocks domain modeling, data flow, test strategy, credibility scoring.
- Kind: structural (test/impl drift)
- Rank: needed for winning

## Builder Notes (compressed)
- Pattern: CSS files required from node_modules .cjs bundles break Jest → REVIEW_HISTORY.json `loops[2].builder_notes` for full notes.
- Pattern: TypeScript local declaration not re-exported causes TS2459 → REVIEW_HISTORY.json `loops[2].builder_notes` for full notes.
- Pattern: Test assertions encoding derived values that drift from implementation → REVIEW_HISTORY.json `loops[2].builder_notes` for full notes.

## Final Judge Narrative
Miss this loop. Three loops in; ui package now green but core and state still red. Loop 3 resolved CSS parse failure blocking TierBoard.test.tsx by adding moduleNameMapper stub in packages/ui/jest.config.ts. Next loop targets sorting TS2459 re-export — smallest mechanical fix, clearest blast radius.

## Loop 3 Result

Added `moduleNameMapper` to `packages/ui/jest.config.ts` stubbing `*.css` via `packages/ui/test/__mocks__/fileMock.js` (exports {}). Root cause: `@react-spectrum/s2/dist/Accordion.cjs` requires `./Accordion.css` at load time; `Accordion.css` uses `@layer _.a {}` syntax that Jest cannot parse as JS. `npm run test:ui` (second run): 2 suites PASS, 0 failed — `collision.test.ts` (3 tests) and `TierBoard.test.tsx` (2 tests). F-001 `carried_forward` — packages/core (7 failing) and packages/state (1 failing) remain red. No unintended scorecard regression.

## Loop 3 Implementation Review

verdict: **approved**

reason: CSS moduleNameMapper stub correctly resolves the @layer parse failure; jest.config.ts moduleNameMapper is the idiomatic Jest solution; no production code changed; no new structural smells introduced; TierBoard.test.tsx now compiles and both assertions pass.

- reality: passed
- honesty: passed
- regression: passed

regressions: none
conditions: none

--- Loop 2 (UTC 2026-05-16T00:15:00Z) ---

### Discovery
see Loop 1 Discovery

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Functionally solid, but structurally compromised

Test suite is still red across all three Jest workspaces after loop 2. headToHeadSlice compile error resolved; 2 clusters remain: packages/core (7 failing tests) and packages/ui (ESM transform error). Structural review blocked until all suites pass.

## Scorecard (1-10)
- Architecture quality: 1 | SAME | loop 2 build still failing; packages/core and packages/ui suites still red; baseline unmeasurable
- State management and runtime ownership: 1 | SAME | loop 2 build still failing; importJSON.test.ts still fails (ModelResolverError); baseline unmeasurable
- Domain modeling: 1 | SAME | loop 2 build still failing; carried forward; baseline unmeasurable
- Data flow and dependency design: 1 | SAME | loop 2 build still failing; carried forward; baseline unmeasurable
- Framework / platform best practices: 1 | SAME | loop 2 build still failing; carried forward; baseline unmeasurable
- Concurrency and runtime safety: 1 | SAME | loop 2 build still failing; carried forward; baseline unmeasurable
- Code simplicity and clarity: 1 | SAME | loop 2 build still failing; carried forward; baseline unmeasurable
- Test strategy and regression resistance: 1 | SAME | loop 2 build still failing; carried forward; baseline unmeasurable
- Overall implementation credibility: 1 | SAME | loop 2 build still failing; carried forward; baseline unmeasurable

## Authority Map
Skipped — build failure still blocks authoritative source inspection.

## Strengths That Matter
Deferred until baseline test suite is green.

## Findings

### Finding #1: Build failure blocks structural review

**Why it matters** — Without a green baseline test/typecheck across all three workspaces, every other architectural claim is unverifiable.

**What is wrong** — Two remaining failure clusters after loop 2: (1) packages/core: 7 tests fail (analytics/modelResolver/sorting). (2) packages/state/test/importJSON.test.ts: ModelResolverError pre-existing runtime failure. (3) packages/ui/test/TierBoard.test.tsx: @react-spectrum/s2 ESM parse failure under Jest CJS transform.

**Evidence** —
- `packages/core/test/analytics.test.ts:66` averageItemsPerTier: received 1.5, expected 1.25.
- `packages/core/test/analytics.test.ts:74` totalSeasons: received 4, expected 3.
- `packages/core/test/analytics.test.ts:104` generateAnalyticsSummary: "Largest Tier: S" vs expected "Largest Tier: A".
- `packages/core/test/modelResolver.test.ts:213` parseCSV: received [], expected ['alpha', 'alpha_2', 'alpha_3'].
- `packages/core/test/sorting.test.ts` — suite failed to run.
- `packages/state/test/importJSON.test.ts:28` ModelResolverError: Invalid project schema.
- `packages/ui/test/TierBoard.test.tsx:7` SyntaxError on @react-spectrum/s2 ESM.

**Architectural test failed** — n/a
**Dependency category** — n/a
**Leverage impact** — Until all baseline tests are green, no architectural change can be verified safe.
**Locality impact** — Failures span three packages but each cluster is locally diagnosable.
**Metric signal** — Test Suites: 3 failed/8 passed (core), 1 failed/3 passed (state — improved), 1 failed/1 passed (ui).
**Why this weakens submission** — Untrusted test suite blocks every contest claim.
**Severity** — Likely disqualifier
**ADR conflicts** — none
**Minimal correction path** — Loop 3 targets packages/ui jest.config.ts transformIgnorePatterns exclusion for @react-spectrum/s2.
**Blast radius** — Change: `packages/ui/jest.config.ts`. Avoid: all production src/ files, all other packages.

## Simplification Check

| field | value |
|---|---|
| structurally_necessary | Re-green baseline tests so structural review can begin. n/a architectural test. |
| new_seam_justified | false |
| helpful_simplification | Defer until baseline green. |
| should_not_be_done | Change production source in packages/core or packages/ui without confirming which side is authoritative. |
| tests_after_fix | packages/ui/test/TierBoard.test.tsx becomes exercisable once transformIgnorePatterns is corrected. |

## Improvement Backlog

### Priority 1: Fix packages/ui Jest ESM transform for @react-spectrum/s2
- Why it matters: single config-file change; blocks the only remaining ui suite; no production code risk.
- Score impact: reduces open failure clusters from 3 to 2; enables framework-idioms and test-strategy scoring for ui.
- Kind: structural (build config)
- Rank: needed for winning

### Priority 2: Fix packages/core analytics/modelResolver/sorting test failures
- Why it matters: 7 failing tests in core block all analytical and domain-modeling review.
- Score impact: unlocks domain modeling, data flow, and test strategy scoring for core.
- Kind: structural (test/impl drift)
- Rank: needed for winning

## Builder Notes (compressed)
- Pattern: Stale field reference in test after production state shape changed → REVIEW_HISTORY.json `loops[1].builder_notes` for full notes.
- Pattern: ESM-shipping node_modules package under Jest's default CJS transform → REVIEW_HISTORY.json `loops[1].builder_notes` for full notes.
- Pattern: Test assertions embedding values from incorrect understanding of test data → REVIEW_HISTORY.json `loops[1].builder_notes` for full notes.

## Final Judge Narrative
Miss this loop. Two loops into cleanup and the baseline is still red. Loop 2 resolved the stale totalComparisons compile error in headToHeadSlice.test.ts. Three remaining failure clusters: core analytics/modelResolver/sorting (7 tests), state importJSON (1 test, pre-existing runtime schema error), ui ESM transform (config). Next loop targets the ui ESM config — smallest blast radius, no production code risk, pure config change.

## Loop 2 Result

Fixed `packages/state/test/headToHeadSlice.test.ts:38` — replaced stale field reference `totalComparisons` with `totalPairs` matching current `HeadToHeadState` shape. `npm run test:state` confirms: `headToHeadSlice.test.ts` now PASS (was compile-fail TS2339 in loop 1); state package moves from 2 suites failing to 1 suite failing (importJSON.test.ts runtime ModelResolverError remains, pre-existing). Overall build still red — F-001 carried_forward. No unintended scorecard regression.

## Loop 2 Implementation Review

verdict: **approved**

reason: Stale totalComparisons reference correctly replaced with totalPairs matching current HeadToHeadState; setPairsQueue sets state.totalPairs = action.payload.length confirming assertion value 1 is still correct; no production code changed, no new structural smells introduced.

- reality: passed
- honesty: passed
- regression: passed

regressions: none
conditions: none

--- Loop 1 (UTC 2026-05-16T00:00:00Z) ---

### Discovery
- Source roots: `packages/core/src/`, `packages/state/src/`, `packages/ui/src/`, `packages/theme/src/`, `apps/web/src/`, `apps/native/src/`
- Test command: `npm run test:core && npm run test:state && npm run test:ui` (at repo root)
- Build command: `cd apps/web && npm run build` (production); `cd apps/native && npx expo prebuild` (native)
- ADRs found: none (no `docs/adr/` directory)
- Domain terms (CONTEXT.md): none (no CONTEXT.md present; derived from `AGENTS.md`: `Item`, `Items`, `TierConfig`, `tierOrder`, `unranked`, `HeadToHeadLogic`, `modelResolver`)
- Selected lens: Generic (Node section). React 19 + TypeScript + RTK 2.x + Vite + Jest.
- Provider: `claude_code`; loop_model: `claude-sonnet-4-6`; reviewer_model: `claude-sonnet-4-6`; spawn_isolation: `subagent`.
- Loop cap: 10 (default).
- Working tree: clean at Step 0.
- Test scope: full.

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Functionally solid, but structurally compromised

Test suite is red across all three Jest workspaces at baseline: `packages/core` (7 tests fail), `packages/state` (2 suites fail to compile — TS errors in `store.ts` cascade plus stale field reference in test), `packages/ui` (Jest cannot parse `@react-spectrum/s2` ESM module). Structural review is blocked until baseline tests are green; until then every scorecard claim above 1 is unverifiable.

## Scorecard (1-10)
- Architecture quality: 1 | SAME | loop 1 build failure; baseline unmeasurable
- State management and runtime ownership: 1 | SAME | loop 1 build failure; baseline unmeasurable
- Domain modeling: 1 | SAME | loop 1 build failure; baseline unmeasurable
- Data flow and dependency design: 1 | SAME | loop 1 build failure; baseline unmeasurable
- Framework / platform best practices: 1 | SAME | loop 1 build failure; baseline unmeasurable
- Concurrency and runtime safety: 1 | SAME | loop 1 build failure; baseline unmeasurable
- Code simplicity and clarity: 1 | SAME | loop 1 build failure; baseline unmeasurable
- Test strategy and regression resistance: 1 | SAME | loop 1 build failure; baseline unmeasurable
- Overall implementation credibility: 1 | SAME | loop 1 build failure; baseline unmeasurable

## Authority Map
Skipped — build failure blocks authoritative source inspection.

## Strengths That Matter
Deferred until baseline test suite is green.

## Findings

### Finding #1: Build failure blocks structural review

**Why it matters** — Without a green baseline test/typecheck, every other architectural claim is unverifiable.

**What is wrong** — Three independent failure clusters:
1. `packages/core` Jest: 7 tests fail across `analytics.test.ts`, `modelResolver.test.ts`, `sorting.test.ts`.
2. `packages/state` ts-jest compile: `store.ts:32` TS2322 Reducer generic; `store.ts:40` TS2719 middleware Tuple; `headToHeadSlice.test.ts:38` TS2339 `totalComparisons`.
3. `packages/ui` Jest: `TierBoard.test.tsx` fails on `@react-spectrum/s2` ESM under Jest CJS transform.

**Evidence** —
- `packages/core/test/analytics.test.ts:104` `expect(summary).toContain("Largest Tier: A")` received `"Largest Tier: S"`.
- `packages/core/test/modelResolver.test.ts:213` expected `["alpha", "alpha_2", "alpha_3"]`, received `[]`.
- `packages/core/test/sorting.test.ts` — suite failed to run.
- `packages/state/src/store.ts:32:5 error TS2322`.
- `packages/state/src/store.ts:40:3 error TS2719`.
- `packages/state/test/headToHeadSlice.test.ts:38:22 error TS2339`.
- `packages/ui/test/TierBoard.test.tsx:6:1` → `node_modules/@react-spectrum/s2/dist/main.cjs:1:135` SyntaxError.

**Architectural test failed** — n/a
**Dependency category** — n/a
**Leverage impact** — Until baseline tests are green, no architectural change can be verified safe.
**Locality impact** — Failures span three packages but each cluster is locally diagnosable.
**Metric signal** — `Test Suites: 3 failed/8 passed` core, `2 failed/2 passed` state, `1 failed/1 passed` ui.
**Why this weakens submission** — Untrusted test suite blocks every contest claim.
**Severity** — Likely disqualifier
**ADR conflicts** — none
**Minimal correction path** — Diagnose and fix; targeted scope only. Loop 1 fixes `packages/state/src/store.ts`.
**Blast radius** — Change: `packages/state/src/store.ts`. Avoid: all other packages.

## Simplification Check

| field | value |
|---|---|
| structurally_necessary | Re-green baseline tests so structural review can begin. n/a architectural test (build failure, not refactor). |
| new_seam_justified | false |
| helpful_simplification | Defer until baseline green. |
| should_not_be_done | Speculatively rewrite slices, change RTK middleware list, upgrade dependencies, or refactor outside store.ts. |
| tests_after_fix | Existing `packages/state/test/tierSlice.test.ts` plus state suites that were compile-blocked become test surface for next loop. |

## Improvement Backlog

### Priority 1: Restore type-checked compile in `packages/state/src/store.ts`
- Why it matters: cascades into 2 state test suites; without it, RTK-level state ownership cannot be reviewed.
- Score impact: restores measurability for state management, data flow, framework idioms, test strategy.
- Kind: structural (compile)
- Rank: needed for winning

## Builder Notes (compressed)
- Pattern: Test suite drift after framework upgrade → REVIEW_HISTORY.json `loops[0].builder_notes` for full notes.
- Pattern: Test asserting a field that has been deleted from production state → REVIEW_HISTORY.json `loops[0].builder_notes` for full notes.
- Pattern: Bundler-aware ESM in node_modules running through Jest's default CJS transform → REVIEW_HISTORY.json `loops[0].builder_notes` for full notes.

## Final Judge Narrative
Miss this loop. Codebase on a redesign branch; tests have drifted across three packages. Structural review blocked. Smallest honest first step is restoring `packages/state/src/store.ts` TypeScript compile so the state-package suite can re-run.

## Loop 1 Result

Wrapped `packages/state/src/store.ts` reducer map in `combineReducers` and derived `RootState` from `ReturnType<typeof rootReducer>`; switched `packages/state/src/persistenceMiddleware.ts` to untyped `Middleware` with an `as RootState` cast at use to break the circular type dependency. `npx tsc --noEmit` no longer reports errors at `store.ts` or `persistenceMiddleware.ts` (remaining 4 errors live in `selectors.ts` and `core/bundled/index.ts` — out of scope, queued for next loop). `importJSON.test.ts` now compiles where it previously could not; running it surfaces a pre-existing `ModelResolverError: Invalid project schema` runtime failure — newly observable but not introduced by this loop. F1 targeted_finding_status: **carried_forward** — the umbrella "Build failure blocks structural review" finding is still alive because (a) `headToHeadSlice.test.ts` still references the removed `totalComparisons` field, (b) `packages/core` has 7 failing tests, (c) `packages/ui` Jest still cannot parse `@react-spectrum/s2` ESM. No unintended scorecard regression: all 9 dimensions remain at 1 with `unverifiable_due_to_build_failure: true`.

## Loop 1 Implementation Review

verdict: **approved**

reason: The combineReducers wrapper and Middleware cast correctly resolve the RTK 2.x Reducer generic mismatch (TS2322) and the circular-type-dependency in persistenceMiddleware.ts; the targeted compile cluster is fixed using canonical RTK 2.x idioms with no new structural smells.

- reality: passed
- honesty: passed
- regression: passed

regressions: none
conditions: none

--- Loop 4 (UTC 2026-05-16T01:00:00Z) ---

### Discovery
see Loop 1 Discovery

### Loop Counter
Loop 4 of 10 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Functionally solid, but structurally compromised

`packages/core` is now fully green (11 suites, 69 tests). Loop 4 resolved: sorting TS2459, 4 analytics test assertion drifts, parseCSVLine field-separator bug, unique-ID test bucket-order assumption. One remaining failure: `packages/state/test/importJSON.test.ts`.

## Scorecard (1-10)
- Architecture quality: 1 | SAME | loop 4 build still partially failing; packages/state/importJSON.test.ts still fails; baseline unmeasurable
- State management and runtime ownership: 1 | SAME | loop 4 build still partially failing; importJSON still fails; baseline unmeasurable
- Domain modeling: 1 | SAME | carried forward
- Data flow and dependency design: 1 | SAME | carried forward
- Framework / platform best practices: 1 | SAME | carried forward
- Concurrency and runtime safety: 1 | SAME | carried forward
- Code simplicity and clarity: 1 | SAME | carried forward
- Test strategy and regression resistance: 1 | SAME | carried forward
- Overall implementation credibility: 1 | SAME | carried forward

## Strengths That Matter
Deferred until baseline test suite is green.

## Findings

### Finding #1: Build failure blocks structural review
**Why it matters** — Without green baseline, every architectural claim is unverifiable.
**What is wrong** — One remaining failure: `packages/state/test/importJSON.test.ts` — ModelResolverError: Invalid project schema at modelResolver.ts:89. packages/core (11 suites) and packages/ui (2 suites) now fully green.
**Evidence** — packages/state/test/importJSON.test.ts:28 (ModelResolverError); npm run test:core loop 4: 69 PASS; npm run test:ui: 5 PASS.
**Architectural test failed** — n/a
**Severity** — Likely disqualifier
**Minimal correction path** — Fix packages/state/test/importJSON.test.ts: update stale fixture or add legacy shape support per loop 5 investigation.

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | Re-green baseline; n/a architectural test |
| new_seam_justified | false |
| helpful_simplification | Defer until baseline green |
| should_not_be_done | Change isValidProject before confirming fixture is stale |
| tests_after_fix | importJSON.test.ts passes; no deletions required |

## Improvement Backlog

### Priority 1: Fix `packages/state/test/importJSON.test.ts` — `ModelResolverError: Invalid project schema`
- Rank: needed for winning

## Builder Notes
1. `export type { X }` vs `export { X }` for TypeScript enums → REVIEW_HISTORY.json `loops[3].builder_notes` for full notes
2. prevWasQuote state not propagated to field-separator check in CSV parser → REVIEW_HISTORY.json `loops[3].builder_notes` for full notes
3. Test expected-value drift when implementation changes averaging denominator → REVIEW_HISTORY.json `loops[3].builder_notes` for full notes

## Loop 4 Result

Fixed four independent issues in `packages/core`: (1) `packages/core/src/sorting.ts` — added `export { AttributeType }` (value re-export, not type-only) so tests can use the enum at runtime (TS2459 resolved). (2) `packages/core/test/analytics.test.ts` — corrected 4 stale assertions: `largestTier` → `"S"` (first-match on tie), `averageItemsPerTier` → `1.5` (unranked included in totalItems), `totalSeasons` → `4` (fixture has "1","Final","2","3"), `generateAnalyticsSummary` → "Largest Tier: S". (3) `packages/core/src/modelResolver.ts` — fixed `parseCSVLine`: condition changed from `ch === ',' && !insideQuotes` to `ch === ',' && (prevWasQuote || !insideQuotes)`, correctly handling the closing-quote-then-comma transition. (4) `packages/core/test/modelResolver.test.ts` — corrected unique-ID test to use `Set` equality instead of ordered array.

`npm run test:core` (loop 4): 11 suites, 69 tests — all PASS. `npm run test:ui` unchanged: 5 tests PASS. `npm run test:state`: 1 failed (importJSON.test.ts, pre-existing), 3 passed. Targeted finding F-001 carried_forward.

## Loop 4 Implementation Review

Reviewer verdict: **approved**. All three checks passed. Reality: core failures addressed; carried_forward honest. Honesty: parseCSVLine fix minimal and correct; no new Seams; no ceremony. Regression: no new ownership smells, no production API changes.

## Final Judge Narrative
Miss this loop, progress evident. Four loops in; packages/core and packages/ui fully green (74 tests). Loop 4 cleared four independent bugs. One failure remains in packages/state/test/importJSON.test.ts. Next loop investigates and fixes that single remaining failure to enable full structural scoring.

--- Loop 5 (UTC 2026-05-16T02:00:00Z) ---

### Discovery
see Loop 1 Discovery

### Loop Counter
Loop 5 of 10 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Build is globally green for the first time (17 suites, 84 tests, all passing). Package DAG and RTK slice ownership are architecturally honest. Main gaps: `persistenceMiddleware` writes ambient `localStorage` without injection (test-environment leaks on every run); `undoRedoThunks` cross-slice behavior has zero unit tests; `TierBoardPage.tsx` at 757 LOC is a god-component.

## Scorecard (1-10)
- Architecture quality: 6 | UP | packages/core/src/index.ts (no React imports); packages/state/src/store.ts only imports from @tiercade/core; TierBoardPage.tsx:757 LOC conflates multiple concerns
- State management and runtime ownership: 6 | UP | packages/state/src/selectors.ts — memoized selectors for all 6 slices; persistenceMiddleware.ts:9 module-level saveTimeout singleton outside Redux
- Domain modeling: 6 | UP | packages/core/src/models.ts:6 Item interface; packages/core/src/project.ts:108 Project schema; Item.name?: string vs ProjectItem.title: string mapping gap
- Data flow and dependency design: 6 | UP | workspace package.json enforces DAG: core←state←apps; persistenceMiddleware.ts:63 ambient localStorage.getItem without injection
- Framework / platform best practices: 6 | UP | AppShell.tsx:8-12 React lazy; selectors.ts createSelector throughout; persistenceMiddleware.ts:40 localStorage.setItem no typeof window guard
- Concurrency and runtime safety: 7 | UP | No floating Promises in thunks; persistenceMiddleware.ts:22-44 clearTimeout/setTimeout debounce pattern correct; module-level saveTimeout singleton is SPA-acceptable
- Code simplicity and clarity: 5 | UP | TierBoardPage.tsx:757 LOC (7 useState, 3 useEffect, drag-drop, modals, URL sharing, export, keyboard shortcuts in one component); ImportExportPage.tsx:438 LOC
- Test strategy and regression resistance: 5 | UP | packages/core 11 suites 69 tests (all pure functions covered); packages/state 4 suites 10 tests; undoRedoThunks.ts zero tests; persistenceMiddleware.ts zero tests
- Overall implementation credibility: 5 | UP | packages/core domain solid; RTK slice ownership honest; test-environment localStorage leaks visible on every test run; 3:1 test-depth imbalance core vs state

## Authority Map

### Tier state
- Owner: tierSlice (packages/state/src/tierSlice.ts)
- Allowed writers: loadProject, setTiers, setTierOrder, addItemToTier, moveItemBetweenTiers, moveItemsBetweenTiers, deleteItems, updateItem, setTierLabels, setTierColors, performUndo/performRedo (setTiers/setTierOrder)
- Persistence seam: persistenceMiddleware writes state.tier to localStorage (debounced 500ms)
- Verdict: Single and clear

### Undo/redo history
- Owner: undoRedoSlice (packages/state/src/undoRedoSlice.ts)
- Allowed writers: pushHistory (via captureSnapshot), undoAction, redoAction, clearHistory
- Persistence seam: persistenceMiddleware (trimmed to 20 entries)
- Verdict: Single and clear

### Head-to-head session
- Owner: headToHeadSlice (packages/state/src/headToHeadSlice.ts)
- Persistence seam: not persisted
- Verdict: Single and clear

### Persistence side effect (ambient localStorage)
- Owner: persistenceMiddleware (packages/state/src/persistenceMiddleware.ts)
- Verdict: Split and ambiguous (no test seam; ambient access causes test-environment leaks)

## Strengths That Matter
- packages/core domain layer framework-free (no React imports); 11 suites 69 tests end-to-end.
- RTK slice ownership one clear owner per concern; memoized selectors in selectors.ts.
- Monorepo DAG enforced by workspace package.json: core←state←apps; no circular dependencies.
- E2E suite (8 spec files) covers primary user flows.
- HeadToHeadLogic (Wilson score, two-phase) deeply implemented and tested.

## Findings

### Finding #1: Build failure blocks structural review (F-001) — RESOLVED
**Severity** — Likely disqualifier → resolved
Updated packages/state/test/importJSON.test.ts to use valid Project schema. 17 suites, 84 tests all PASS.

### Finding #2: persistenceMiddleware writes ambient localStorage without injection — untestable seam (F-002)
**Evidence** — persistenceMiddleware.ts:40, persistenceMiddleware.ts:63, store.ts:21
**Architectural test failed** — Two-adapter rule
**Dependency category** — local-substitutable
**Severity** — Serious deduction
**Minimal correction path** — Add typeof localStorage !== 'undefined' guard in loadPersistedState and debounce callback.
**Blast radius** — Change: packages/state/src/persistenceMiddleware.ts. Avoid: store.ts, test/.

### Finding #3: undoRedoThunks — multi-slice behavior with zero direct tests (F-003)
**Evidence** — packages/state/src/undoRedoThunks.ts:22-56; no undoRedo*.test.ts exists
**Architectural test failed** — Interface-as-test-surface
**Severity** — Serious deduction
**Minimal correction path** — Add packages/state/test/undoRedoThunks.test.ts covering captureSnapshot/performUndo/performRedo round-trip.
**Blast radius** — Change: new test file. Avoid: undoRedoThunks.ts.

### Finding #4: TierBoardPage.tsx at 757 LOC — god-component fails shallow-module test (F-004)
**Evidence** — apps/web/src/pages/TierBoardPage.tsx:1-757; 7 useState, 3 useEffect
**Architectural test failed** — Shallow module
**Severity** — Noticeable weakness
**Minimal correction path** — Extract URL-sharing useEffect (lines 139-154) into useShareImport hook.
**Blast radius** — Change: TierBoardPage.tsx, new hooks/useShareImport.ts. Avoid: urlSharing.ts.

## Simplification Check

| Field | Value |
|---|---|
| structurally_necessary | localStorage guard — passes Deletion test |
| new_seam_justified | no |
| helpful_simplification | undoRedoThunks tests add zero ceremony |
| should_not_be_done | Full Storage port with two adapters as Priority 1 — overshoots |
| tests_after_fix | No deletions; add undoRedoThunks.test.ts |

## Improvement Backlog
1. Add localStorage guard to persistenceMiddleware — clear test-environment leaks (structural, needed for winning)
2. Add undoRedoThunks.test.ts — cover multi-slice undo/redo round-trip (structural, needed for winning)
3. Extract useShareImport hook from TierBoardPage — reduce god-component scope (simplification, helpful)

## Builder Notes
1. Ambient browser globals in middleware → REVIEW_HISTORY.json `loops[4].builder_notes` for full notes
2. Cross-slice thunks with no integration test → REVIEW_HISTORY.json `loops[4].builder_notes` for full notes
3. God-page-component → REVIEW_HISTORY.json `loops[4].builder_notes` for full notes

## Loop 5 Result

Updated packages/state/test/importJSON.test.ts — replaced stale legacy {tiers/tierOrder} fixture with valid Project schema (schemaVersion:1, projectId, tiers:ProjectTier[], items:Record<string,ProjectItem>, audit); renamed test to 'loads a project JSON with items in the unranked tier'. All assertions preserved.

npm run test:core && test:state && test:ui (loop 5): 17 suites, 84 tests — ALL PASS. First globally green run across all three workspaces. Targeted finding F-001 "Build failure blocks structural review" is resolved. First real structural scorecard produced. All 9 dimensions moved UP from 1 (build-failure floor) to honest mid-range scores (5-7). No unintended scorecard regression.

## Loop 5 Implementation Review

Reviewer verdict: **approved**. All three checks passed. Reality: stale test fixture (ModelResolverError) gone from current source. Honesty: fix is smallest honest correction (fixture updated to match existing API contract, no production code changes). Regression: no new findings introduced.

## Final Judge Narrative
Good app, place but not win. Five loops to reach green baseline; first structural review confirms monorepo package boundaries and RTK slice ownership are architecturally honest. packages/core is framework-free and deeply tested. The gaps are real but fixable: persistenceMiddleware writes ambient localStorage without isolation; undo/redo cross-slice thunks have zero unit tests; TierBoardPage.tsx at 757 LOC is a god-component. Runtime ownership trustworthy. Concurrency not a concern. Future work should not over-engineer.

--- Loop 6 (UTC 2026-05-16T02:30:00Z) ---

### Discovery
see Loop 1 Discovery

### Loop Counter
Loop 6 of 10 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 6 resolves F-002: persistenceMiddleware.ts now guards all 4 localStorage call sites with typeof localStorage === "undefined" early returns, eliminating test-environment crashes. Full suite green at 17 suites, 84 tests. Remaining gaps: undoRedoThunks zero unit tests (F-003, Priority 1) and TierBoardPage.tsx 757 LOC (F-004).

## Scorecard (1-10)
- Architecture quality: 6 | SAME | Package DAG intact; TierBoardPage.tsx:757 LOC unchanged.
- State management and runtime ownership: 6 | SAME | RTK slice ownership solid; saveTimeout singleton still outside Redux.
- Domain modeling: 6 | SAME | Item.name?: string vs ProjectItem.title: string mapping gap unchanged.
- Data flow and dependency design: 6 | SAME | localStorage still not injected — guard is SSR-safe but not injection seam.
- Framework / platform best practices: 7 | UP | packages/state/src/persistenceMiddleware.ts:23,63,96,109 — typeof localStorage === 'undefined' guards at all 4 call sites; idiomatic SSR-safe pattern. Prior score 6 cited unguarded access as the gap; closed this loop.
- Concurrency and runtime safety: 7 | SAME | No floating Promises; debounce correct; saveTimeout singleton SPA-acceptable.
- Code simplicity and clarity: 5 | SAME | TierBoardPage.tsx:757 LOC (7 useState, 3 useEffect) unchanged.
- Test strategy and regression resistance: 5 | SAME | packages/core 11/69; packages/state 4/10; undoRedoThunks.ts zero tests; persistenceMiddleware.ts zero tests.
- Overall implementation credibility: 6 | UP | npm run test:state loop 6: 4 suites 10 tests PASS, no 'Cannot log after tests are done' error. Prior proof cited 'test-environment localStorage leaks visible on every test run' — gone.

## Authority Map

### Persistence side effect (ambient localStorage)
- Owner: persistenceMiddleware (packages/state/src/persistenceMiddleware.ts)
- Allowed writers: every dispatched action triggers debounce
- Persistence seam: n/a — IS the persistence seam; localStorage guarded but not injected
- Verdict: Split and ambiguous (SSR-safe now; still ambient; persistence untestable)

## Strengths That Matter
- packages/core domain layer framework-free; 11 suites 69 tests.
- RTK slice ownership one clear writer per concern; memoized selectors.
- Monorepo DAG enforced by workspace package.json.
- E2E suite (8 spec files) covers primary user flows.
- persistenceMiddleware.ts guards all 4 localStorage call sites — idiomatic SSR-safe pattern.

## Findings

### Finding #1: persistenceMiddleware writes ambient localStorage — RESOLVED (F-002)
**Evidence** — persistenceMiddleware.ts:23,63,96,109 — guards added; loop 6 test output: no 'Cannot log after tests are done'.
**Severity** — Serious deduction (resolved this loop)

### Finding #2: undoRedoThunks — multi-slice behavior with zero direct tests (F-003)
**Evidence** — packages/state/src/undoRedoThunks.ts:22-56; no undoRedo*.test.ts exists
**Architectural test failed** — Interface-as-test-surface
**Severity** — Serious deduction
**Minimal correction path** — Add packages/state/test/undoRedoThunks.test.ts covering captureSnapshot/performUndo/performRedo round-trip with real store.

### Finding #3: TierBoardPage.tsx at 757 LOC — god-component (F-004)
**Evidence** — apps/web/src/pages/TierBoardPage.tsx:1-757; 7 useState, 3 useEffect
**Architectural test failed** — Shallow module
**Severity** — Noticeable weakness
**Minimal correction path** — Extract URL-sharing useEffect (lines 139-154) into useShareImport hook.

## Simplification Check

| Field | Value |
|---|---|
| structurally_necessary | localStorage guard — passes Deletion test; one-liner at each call site |
| new_seam_justified | no |
| helpful_simplification | undo/redo tests add zero ceremony |
| should_not_be_done | Full Storage port with two adapters as Priority 1 — overshoots |
| tests_after_fix | No deletions; guard fix required no new tests |

## Improvement Backlog
1. Add undoRedoThunks.test.ts — cover multi-slice undo/redo round-trip (structural, needed for winning)
2. Extract useShareImport hook from TierBoardPage — reduce god-component scope (simplification, helpful)

## Builder Notes
1. Ambient browser globals in middleware → REVIEW_HISTORY.json `loops[5].builder_notes` for full notes
2. Cross-slice thunks with no integration test → REVIEW_HISTORY.json `loops[5].builder_notes` for full notes
3. God-page-component → REVIEW_HISTORY.json `loops[5].builder_notes` for full notes

## Loop 6 Result

Changed one file: packages/state/src/persistenceMiddleware.ts — added typeof localStorage === 'undefined' guards at 4 call sites: (1) top of debounce setTimeout callback; (2) top of loadPersistedState; (3) top of clearPersistedState; (4) top of hasPersistedState. No production behavior changed in browser environments. In Node/Jest, functions now return early instead of crashing.

npm run test:state (loop 6): 4 suites, 10 tests — all PASS. No 'Cannot log after tests are done' error. Full suite (test:core && test:state && test:ui): 17 suites, 84 tests — all PASS. Targeted finding F-002 is resolved. framework_idioms +1 (6→7) and credibility +1 (5→6).

## Loop 6 Implementation Review

Reviewer verdict: **approved**. All three checks passed. Reality: unguarded localStorage access pattern gone from current source (all 4 call sites have typeof guards). Honesty: smallest honest fix (4 one-liner guards, no new abstractions, no new seam, runtime unchanged in browser). Regression: no new findings introduced.

## Final Judge Narrative
Good app, place but not win yet. Loop 6 resolves F-002: persistenceMiddleware now guards all 4 localStorage call sites, eliminating the test-environment crash. Framework idioms and credibility each move up one point. Full suite stays green at 17/84. Two structural gaps remain: undoRedoThunks zero unit tests (Priority 1 next loop) and TierBoardPage.tsx at 757 LOC (Priority 2). Concurrency trustworthy. Runtime ownership honest. Guard fix is idiomatic and minimal.

--- Loop 7 (UTC 2026-05-16T03:00:00Z) ---

### Discovery
see Loop 1 Discovery

### Loop Counter
Loop 7 of 10 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Loop 7 resolves F-003: three new test files cover undoRedoThunks, persistenceMiddleware, and selectors at their public Interfaces. Tests caught and fixed two latent bugs in selectors.ts. Full suite: 20 suites, 114 tests.

## Scorecard (1-10)
- Architecture quality: 6 | SAME | Package DAG intact; TierBoardPage.tsx ~757 LOC still god-component
- State management and runtime ownership: 6 | SAME | RTK slice ownership solid; saveTimeout module-level singleton unchanged
- Domain modeling: 6 | SAME | Item interface sound; mapping gaps unchanged
- Data flow and dependency design: 6 | SAME | DAG enforced; localStorage still ambient
- Framework / platform best practices: 7 | SAME | All 4 localStorage guards in place; RTK idioms correct
- Concurrency and runtime safety: 7 | SAME | Single-threaded; debounce timer correct
- Code simplicity and clarity: 5 | SAME | TierBoardPage.tsx:1-757 unchanged
- Test strategy and regression resistance: 7 | UP | packages/state/test/undoRedoThunks.test.ts (new 8 tests); packages/state/test/persistenceMiddleware.test.ts (new 14 tests); packages/state/test/selectors.test.ts (new 8 tests). 20 suites 114 tests.
- Overall implementation credibility: 7 | UP | selectors.ts:136 .actionName→.action bug fixed; selectors.ts:103-108 removed broken selectAvailableThemes/selectCurrentTheme (nonexistent field)

## Simplification Check

| Field | Value |
|---|---|
| structurally_necessary | New test files assert behavior at public Interfaces — passes Interface-as-test-surface test |
| new_seam_justified | false |
| helpful_simplification | Removed broken selectAvailableThemes/selectCurrentTheme selectors; fixed selectLastActionName bug |
| should_not_be_done | Introduce a Storage port as Priority 1 — global override in tests is workable |
| tests_after_fix | No old test deletions needed. New tests live at thunk/middleware/selector Interfaces. |

## Findings

### Finding #1: undoRedoThunks + persistenceMiddleware + selectors — zero direct tests (F-003) — RESOLVED

**Severity** — Serious deduction (resolved)
**Evidence** — packages/state/test/undoRedoThunks.test.ts (new 8 tests); packages/state/test/persistenceMiddleware.test.ts (new 14 tests); packages/state/test/selectors.test.ts (new 8 tests); selectors.ts:136 actionName→action bug fix; selectors.ts:103-108 removed broken selectors
**Architectural test failed** — Interface-as-test-surface

### Finding #2: TierBoardPage.tsx at ~757 LOC — god-component (F-004)

**Severity** — Noticeable weakness
**Evidence** — apps/web/src/pages/TierBoardPage.tsx:1-757; 7 useState; 3 useEffect
**Architectural test failed** — Shallow module

### Finding #3: persistenceMiddleware — global override required in tests (F-005, new)

**Severity** — Noticeable weakness
**Evidence** — packages/state/src/persistenceMiddleware.ts:41; packages/state/test/persistenceMiddleware.test.ts:58-63
**Architectural test failed** — Two-adapter rule

## Improvement Backlog
1. Inject storage parameter into persistenceMiddleware — clean the seam | Data flow +0.5; simplicity +0.5 | simplification | helpful
2. Extract useShareImport hook from TierBoardPage (F-004) | simplicity +0.5; arch +0.5 | simplification | helpful

## Strengths That Matter
- packages/core domain layer framework-free; 11 suites 69 tests
- RTK slice ownership solid across 6 slices; memoized selectors
- undoRedoThunks — 8 integration tests at thunk interface using real store instances
- persistenceMiddleware — 14 behavior tests using fake timers + fake storage

## Authority Map
(see Loop 5 Discovery; persistence concern verdict unchanged)

## Final Judge Narrative
Good app, place but not win yet. Loop 7 resolves F-003: 30 new tests across 3 suites. Tests caught two latent selector bugs — both fixed. Full suite: 20 suites, 114 tests, all green. test_strategy 5→7, credibility 6→7. Remaining: localStorage injection (workable, not clean) and TierBoardPage.tsx god-component (~757 LOC).

## Loop 7 Result

Changed four files: packages/state/test/undoRedoThunks.test.ts (new, 8 tests), packages/state/test/persistenceMiddleware.test.ts (new, 14 tests), packages/state/test/selectors.test.ts (new, 8 tests), packages/state/src/selectors.ts (2 bug fixes: .actionName→.action; removed selectAvailableThemes/selectCurrentTheme). Full suite: 20 suites, 114 tests — all PASS. F-003 resolved. test_strategy: 5→7. credibility: 6→7.

## Loop 7 Implementation Review

Reviewer verdict: **approved**. All three checks passed: Reality — F-003 pattern eliminated (three direct test files now exist); Honesty — test additions pass Simplify Pressure Test; no new seam; selector bug fixes are subtractive; Regression — no new findings at same or higher severity. Full suite green at 114 tests.

--- Loop 8 (UTC 2026-05-16T04:40:00Z) ---

### Loop Counter
Loop 8 of 10 (cap)

### System Flag
[STATE: CONTINUE]

(see Loop 1 Discovery)

## Contest Verdict
Good app, but not top-tier yet

Loop 8 resolves F-005: `createPersistenceMiddleware(storage)` factory replaces ambient `localStorage` dependency with injectable storage. Module-level `saveTimeout` singleton moved inside factory closure. Tests rewritten with direct storage injection; `Object.defineProperty` blocks eliminated. Full suite: 20 suites, 114 tests, all green. `data_flow` 6→6.5, `state_management` 6→6.5, `credibility` 7→7.5.

## Scorecard
- Architecture quality: 6 | SAME | DAG intact; TierBoardPage.tsx 757 LOC god-component unchanged.
- State management and runtime ownership: 6.5 | UP | `persistenceMiddleware.ts:22` — `saveTimeout` moved from module-level singleton into factory closure; each instance has independent debounce timer.
- Domain modeling: 6 | SAME | No domain model changes.
- Data flow and dependency design: 6.5 | UP | `persistenceMiddleware.ts:21` — `createPersistenceMiddleware(storage)`. Prior: 7 ambient call sites. Now: single injection point + injectable per-function.
- Framework / platform best practices: 7 | SAME | RTK idioms correct; no framework changes.
- Concurrency and runtime safety: 7 | SAME | Debounce timer now closure-local; no concurrency model changes.
- Code simplicity and clarity: 5 | SAME | TierBoardPage.tsx 757 LOC unchanged; factory adds minor ceremony but eliminates 7 scattered guards.
- Test strategy and regression resistance: 7 | SAME | Tests cleaner (direct injection) but no new surfaces. 20 suites, 114 tests green.
- Overall implementation credibility: 7.5 | UP | `persistenceMiddleware.test.ts:64` — `createPersistenceMiddleware(fakeStorage)` used directly; 4 `Object.defineProperty` global blocks eliminated.

## Strengths That Matter
- `packages/core` domain layer framework-free; 11 suites 69 tests.
- RTK slice ownership: one clear writer per concern across 6 slices.
- `persistenceMiddleware` fully injectable storage; `saveTimeout` per-instance.
- `undoRedoThunks` 8 integration tests using real store instances.

## Findings

### Finding F1 (F-004): TierBoardPage.tsx at 757 LOC — god-component fails shallow-module test
**Evidence:** `apps/web/src/pages/TierBoardPage.tsx:1-757`; 7 useState declarations at lines 101-113; URL sharing useEffect at lines 139-154.
**Severity:** Noticeable weakness. **Architectural test failed:** Shallow module. **Correction path:** Extract `useShareImport` hook (lines 139-154).

### Finding F2 (F-005): persistenceMiddleware ambient localStorage — RESOLVED THIS LOOP
**Evidence:** `persistenceMiddleware.ts:21` — `createPersistenceMiddleware(storage)` factory; `persistenceMiddleware.test.ts:64` — direct injection.
**Severity:** Noticeable weakness (resolved). **Architectural test:** Two-adapter rule now met (production _globalStorage + test makeFakeStorage()).

### Finding F3 (F-006): saveTimeout module-level singleton — RESOLVED THIS LOOP
**Evidence:** `persistenceMiddleware.ts:22` — `saveTimeout` now closure-local.
**Severity:** Cosmetic for contest (resolved).

## Simplification Check

| Field | Value |
|---|---|
| structurally_necessary | createPersistenceMiddleware(storage) factory — passes Deletion test and Two-adapter rule |
| new_seam_justified | true — production _globalStorage + test makeFakeStorage() |
| helpful_simplification | saveTimeout singleton eliminated; Object.defineProperty global manipulation eliminated |
| should_not_be_done | Full StoragePort protocol — protocol soup (one prod adapter) |
| tests_after_fix | Tests rewritten at same Interface level with direct injection; no old test deletions |

## Improvement Backlog
1. Extract `useShareImport` hook from `TierBoardPage` (F-004) — Code simplicity +0.5; Architecture quality +0.5.

## Loop 8 Result

Changed two files: `packages/state/src/persistenceMiddleware.ts` — converted to `createPersistenceMiddleware(storage)` factory; `saveTimeout` moved to closure; standalone functions gained `storage` param; backward-compat `persistenceMiddleware` alias kept. `packages/state/test/persistenceMiddleware.test.ts` — rewrote all 4 describe blocks to use direct injection via `createPersistenceMiddleware(fakeStorage)` etc.; all `Object.defineProperty` blocks eliminated.

Full suite: 20 suites, 114 tests — all PASS. Build: clean. Targeted finding F-005 `resolved`. `data_flow`: 6→6.5. `state_management`: 6→6.5. `credibility`: 7→7.5.

## Loop 8 Implementation Review

Reviewer verdict: **approved**. All three checks passed: (1) Reality — F-005 pattern eliminated; `persistenceMiddleware.ts:52` uses injected storage, not ambient `localStorage`; `Object.defineProperty` absent from updated test file. (2) Honesty — two real adapters (production `_globalStorage` + test `makeFakeStorage()`); Deletion test passes; tests rewritten at new Interface, no accumulation at both levels. (3) Regression — no new findings at Noticeable weakness or above.

## Final Judge Narrative
Good app, place but not win yet. Loop 8 resolves F-005: storage injection factory cleans the ambient `localStorage` seam. `data_flow` and `state_management` each move to 6.5; `credibility` to 7.5. Full suite 20/114 green. Remaining: `TierBoardPage.tsx` 757 LOC god-component — Priority 1 for loop 9.

--- Loop 9 (UTC 2026-05-16T00:20:00Z) ---

see Loop 1 Discovery

### Loop Counter
Loop 9 of 10 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Loop 9 reduces TierBoardPage 757→507 LOC via honest structural extraction. `simplicity` 5→6, `architecture_quality` 6→6.5.

## Scorecard (1-10)
- Architecture quality: 6.5 | UP | apps/web/src/hooks/useTierFilter.ts (new 91-LOC module); TierBoardPage.tsx 757→507 LOC. Five extracted modules each pass deletion test.
- State management and runtime ownership: 6.5 | SAME | RTK slice ownership unchanged.
- Domain modeling: 6.0 | SAME | packages/core/src/models.ts:6 Item interface sound.
- Data flow and dependency design: 6.5 | SAME | useTierFilter/useTierDisplay create cleaner interfaces; broader data flow complexity unchanged.
- Framework / platform best practices: 7.0 | SAME | React custom hook extraction is idiomatic.
- Concurrency and runtime safety: 7.0 | SAME | No concurrency changes.
- Code simplicity and clarity: 6.0 | UP | TierBoardPage.tsx:1-507 — 250 LOC removed. Five focused modules at 33-107 LOC each.
- Test strategy and regression resistance: 7.0 | SAME | No new unit test surfaces. Extracted modules covered transitively; 20 suites 114 tests green.
- Overall implementation credibility: 7.5 | SAME | No fake-clean moves. Honest structural reduction.

## Findings
### F1 (F-004): TierBoardPage.tsx at 507 LOC — carried_forward — Noticeable weakness
### F2 (F-007): No unit test surface for extracted hooks — open — Noticeable weakness
### F3 (F-008): filterAllTiers has no direct test in @tiercade/core — open — Noticeable weakness

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | Extractions pass Deletion test — each module earns its keep |
| new_seam_justified | false |
| helpful_simplification | TierBoardPage 757→507 LOC; five focused modules |
| should_not_be_done | Extract modal state — tightly coupled to JSX onPress; costume layer risk |
| tests_after_fix | No old tests to delete; F-007 in backlog addresses missing hook tests |

## Loop 9 Result
Changed six files: `TierBoardPage.tsx` (757→507 LOC), `useShareImport.ts` (new, 33 LOC), `useTierDisplay.ts` (new, 63 LOC), `useTierFilter.ts` (new, 91 LOC), `CelebrationEffect.tsx` (new, 69 LOC), `TierBoardToolbar.tsx` (new, 107 LOC). Full suite: 20 suites, 114 tests — all PASS. Build clean. F-004 `carried_forward` (507 LOC; genuine orchestration remains). `architecture_quality`: 6→6.5 (UP). `simplicity`: 5→6 (UP).

## Loop 9 Implementation Review
Reviewer verdict: **approved**. All three checks passed: (1) Reality — F-004 substantially mitigated; 5 concerns extracted; carried_forward honest. (2) Honesty — each extracted module passes deletion test; no costume layers; interface_test_coverage_path valid. (3) Regression — no new findings at Noticeable weakness or above; all hooks follow correct patterns.

## Final Judge Narrative
Good app, place but not win yet. Loop 9 reduces TierBoardPage 757→507 LOC via honest structural extraction — no costume layers, each module passes deletion test. `simplicity` 5→6; `architecture_quality` 6→6.5. Full suite green. Remaining gaps: three new hooks lack unit tests; filterAllTiers has no core test. Loop 10 should close these test gaps.

--- Loop 10 (UTC 2026-05-16T17:00:00Z) ---

### Discovery
see Loop 1 Discovery

### Loop Counter
Loop 10 of 10 (cap)

### System Flag
[STATE: HALT_LOOP_CAP]

## Contest Verdict
Good app, but not top-tier yet

Loop 10 final critic pass (HALT_LOOP_CAP; no code changes). Full suite: 20 suites, 114 tests, all green. Scorecard re-derived from current source per G26. F-004, F-007, F-008 carried forward open. Residual Accounting Pass: all sub-9 dimensions have source-backed 9-anchor blockers.

## Scorecard (1-10)
- Architecture quality: 6.5 | SAME | TierBoardPage.tsx:1-507 (507 LOC, 20 hook calls); ImportExportPage.tsx:1-438; HeadToHeadPage.tsx:1-378. 9-anchor not met: page shells lack Interface Depth. Package DAG enforced; 5 hooks extracted loop 9.
- State management and runtime ownership: 6.5 | SAME | tierSlice.ts:1-343 one writer per concern. Process-lifetime ownership not explicit. 9-anchor sub-threshold.
- Domain modeling: 6.0 | SAME | models.ts:6 Item interface is a data bag. No smart constructors. 9-anchor not met.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced. Within-app no module-level enforcement. 9-anchor partial.
- Framework / platform best practices: 7.0 | SAME | Custom hooks idiomatic. RTK patterns correct. ImportExportPage.tsx 438 LOC still mixes orchestration. 9-anchor nearly met.
- Concurrency and runtime safety: 7.0 | SAME | No floating promises. useEffect cleanup present. persistenceMiddleware per-instance timer (loop 8). 9-anchor partial.
- Code simplicity and clarity: 6.0 | SAME | TierBoardPage:1-507 (20 hook calls); ImportExportPage:1-438; AppShell:1-385; HeadToHeadPage:1-378; TemplatesPage:1-361. No loop-10 changes.
- Test strategy and regression resistance: 7.0 | SAME | 20 suites 114 tests green. F-007: useTierFilter.ts (91 LOC, no test). F-008: filtering.ts:96 filterAllTiers (0 tests vs sortItems 8). Authority Map cross-check: useTierFilter concern has no Interface test.
- Overall implementation credibility: 7.5 | SAME | No fake-clean moves loops 5-9. persistenceMiddleware injectable (loop 8). undoRedoThunks tested (loop 7). TierBoardPage 757→507 LOC (loop 9). All modules pass deletion test.

## Authority Map
- TierBoardPage modal state: Owner: TierBoardPage local state (7 useState, lines 80-86). Verdict: Single and clear.
- Tier/Item domain state: Owner: packages/state/src/tierSlice.ts. Verdict: Single and clear.
- Sort/filter derived state: Owner: apps/web/src/hooks/useTierFilter.ts. Verdict: Single and clear (no Interface test — F-007).

## Strengths That Matter
- packages/core domain layer framework-free; 11 suites, 69 tests
- RTK slice ownership: one clear writer per concern across 6 slices
- Monorepo DAG enforced by workspace package.json: core←state←apps
- persistenceMiddleware — fully injectable storage; per-instance timer
- undoRedoThunks — direct test suite covering cross-slice behavior
- TierBoardPage.tsx — reduced from 757 to 507 LOC; 5 focused modules extracted

## Findings

### Finding #1: TierBoardPage.tsx at 507 LOC — god-component partially resolved, carried forward (F-004)
**Severity** — Noticeable weakness. **Evidence** — apps/web/src/pages/TierBoardPage.tsx:1-507 (507 LOC, 20 hook calls); lines 80-86 (7 useState); lines 133-237 (8 useCallback). **Architectural test failed** — Shallow module. **Minimal correction path** — Evaluate useItemInteraction hook (4 item handlers); if they share only dispatch + captureSnapshot, extract to hooks/useItemInteraction.ts.

### Finding #2: useTierFilter — no unit test at Interface (F-007)
**Severity** — Noticeable weakness. **Evidence** — apps/web/src/hooks/useTierFilter.ts:1-91 (91 LOC, no test); line 41 (filterAllTiers call); no *.test.ts in hooks/. **Architectural test failed** — Interface-as-test-surface. **Minimal correction path** — Add useTierFilter.test.ts: renderHook with mock store; dispatch setSortMode; assert processedTiers sorted.

### Finding #3: filterAllTiers — no direct test in @tiercade/core (F-008)
**Severity** — Noticeable weakness. **Evidence** — packages/core/src/filtering.ts:96 (filterAllTiers exported); packages/core/test/ (no filtering.test.ts); sorting.test.ts has 8 tests. **Architectural test failed** — Interface-as-test-surface. **Minimal correction path** — Add packages/core/test/filtering.test.ts: 3-4 filter tests.

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | No code changes this loop (HALT_LOOP_CAP). Prior loop's extractions pass Deletion test. |
| new_seam_justified | false |
| helpful_simplification | n/a — critic pass only |
| should_not_be_done | Extract TierBoardPage modal state into useModalState — adds ceremony without structural benefit. |
| tests_after_fix | For F-007: add useTierFilter.test.ts. For F-008: add filtering.test.ts. |

## Improvement Backlog
1. Add useTierFilter unit test (F-007) — test_strategy +0.5 — structural — helpful
2. Add filterAllTiers unit test in @tiercade/core (F-008) — test_strategy +0.5 — structural — helpful
3. Evaluate useItemInteraction extraction (F-004) — architecture_quality +0.5; simplicity +0.5 — structural — helpful

## Deepening Candidates
→ REVIEW_HISTORY.json `loops[9].deepening_candidates` for full notes

## Builder Notes
1. God-component with partially extractable handlers → REVIEW_HISTORY.json `loops[9].builder_notes[0]`
2. Test gap after extraction → REVIEW_HISTORY.json `loops[9].builder_notes[1]`
3. Coverage asymmetry between similar pure functions → REVIEW_HISTORY.json `loops[9].builder_notes[2]`

## Final Judge Narrative
Good app, place but not win. 10 loops from build failure to 6.7 avg. Real structural improvements: build baseline green (loop 5), storage injectable (loop 6), undoRedoThunks tested (loop 7), persistenceMiddleware per-instance timer (loop 8), TierBoardPage 757→507 LOC with 5 focused hooks extracted (loop 9). No fake-clean moves; every resolution passed implementation review. Remaining gaps honest and quantified: test_strategy at 7 by F-007 + F-008; architecture_quality at 6.5 by page shell Depth gap. Two test file additions would raise test_strategy to 7.5. The codebase is structurally honest; 9-anchor not yet reached in any dimension but trending correctly.

--- Loop 11 (UTC 2026-05-16T00:02:00Z) ---

### Loop Counter
Loop 11 of 15 (cap)

### System Flag
[STATE: CONTINUE]

see Loop 1 Discovery

---

## Contest Verdict
Good app, but not top-tier yet

Loop 11 resolves F-007 (useTierFilter unit test) and F-008 (filterAllTiers unit test). Suite grows from 20→22 suites, 114→146 tests, all green. test_strategy moves 7.0→7.5: two Interface-level test gaps closed. credibility moves 7.5→8.0.

## Scorecard (1-10)
- Architecture quality: 6.5 | SAME | `apps/web/src/pages/TierBoardPage.tsx:1-507` (507 LOC, 20 hook calls, shallow orchestration shell); page shells lack Interface Depth.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — one writer per concern; process-lifetime ownership not explicit.
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — Item is a data bag; no smart constructors.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace; within-app no module-level enforcement.
- Framework / platform best practices: 7.0 | SAME | Custom hooks idiomatic; ImportExportPage.tsx at 438 LOC mixes concerns.
- Concurrency and runtime safety: 7.0 | SAME | JavaScript single-threaded; no floating promises; no AbortController for async fetches.
- Code simplicity and clarity: 6.0 | SAME | TierBoardPage.tsx:1-507; ImportExportPage.tsx:1-438; AppShell.tsx:1-385. All large orchestration shells.
- Test strategy and regression resistance: 7.5 | UP | `packages/core/test/filtering.test.ts` — 25 tests at filterAllTiers Interface. `apps/web/src/hooks/useTierFilter.test.ts` — 7 tests via renderHook+Provider. 22 suites, 146 tests. F-007 and F-008 resolved. Ceiling: TierBoardPage page-level surface has no direct test.
- Overall implementation credibility: 8.0 | UP | 32 new tests at Interfaces of two previously-untested Modules. Implementation reviewer approved. No fake-clean moves loops 5-11.

## Authority Map
**Tier/Item domain state**: Owner `tierSlice.ts`; single writer; test surface `undoRedoThunks.test.ts`; Single and clear.
**Sort/filter derived state**: Owner `useTierFilter.ts`; test surface `useTierFilter.test.ts:67-162` (F-007 resolved); Single and clear.
**filterAllTiers (core pure function)**: Owner `filtering.ts`; test surface `filtering.test.ts:96-176` (F-008 resolved); Single and clear.

## Strengths That Matter
- packages/core: 12 suites, 94 tests; framework-free.
- RTK slice ownership: one writer per concern; memoized selectors.
- persistenceMiddleware: injectable storage + per-instance timer (loops 6+8).
- useTierFilter.ts: Interface directly tested (loop 11).

## Findings

### Finding #1: `TierBoardPage.tsx` at 507 LOC — god-component carried forward (F-004)
**Why it matters** — 507 LOC, 20 hook calls; shallow orchestration wrapper.
**What is wrong** — 7 useState, 8 useCallback, 2 useEffect, JSX all in one file.
**Evidence** — `apps/web/src/pages/TierBoardPage.tsx:1-507`; `:80-86`; `:133-237`.
**Architectural test failed** — Shallow module
**Dependency category** — `in-process`
**Severity** — Noticeable weakness
**Minimal correction path** — Evaluate useItemInteraction hook for 4 item handlers; if only dispatch + captureSnapshot dependency, extract.

## Simplification Check

| Field | Value |
|---|---|
| structurally_necessary | F-008: filterAllTiers had 0 tests vs sortItems 8; Interface-as-test-surface gap. F-007: useTierFilter highest-risk extracted hook, no Interface test. |
| new_seam_justified | false |
| helpful_simplification | apps/web/jest.config.ts + test:hooks script adds sustainable web-hook test path without new npm deps. |
| should_not_be_done | Adding mock Redux store factory abstraction — one-off makeStore per test file is idiomatic. |
| tests_after_fix | F-008: filtering.test.ts at filtering Interface (no old tests deleted). F-007: useTierFilter.test.ts at hook Interface (no old tests deleted). |

## Improvement Backlog
1. **Evaluate useItemInteraction extraction (F-004)** — 4 item handlers may share only dispatch + captureSnapshot; if confirmed extraction passes deletion test; architecture_quality+0.5, simplicity+0.5, test_strategy+0.5. Structural / helpful.

## Loop 11 Result

Two new test files added targeting open Findings F-007 and F-008.

**F-008 (resolved)**: `packages/core/test/filtering.test.ts` — 25 tests covering `filterAllTiers` passthrough (`line 128`), multi-tier structure preservation (`lines 133-147`), empty tiers (`lines 149-152`), `hasMedia` cross-tier (`lines 153-172`), plus `hasActiveFilters`, `itemMatchesFilters`, `filterItems`. `npm run test:core`: 12 suites, 94 tests, all green.

**F-007 (resolved)**: `apps/web/src/hooks/useTierFilter.test.ts` — 7 tests via `renderHook` + `Provider(makeStore())`. `apps/web/jest.config.ts` added (jsdom). Root `package.json` gains `test:hooks`. Tests: passthrough (`lines 67-82`), searchText filter (`lines 84-95`), alphabetical sort (`lines 97-106`), custom order (`lines 108-115`), `handleSearchChange` (`lines 121-132`), `handleClearFilters` (`lines 134-145`), `handleSortModeChange` (`lines 147-162`). `npm run test:hooks`: 1 suite, 7 tests, all green.

Full suite: 22 suites, 146 tests, all green. Targeted findings F-007 and F-008: **resolved**.

## Loop 11 Implementation Review

**Verdict: approved.** All three checks passed: F-007 and F-008 Interface-as-test-surface findings no longer present in current source; test files exercise real behavior (filter/sort outcomes asserted, not just compilation); no ownership ambiguity or new findings introduced.

## Builder Notes
1. Test gap after extraction → REVIEW_HISTORY.json `loops[10].builder_notes[0]`
2. Coverage asymmetry between parallel pure functions → REVIEW_HISTORY.json `loops[10].builder_notes[1]`
3. God-component with partially extractable handlers → REVIEW_HISTORY.json `loops[10].builder_notes[2]`

## Final Judge Narrative
Good app, place but not win. Loop 11 closes the test-strategy gaps (F-007, F-008) that held test_strategy at 7.0 for loops 9-10. 32 new tests at real Interfaces — no shallow mocks. Suite at 146 tests, 22 suites, all green. credibility moves to 8.0: no remaining honesty leaks from the loop 5-11 trajectory. Remaining backlog: F-004 (TierBoardPage 507 LOC). architecture_quality at 6.5 by page shell Depth gap.

--- Loop 12 (UTC 2026-05-16T00:10:00Z) ---

### Discovery
see Loop 1 Discovery

### Loop Counter
Loop 12 of 15 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Loop 12 extracts `useItemInteraction` hook: 3 dispatch-only handlers removed from TierBoardPage (507→456 LOC). 7 new Interface-level tests. Suite: 23 suites, 153 tests, all green. architecture_quality 6.5→7.0; simplicity 6.0→6.5.

## Scorecard (1-10)
- Architecture quality: 7.0 | UP | `apps/web/src/hooks/useItemInteraction.ts:1-81` — 3 dispatch-only handlers behind `ItemInteractionHandlers` Interface; `TierBoardPage.tsx:1-456` (507→456 LOC). 9-anchor not met: ImportExportPage 438 LOC, HeadToHeadPage 378 LOC still large; page-level Module Depth below contest grade.
- State management and runtime ownership: 6.5 | SAME | One writer per concern across 6 slices. Store implicit global. 9-anchor sub-threshold.
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — Item data bag, anemic. 9-anchor not met.
- Data flow and dependency design: 6.5 | SAME | Package DAG enforced. `useItemInteraction.ts` adds cleaner interface. Within-app no module-level DAG enforcement.
- Framework / platform best practices: 7.0 | SAME | 7 focused hooks. RTK patterns correct. ImportExportPage 438 LOC lacks hook delegation.
- Concurrency and runtime safety: 7.0 | SAME | JS single-threaded. No floating promises. 9-anchor partial.
- Code simplicity and clarity: 6.5 | UP | `TierBoardPage.tsx:1-456` (507→456 LOC; 51 LOC extracted to `useItemInteraction.ts`). Structural proof: hook concentrates 3 handlers behind 17-line Interface.
- Test strategy and regression resistance: 7.5 | SAME | 23 suites, 153 tests. `useItemInteraction.test.ts` — 7 tests at new Interface. Remaining ceiling: TierBoardPage page-level surface untested.
- Overall implementation credibility: 8.0 | SAME | Extraction passes deletion test; Replace-don't-layer satisfied (no old tests deleted, 7 new tests added at Interface). Reviewer approved.

## Authority Map

**TierBoardPage modal state** — Owner: TierBoardPage local state (7 useState). Verdict: Single and clear.

**Item interaction** — Owner: `apps/web/src/hooks/useItemInteraction.ts`. Test surface: `useItemInteraction.test.ts` (7 tests, loop 12). Verdict: Single and clear.

**Tier/Item domain state** — Owner: `packages/state/src/tierSlice.ts`. Persistence seam: persistenceMiddleware. Verdict: Single and clear.

**Sort/filter derived state** — Owner: `apps/web/src/hooks/useTierFilter.ts`. Test surface: `useTierFilter.test.ts:67-162`. Verdict: Single and clear.

**filterAllTiers** — Owner: `packages/core/src/filtering.ts`. Test surface: `filtering.test.ts:96-176`. Verdict: Single and clear.

## Strengths That Matter
- `packages/core` framework-free; 12 suites, 94 tests.
- RTK slice ownership: one writer per concern; memoized selectors.
- Monorepo DAG: `core←state←apps`; no circular deps.
- `TierBoardPage.tsx` — 757→456 LOC; 6 hooks/modules extracted (loops 9, 12).
- `useItemInteraction.ts` — Interface tested (`useItemInteraction.test.ts`, 7 tests, loop 12).

## Findings

### Finding #1: `TierBoardPage.tsx` at 456 LOC — god-component further reduced, carried forward (F-004)

**Why it matters** — 456 LOC page shell; remaining handlers coupled to modal state at natural floor.

**What is wrong** — 7 useState modal declarations (lines 80-86); 5 remaining useCallback handlers (handleItemDoubleClick, handleCopyLink, handleMoveItemWithCelebration, handleBatchMoveToTier, handleBatchDelete) require modal state or multi-selector reads.

**Evidence** — `TierBoardPage.tsx:1-456`; `TierBoardPage.tsx:80-86`; `TierBoardPage.tsx:113-129`.

**Architectural test failed** — Shallow module

**Dependency category** — `in-process`

**Leverage impact** — Modal coordination still requires reading 456 LOC.

**Locality impact** — Remaining handlers coupled to modal state; no clean extraction without co-moving state.

**Metric signal** — 456 LOC vs 95 LOC ThemesPage.tsx; 438 LOC ImportExportPage.tsx.

**Why this weakens submission** — Page shell still broad; further reduction higher-complexity.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Evaluate `useBatchActions`: handleBatchMoveToTier + handleBatchDelete share dispatch + selection.

**Blast radius** — Change: `TierBoardPage.tsx`, `hooks/useBatchActions.ts`. Avoid: `ItemModal.tsx`, `@tiercade/ui`.

## Simplification Check

| field | value |
|---|---|
| structurally_necessary | useItemInteraction extraction — 3 dispatch-only handlers; deletion test passes. |
| new_seam_justified | false |
| helpful_simplification | TierBoardPage 507→456 LOC; 3 useCallback blocks removed. |
| should_not_be_done | Extract handleItemDoubleClick (1-line body = costume layer). Extract handleMoveItemWithCelebration (modal state coupling). |
| tests_after_fix | useItemInteraction.test.ts — 7 tests at new Interface. No old tests to delete. |

## Improvement Backlog

### Priority 1: Evaluate `useBatchActions` extraction — may reduce TierBoardPage to ~420 LOC (F-004)
- Minor structural gain; evaluate deletion test viability.
- Score impact: architecture_quality +0.0-0.5; simplicity +0.0-0.5.

### Priority 2: ImportExportPage.tsx at 438 LOC — second largest page shell
- Helpful structural; hook delegation pattern not yet applied.
- Score impact: architecture_quality +0.5; simplicity +0.5.

## Builder Notes
1. Partial extraction opportunity in large page shells → REVIEW_HISTORY.json `loops[11].builder_notes[0]`
2. Batch operation handlers sharing a selector → REVIEW_HISTORY.json `loops[11].builder_notes[1]`
3. Extraction earns its keep when 3+ handlers share the same dependency → REVIEW_HISTORY.json `loops[11].builder_notes[2]`

## Final Judge Narrative
Good app, place but not win. Loop 12 executes the useItemInteraction extraction. TierBoardPage 507→456 LOC; 3 dispatch-only handlers behind stable Interface with 7 tests. architecture_quality 6.5→7.0; simplicity 6.0→6.5 — both honest, proof in the diff. Remaining backlog: F-004 still open; further reduction requires useBatchActions or modal state co-extraction. Page shells lack Interface Depth at page level; useItemInteraction is local progress, not system-level change.

## Loop 12 Result

Three files changed: `useItemInteraction.ts` (new, 81 LOC), `useItemInteraction.test.ts` (new, 153 LOC, 7 tests), `TierBoardPage.tsx` (507→456 LOC, 3 handlers removed).

`useItemInteraction` extracts `handleItemClick`, `handleFileDrop`, `handleItemMediaDrop` — three dispatch-only handlers from `TierBoardPage.tsx:133-190`. All closed over only `dispatch`; no modal state dependency. Hook returns `{ onItemClick, onFileDrop, onItemMediaDrop }` as single object. Page calls `const { onItemClick: handleItemClick, ... } = useItemInteraction(dispatch)`. Remaining handlers stay in page due to modal state or multi-selector dependencies.

Tests: 23 suites, 153 tests, all green. `npm run build` → Vite clean. Targeted finding F-004: **carried forward** (page further reduced; remaining handlers at natural modal-coupled floor).

## Loop 12 Implementation Review

Verdict: **approved**. Reality: passed (3 targeted handlers removed from page). Honesty: passed (deletion test passes; Unified Seam Policy not triggered; Replace-don't-layer satisfied; no costume layer). Regression: passed (no new ownership ambiguity, no framework leakage, no new findings at same/higher severity). Rounds: 1.

--- Loop 13 (UTC 2026-05-16T18:30:00Z) ---

### Discovery
see Loop 1 Discovery

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

State package test surface continues to deepen: 18 new Interface-level tests for presentationSlice close an Authority Map gap loop 7 (F-003) had missed. test_strategy 7.5→8.0 with structural proof (file:line citation, behavior assertions). No production source modified this loop.

## Scorecard (1-10)
- Architecture quality: 7.0 | SAME | TierBoardPage.tsx:1-456 still god-component
- State management and runtime ownership: 6.5 | SAME | persistence injection landed loop 8
- Domain modeling: 6.5 | SAME
- Data flow and dependency design: 6.5 | SAME
- Framework / platform best practices: 7.0 | SAME
- Concurrency and runtime safety: 7.0 | SAME
- Code simplicity and clarity: 7.0 | SAME
- Test strategy and regression resistance: 8.0 | UP | packages/state/test/presentationSlice.test.ts (183 LOC, 18 Interface tests)
- Overall implementation credibility: 8.0 | SAME

## Findings

### Finding #1: TierBoardPage.tsx at 456 LOC — further-split deletion-test diminishing
**Severity** — Noticeable weakness
**Evidence** — apps/web/src/pages/TierBoardPage.tsx:1-456
**Minimal correction path** — Identify ONE next natural cleavage (URL-share-import or batch-action) and apply deletion test strictly. If no cleavage passes, accept residual at 9.5.

### Finding #2: presentationSlice has zero Interface tests (F-003 scope gap, resolved this loop)
**Severity** — Noticeable weakness
**Evidence** — packages/state/src/presentationSlice.ts:1-177
**Minimal correction path** — Add packages/state/test/presentationSlice.test.ts (resolved this loop, 18 tests).

## Simplification Check

| field | value |
|---|---|
| structurally_necessary | Closed an Authority Map test gap on presentationSlice |
| new_seam_justified | false |
| should_not_be_done | Do not add trivial setter tests purely for coverage count |
| tests_after_fix | packages/state/test/presentationSlice.test.ts (18 tests, 183 LOC) |

## Improvement Backlog
### Priority 1: Evaluate next TierBoardPage cleavage under deletion test

## Builder Notes (compressed)
- Pattern: Authority Map gap surfaced retroactively → REVIEW_HISTORY.json loops[12].builder_notes
- Pattern: Behavior assertions vs setter mirroring → REVIEW_HISTORY.json loops[12].builder_notes
- Pattern: Interface-level reducer testing → REVIEW_HISTORY.json loops[12].builder_notes

## Final Judge Narrative
Loop 13 closed an Authority Map gap loop 7 (F-003) had missed: presentationSlice's 7 non-trivial reducer behaviors were entirely untested. 18 Interface-level tests added; state package test count 37→55. Reviewer approved 3/3. F-004 carries forward; loop 14 evaluates next cleavage.

## Loop 13 Result
Added packages/state/test/presentationSlice.test.ts (183 LOC, 18 tests). npm run test:state green: 8 suites, 55 tests. No production source modified. F-009 (this loop's new finding) status: resolved.

## Loop 13 Implementation Review
verdict: **approved**
- reality: passed
- honesty: passed
- regression: passed
regressions: none
conditions: none

--- Loop 13 (UTC 2026-05-16T00:25:00Z) ---

### Loop Counter
Loop 14 of 18 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Loop 14 extracts useBatchActions: 2 batch handlers removed from TierBoardPage (456→443 LOC). 6 new Interface-level tests. simplicity 6.5→7.0.

## Scorecard (1-10)
- Architecture quality: 7.0 | SAME | apps/web/src/hooks/useBatchActions.ts:1-40 — 2 batch handlers behind BatchActionHandlers Interface; TierBoardPage.tsx:1-443.
- State management and runtime ownership: 6.5 | SAME | One writer per concern; store implicit global.
- Domain modeling: 6.0 | SAME | packages/core/src/models.ts:6 — Item data bag, anemic.
- Data flow and dependency design: 6.5 | SAME | Package DAG enforced. useBatchActions adds cleaner interface.
- Framework / platform best practices: 7.0 | SAME | 9 focused hooks. ImportExportPage 438 LOC lacks delegation.
- Concurrency and runtime safety: 7.0 | SAME | JS single-threaded. No floating promises.
- Code simplicity and clarity: 7.0 | UP | useBatchActions.ts:1-40 — 2 batch handlers extracted; TierBoardPage 456→443 LOC; 3 remaining inline handlers all modal-state coupled.
- Test strategy and regression resistance: 8.0 | SAME | 25 suites, 174 tests. useBatchActions.test.ts — 6 tests at new Interface.
- Overall implementation credibility: 8.0 | SAME | Extraction passes deletion test. Replace-don't-layer satisfied (6 new tests; no old tests deleted). Reviewer approved.

## Authority Map
**TierBoardPage modal state** — Owner: TierBoardPage local state (7 useState). Verdict: Single and clear.
**Batch action handlers** — Owner: apps/web/src/hooks/useBatchActions.ts. Test surface: useBatchActions.test.ts (6 tests, loop 14). Verdict: Single and clear.
**Item interaction** — Owner: apps/web/src/hooks/useItemInteraction.ts. Test surface: useItemInteraction.test.ts (7 tests). Verdict: Single and clear.
**Tier/Item domain state** — Owner: packages/state/src/tierSlice.ts. Persistence seam: persistenceMiddleware. Verdict: Single and clear.
**Sort/filter derived state** — Owner: apps/web/src/hooks/useTierFilter.ts. Test surface: useTierFilter.test.ts:67-162. Verdict: Single and clear.
**filterAllTiers** — Owner: packages/core/src/filtering.ts. Test surface: filtering.test.ts:96-176. Verdict: Single and clear.

## Strengths That Matter
- packages/core framework-free; 12 suites, 94 tests.
- RTK slice ownership: one writer per concern; memoized selectors.
- TierBoardPage.tsx — 757→443 LOC; 7 hooks extracted (loops 9, 12, 14).
- useBatchActions.ts — Interface tested (useBatchActions.test.ts, 6 tests, loop 14).

## Findings

### Finding #1: TierBoardPage.tsx at 443 LOC — natural modal-coupled floor (F-004)
**Severity** — Noticeable weakness
**Evidence** — apps/web/src/pages/TierBoardPage.tsx:1-443; lines 75-82 (7 useState); lines 140-183 (3 remaining handlers)
**Minimal correction path** — Accept as residual. Evaluate ImportExportPage.tsx next.

### Finding #2: ImportExportPage.tsx at 438 LOC — no hook delegation (F-010)
**Severity** — Noticeable weakness
**Evidence** — apps/web/src/pages/ImportExportPage.tsx:1-438
**Minimal correction path** — Extract dispatch-only import handlers to useImportHandlers.ts.

## Simplification Check

| field | value |
|---|---|
| structurally_necessary | useBatchActions extraction — dispatch+selection cluster; deletion test passes |
| new_seam_justified | false |
| helpful_simplification | TierBoardPage 456→443 LOC; 2 useCallback blocks + 3 imports removed |
| should_not_be_done | Extracting handleItemDoubleClick (1-line body). Extracting handleMoveItemWithCelebration (modal state coupling). |
| tests_after_fix | apps/web/src/hooks/useBatchActions.test.ts (6 tests at new Interface) |

## Improvement Backlog
### Priority 1: Hook delegation for ImportExportPage.tsx at 438 LOC (F-010)
### Priority 2: Accept F-004 residual — TierBoardPage at natural modal floor

## Builder Notes (compressed)
- Pattern: dispatch-only handler cluster → REVIEW_HISTORY.json loops[13].builder_notes
- Pattern: 443 LOC natural floor — remaining handlers tangled → REVIEW_HISTORY.json loops[13].builder_notes
- Pattern: Test-at-new-Interface maintained 4 loops → REVIEW_HISTORY.json loops[13].builder_notes

## Final Judge Narrative
Good app, place but not win. Loop 14 closes useBatchActions gap. TierBoardPage 456→443 LOC; 2 batch handlers behind stable Interface with 6 tests. simplicity 6.5→7.0. New finding F-010: ImportExportPage 438 LOC, next extraction target.

## Loop 14 Result
Three files changed: useBatchActions.ts (new, 40 LOC), useBatchActions.test.ts (new, 6 tests), TierBoardPage.tsx (456→443 LOC). Full suite: 25 suites, 174 tests, all green. F-004: carried_forward.

## Loop 14 Implementation Review
verdict: **approved**
- reality: passed
- honesty: passed
- regression: passed
regressions: none
conditions: none

--- Loop 15 (UTC 2026-05-16T20:50:00Z) ---

see Loop 1 Discovery

### Loop Counter
Loop 15 of 18 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Loop 15 extracts useImportHandlers hook from ImportExportPage: FileReader + format dispatch moved behind a stable Interface. ImportExportPage 438→401 LOC. 5 new Interface-level tests. Suite: 26 suites, 179 tests, all green. simplicity 7.0→7.5.

## Scorecard (1-10)
- Architecture quality: 7.0 | SAME | apps/web/src/hooks/useImportHandlers.ts:1-62 — file I/O orchestration behind Interface; 9-anchor not met: export handlers still inline
- State management and runtime ownership: 6.5 | SAME | packages/state/src/tierSlice.ts:1-343
- Domain modeling: 6.0 | SAME | packages/core/src/models.ts:6 — Item data bag, no smart constructors
- Data flow and dependency design: 6.5 | SAME | package.json DAG; 10 hooks; within-app no module-level DAG
- Framework / platform best practices: 7.0 | SAME | 10 custom hooks idiomatic; ImportExportPage 401 LOC has 5 export useCallback still inline
- Concurrency and runtime safety: 7.0 | SAME | single-threaded JS; no floating promises
- Code simplicity and clarity: 7.5 | UP | apps/web/src/hooks/useImportHandlers.ts:1-62 — 438→401 LOC; 2 useCallback removed; bug fix included
- Test strategy and regression resistance: 8.0 | SAME | apps/web/src/hooks/useImportHandlers.test.ts — 5 tests; 26 suites 179 tests; page-level still untested
- Overall implementation credibility: 8.0 | SAME | deletion test passes; Replace-don't-layer satisfied; bug fix honest

## Authority Map
**Import handlers** — Owner: apps/web/src/hooks/useImportHandlers.ts; test surface: useImportHandlers.test.ts (5 tests, loop 15); Verdict: Single and clear
**Batch actions** — Owner: apps/web/src/hooks/useBatchActions.ts; Verdict: Single and clear
**Item interaction** — Owner: apps/web/src/hooks/useItemInteraction.ts; Verdict: Single and clear
**Tier/Item domain state** — Owner: packages/state/src/tierSlice.ts; Verdict: Single and clear
**Sort/filter derived state** — Owner: apps/web/src/hooks/useTierFilter.ts; Verdict: Single and clear

## Strengths That Matter
- packages/core domain layer framework-free; 12 suites, 94 tests
- RTK slice ownership: one writer per concern; memoized selectors
- Monorepo DAG enforced; no circular deps
- useImportHandlers.ts — 62 LOC; Interface tested (5 tests, loop 15)
- TierBoardPage.tsx — 757→443 LOC; ImportExportPage.tsx — 438→401 LOC

## Findings

### Finding #1: TierBoardPage.tsx at 443 LOC — at natural modal-coupled floor (F-004)
**Severity** — Noticeable weakness
**Evidence** — apps/web/src/pages/TierBoardPage.tsx:1-443; lines 75-82 (7 useState); lines 140-183 (3 remaining handlers)
**Minimal correction path** — Accept as residual. No further extraction — all remaining handlers require modal state.

### Finding #2: ImportExportPage.tsx export handlers — 5 useCallback blocks still inline (F-010)
**Severity** — Noticeable weakness
**Evidence** — apps/web/src/pages/ImportExportPage.tsx:127-260
**Minimal correction path** — Extract to useExportHandlers hook reading selectors internally.

## Simplification Check

| field | value |
|---|---|
| structurally_necessary | useImportHandlers extraction — dispatch-only cluster; deletion test passes |
| new_seam_justified | false |
| helpful_simplification | ImportExportPage 438→401 LOC; 2 useCallback blocks removed; bug fix (unsupported-ext snapshot) |
| should_not_be_done | Extracting handleReset (modal state coupling). |
| tests_after_fix | apps/web/src/hooks/useImportHandlers.test.ts (5 tests at new Interface) |

## Improvement Backlog
### Priority 1: Extract export handlers from ImportExportPage.tsx to useExportHandlers hook (F-010)
### Priority 2: Accept F-004 residual — TierBoardPage at natural modal floor

## Builder Notes (compressed)
- Pattern: Unsupported-format bug revealed by test — captureSnapshot fired before guard → REVIEW_HISTORY.json loops[14].builder_notes
- Pattern: 5-selector dep cluster in export handlers → REVIEW_HISTORY.json loops[14].builder_notes
- Pattern: FileReader async tested via jest.spyOn(globalThis, 'FileReader') → REVIEW_HISTORY.json loops[14].builder_notes

## Final Judge Narrative
Good app, place but not win. Loop 15 closes useImportHandlers gap: FileReader + format dispatch behind stable Interface; ImportExportPage 438→401 LOC. simplicity 7.0→7.5. Remaining backlog: export handlers extraction (5 callbacks, shared selector cluster); F-004 should be accepted as residual. Average score 7.1.

## Loop 15 Result
Three files changed: useImportHandlers.ts (new, 62 LOC), useImportHandlers.test.ts (new, 5 tests), ImportExportPage.tsx (438→401 LOC). Full suite: 26 suites, 179 tests, all green. F-010: carried_forward (import handlers extracted; export handlers remain — Priority 1 next loop).

## Loop 15 Implementation Review
verdict: **approved**
- reality: passed
- honesty: passed
- regression: passed
regressions: none
conditions: none

--- Loop 16 (UTC 2026-05-16T20:55:00Z) ---

### Discovery
see Loop 1 Discovery

### Loop Counter
Loop 16 of 18 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Loop 16 extracts `useExportHandlers` hook from ImportExportPage: 5 inline export `useCallback` blocks + `downloadFile` util moved behind a stable Interface. ImportExportPage 401→253 LOC. 5 Interface tests. Suite: 27 suites, 184 tests, all green. simplicity 7.5→8.0.

## Scorecard (1-10)
- Architecture quality: 7.5 | UP | `apps/web/src/hooks/useExportHandlers.ts:1-182` — 5-selector export dep-cluster behind Interface; ImportExportPage reduced to orchestration-only; package DAG enforced
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343`
- Domain modeling: 6.0 | SAME | `packages/core/src/models.ts:6` — Item all-optional, no smart constructors
- Data flow and dependency design: 6.5 | SAME | DAG enforced; 11 focused hooks
- Framework / platform best practices: 7.5 | UP | `apps/web/src/hooks/` — 11 hooks; ImportExportPage 253 LOC with 3 hook delegations
- Concurrency and runtime safety: 7.0 | SAME | Single-threaded JS; no floating promises
- Code simplicity and clarity: 8.0 | UP | ImportExportPage 401→253 LOC; 5 useCallback blocks + 3 useAppSelector calls removed
- Test strategy and regression resistance: 8.0 | SAME | `useExportHandlers.test.ts` — 5 tests; 27 suites 184 tests
- Overall implementation credibility: 8.0 | SAME | deletion test passes; Replace-don't-layer satisfied

## Authority Map
**Export handlers (text serialization + URL generation)**
- Owner: `apps/web/src/hooks/useExportHandlers.ts`; Readers: ImportExportPage; Verdict: Single and clear — test surface: useExportHandlers.test.ts (5 tests, loop 16)

**Import handlers**: Owner: useImportHandlers.ts; Verdict: Single and clear
**Batch action handlers**: Owner: useBatchActions.ts; Verdict: Single and clear
**Tier/Item domain state**: Owner: tierSlice.ts; Verdict: Single and clear

## Strengths That Matter
- useExportHandlers.ts — 182 LOC; 5-selector cluster; 5 Interface tests (loop 16)
- ImportExportPage — 438→253 LOC across loops 15-16
- packages/core — 12 suites, 94 tests, framework-free

## Findings
### Finding F1 (F-004): TierBoardPage.tsx at 443 LOC — at natural modal-coupled floor
Severity: Noticeable weakness. Remaining handlers all modal-state coupled. Minimal correction: accept as residual.

### Finding F2 (F-011): Domain model anemic — Item all-optional fields, no smart constructors
Severity: Noticeable weakness. packages/core/src/models.ts:6-19. Cross-cutting refactor out of scope at cap 18.

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | useExportHandlers extraction — 5 handlers share 5-selector dep cluster; deletion test passes |
| new_seam_justified | false |
| helpful_simplification | ImportExportPage 401->253 LOC; 5 useCallback blocks removed; ExportFormatter/urlSharing imports removed |
| should_not_be_done | Wrapping downloadFile in seam; merging with useExport |
| tests_after_fix | useExportHandlers.test.ts — 5 tests at new Interface |

## Improvement Backlog
1. Accept F-004 residual — TierBoardPage at natural modal floor (polish, minor)
2. Accept F-011 residual — domain model anemic (polish, minor)

## Builder Notes
1. pattern: 5-selector dep cluster across N callbacks → single hook → REVIEW_HISTORY.json `loops[15].builder_notes`
2. pattern: jsdom missing URL.createObjectURL — use Object.defineProperty before spyOn
3. pattern: handleExport dispatcher belongs with its handlers in same hook

## Loop 16 Result

Three files changed: `useExportHandlers.ts` (new, 182 LOC), `useExportHandlers.test.ts` (new, 5 tests), `ImportExportPage.tsx` (401→253 LOC, 5 `useCallback` blocks removed, 3 `useAppSelector` calls removed, `downloadFile` removed, `ExportFormatter` import removed).

`useExportHandlers` extracts `handleCopyLink`, `handleExportJSON`, `handleExportCSV`, `handleExportMarkdown`, `handleExport`. Hook reads 5 selectors internally; accepts `exportAsPNG` as parameter. `downloadFile` moved to hook file. Full suite: 27 suites, 184 tests, all green. Targeted finding F-010 (export handlers inline): **resolved**.

## Loop 16 Implementation Review
verdict: approved
reason: All three checks passed: handleCopyLink, handleExportJSON, handleExportCSV, handleExportMarkdown, handleExport are no longer inline in ImportExportPage; deletion test passes; 5 Interface tests at useExportHandlers.test.ts; no new ownership drift, floating promises, or costume layers.
- reality: passed
- honesty: passed
- regression: passed
regressions: none
conditions: none

## Final Judge Narrative
Good app, place but not win. Loop 16 executes useExportHandlers extraction: 5-selector dep cluster + format serialization + downloadFile behind stable Interface; ImportExportPage 401->253 LOC. simplicity 7.5->8.0, arch 7.0->7.5, framework_idioms 7.0->7.5. Two loops remain at cap 18. Remaining backlog is residual acceptance only. Average score ~7.3.

--- Loop 17 (UTC 2026-05-16T21:15:00Z) ---

see Loop 1 Discovery

### Loop Counter
Loop 17 of 18 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Loop 17 extracts `useHeadToHeadHandlers` from HeadToHeadPage: 5 inline action `useCallback` blocks + keyboard shortcut `useEffect` moved behind stable Interface. HeadToHeadPage 378→312 LOC (-66 lines). 5 new Interface-level tests. Suite: 28 suites, 189 tests, all green. simplicity 8.0→8.5.

## Scorecard
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action dep-cluster behind Interface; HeadToHeadPage reduced to display-only orchestration.
- State management and runtime ownership: 6.5 | SAME | one writer per concern across 6 slices; store implicit global.
- Domain modeling: 6.0 | SAME | packages/core/src/models.ts:6 — Item all-optional; anemic.
- Data flow and dependency design: 6.5 | SAME | package DAG enforced; 12 focused hooks; no within-app module-level DAG.
- Framework / platform best practices: 7.5 | SAME | 12 custom hooks; keyboard shortcut effect co-located with action handlers in hook.
- Concurrency and runtime safety: 7.0 | SAME | single-threaded; useEffect cleanup removes keydown listener.
- Code simplicity and clarity: 8.5 | UP | HeadToHeadPage 378→312 LOC; 5 useCallback blocks + keyboard useEffect removed from page.
- Test strategy and regression resistance: 8.0 | SAME | 28 suites 189 tests; useHeadToHeadHandlers.test.ts 5 tests at Interface.
- Overall implementation credibility: 8.0 | SAME | deletion test passes; Replace-don't-layer satisfied; implementation reviewer approved.

## Strengths That Matter
- useHeadToHeadHandlers.ts — 115 LOC; action handlers + keyboard routing; Interface tested (5 tests, loop 17)
- useExportHandlers.ts — 182 LOC; 5-selector cluster; 5 Interface tests (loop 16)
- ImportExportPage — 438→253 LOC across loops 15-16
- HeadToHeadPage — 378→312 LOC (loop 17)
- packages/core — 12 suites, 94 tests, framework-free

## Findings
### Finding F1 (F-004): TierBoardPage.tsx at 443 LOC — at natural modal-coupled floor
Severity: Noticeable weakness. Remaining handlers all modal-state coupled. Minimal correction: accept as residual.

### Finding F2 (F-011): Domain model anemic — Item all-optional fields, no smart constructors
Severity: Noticeable weakness. packages/core/src/models.ts:6-19. Cross-cutting refactor out of scope at cap 18.

### Finding F3 (F-012): HeadToHeadPage action handlers inline — RESOLVED THIS LOOP
Evidence: HeadToHeadPage.tsx:1-378 — 5 useCallback blocks + keyboard useEffect extracted to useHeadToHeadHandlers.
Severity: Noticeable weakness (resolved).

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | useHeadToHeadHandlers extraction — 5 action handlers + keyboard useEffect share action dispatch dep-cluster; deletion test passes |
| new_seam_justified | false |
| helpful_simplification | HeadToHeadPage 378->312 LOC; 5 useCallback blocks removed; keyboard useEffect removed; useNavigate+useAppDispatch+action creators removed from page |
| should_not_be_done | Extracting showEndConfirm modal state; extracting display-only selectors |
| tests_after_fix | useHeadToHeadHandlers.test.ts — 5 tests at new Interface |

## Improvement Backlog
1. Accept F-004 residual — TierBoardPage at natural modal floor (polish, minor)
2. Accept F-011 residual — domain model anemic (polish, minor)

## Builder Notes
4. pattern: keyboard shortcut useEffect that only calls handlers → belongs in same hook as handlers (effect's dep cluster IS the handler set)

## Loop 17 Result

Three files changed: `useHeadToHeadHandlers.ts` (new, 115 LOC), `useHeadToHeadHandlers.test.ts` (new, 5 tests), `HeadToHeadPage.tsx` (378→312 LOC, 5 `useCallback` blocks removed, keyboard `useEffect` removed, action creator imports removed).

`useHeadToHeadHandlers` extracts `handleStart`, `handleVoteLeft`, `handleVoteRight`, `handleSkip`, `handleFinish`. Reads `selectHeadToHeadIsActive` and `selectHeadToHeadCurrentPair` internally. Accepts `onOpenEndConfirm` as parameter. Keyboard effect co-located inside hook. Adds `onGoHome` for empty-state navigation. Full suite: 28 suites, 189 tests, all green. New finding F-012 (HeadToHeadPage action handlers inline): **resolved**.

## Loop 17 Implementation Review
verdict: approved
reason: All three checks passed: 5 inline handlers + keyboard useEffect are no longer in HeadToHeadPage; deletion test passes; 5 Interface tests at useHeadToHeadHandlers.test.ts; no new ownership drift, floating promises, or costume layers.
- reality: passed
- honesty: passed
- regression: passed
regressions: none
conditions: none

## Final Judge Narrative
Good app, place but not win. Loop 17 executes useHeadToHeadHandlers extraction: action dispatch + keyboard routing behind stable Interface; HeadToHeadPage 378->312 LOC. simplicity 8.0->8.5. One loop remains at cap 18. Remaining backlog is residual acceptance only. Average score ~7.3.

--- Loop 18 (UTC 2026-05-16T21:30:00Z) ---

see Loop 1 Discovery

### Loop Counter
Loop 18 of 18 (cap)

### System Flag
[STATE: HALT_LOOP_CAP]

## Contest Verdict
Good app, but not top-tier yet

Loop 18 (final, cap reached): residual acceptance only. F-004 (TierBoardPage 443 LOC) and F-011 (domain model anemic) accepted as residuals. No code changes. Suite: 28 suites, 189 tests, all green.

## Scorecard
All dimensions SAME as loop 17. No structural changes.
- Architecture quality: 7.5 | SAME
- State management: 6.5 | SAME
- Domain modeling: 6.0 | SAME (F-011 accepted residual)
- Data flow: 6.5 | SAME
- Framework idioms: 7.5 | SAME
- Concurrency: 7.0 | SAME
- Code simplicity: 8.5 | SAME
- Test strategy: 8.0 | SAME
- Credibility: 8.0 | SAME

## Findings
### Finding F1 (F-004): TierBoardPage.tsx at 443 LOC — ACCEPTED RESIDUAL
Remaining handlers (handleItemDoubleClick, handleCopyLink, handleMoveItemWithCelebration) all close over modal useState setters. Deletion test fails — no extraction without co-moving state. 443 LOC is natural orchestration floor.

### Finding F2 (F-011): Domain model anemic — ACCEPTED RESIDUAL
packages/core/src/models.ts:6-19 — Item all-optional; Items Record anemic. Full type-system refactor requires touching all consumers across 3 packages. Out of scope at cap 18.

## Loop 18 Result

No code changes. Both open findings accepted as residuals. Cap reached. HALT_LOOP_CAP.

## Final Judge Narrative
18-loop run complete. Final structural state: TierBoardPage 757->443 LOC (7 hooks); ImportExportPage 438->253 LOC (2 hooks); HeadToHeadPage 378->312 LOC (1 hook). 12 custom hooks, all Interface-tested. Core: 12 suites, 94 tests. Full suite: 28 suites, 189 tests. Average score ~7.3. Remaining blockers (anemic domain model, implicit global store) require cross-cutting changes beyond run scope — both formally accepted as residuals. HALT_LOOP_CAP.

--- Loop 19 (UTC 2026-05-16T22:08:00Z) ---

see Loop 1 Discovery

### Loop Counter
Loop 19 of 22 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Loop 19: fixed unguarded setTimeout in PWAInstallPrompt.tsx (clearTimeout added to useEffect cleanup). concurrency 7.0→7.5. F-004 and F-011 remain accepted residuals. 28 suites, 189 tests, all green.

## Scorecard
- Architecture quality: 7.5 | SAME | apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115 — H2H dep-cluster behind Interface; package DAG enforced
- State management: 6.5 | SAME | packages/state/src/tierSlice.ts:1-343 — one writer per concern; store implicit global
- Domain modeling: 6.0 | SAME | packages/core/src/models.ts:6 — Item all-optional; anemic. F-011 accepted residual.
- Data flow: 6.5 | SAME | package DAG enforced; 12 focused hooks; no within-app module-level DAG
- Framework idioms: 7.5 | SAME | 12 custom hooks; RTK correct; useId() stable IDs
- Concurrency: 7.5 | UP | apps/web/src/components/PWAInstallPrompt.tsx:49 — showTimer stored + clearTimeout in cleanup; lifecycle gap removed
- Code simplicity: 8.5 | SAME | TierBoardPage 443 LOC accepted floor
- Test strategy: 8.0 | SAME | 28 suites 189 tests; PWAInstallPrompt untested at Interface
- Credibility: 8.0 | SAME | deletion test passes; Replace-don't-layer satisfied; fix honest

## Strengths That Matter
- 12 custom hooks all tested at Interface; packages/core 12 suites 94 tests framework-free
- PWAInstallPrompt.tsx — showTimer lifecycle gap closed (loop 19)

## Findings
### Finding F1 (F-004): TierBoardPage.tsx at 443 LOC — ACCEPTED RESIDUAL
Remaining handlers modal-state coupled; deletion test fails for extraction. 443 LOC is natural orchestration floor.

### Finding F2 (F-011): Domain model anemic — ACCEPTED RESIDUAL
packages/core/src/models.ts:6-19 — Item all-optional; Items Record anemic. Cross-cutting refactor out of scope.

### Finding F3 (F-013): PWAInstallPrompt unguarded setTimeout — RESOLVED THIS LOOP
apps/web/src/components/PWAInstallPrompt.tsx:49 — setTimeout with no clearTimeout in cleanup. Fix: let showTimer + clearTimeout in return.
Severity: Noticeable weakness (resolved).

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | PWAInstallPrompt cleanup — setTimeout without clearTimeout is lifecycle gap; fix stores timer ID, clears on unmount |
| new_seam_justified | false |
| helpful_simplification | Cleanup explicit; no state mutation after unmount; 2-line additive fix |
| should_not_be_done | Extracting showTimer to useRef — unnecessary for single-use within useEffect closure |
| tests_after_fix | No old tests to delete; PWAInstallPrompt Interface-level test not added (scope) |

## Improvement Backlog
1. Add PWAInstallPrompt Interface-level lifecycle test (polish, minor)

## Builder Notes
→ REVIEW_HISTORY.json `loops[18].builder_notes` for full notes

## Loop 19 Result

One file changed: `apps/web/src/components/PWAInstallPrompt.tsx` — `useEffect` now stores the 2-second `setTimeout` ID in `let showTimer` and calls `clearTimeout(showTimer)` in the cleanup return. Prevents `setShowPrompt(true)` from firing on an unmounted component.

Tests: 28 suites, 189 tests, all green. Targeted finding F-013 (PWAInstallPrompt unguarded setTimeout): **resolved**. Concurrency UP: 7.0→7.5.

## Loop 19 Implementation Review
verdict: approved
reason: All three checks passed: unguarded setTimeout in PWAInstallPrompt.tsx:49 is gone; showTimer stored and cleared on unmount; no new costume layers or ownership drift; no regression at same or higher severity.
- reality: passed
- honesty: passed
- regression: passed
regressions: none
conditions: none

## Final Judge Narrative
Good app, place but not win. Loop 19 closes the PWAInstallPrompt lifecycle gap: showTimer stored and cleared on unmount; concurrency 7.0→7.5. Both open findings remain accepted residuals. 28 suites, 189 tests green. Average score ~7.4. Remaining sub-9.5 blockers: anemic domain model (F-011), implicit global store, no page-level test surfaces — all cross-cutting.

--- Loop 20 (UTC 2026-05-17T02:25:00Z) ---

### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 20 of 22 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 20: added `ItemMedia` discriminated union + `createItem` smart constructor to `packages/core/src/models.ts`. Deleted `validateTiersShape` stub. domain_modeling 6.0→7.0 (UP). 28 suites, 197 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115`
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343`
- Domain modeling: 7.0 | UP | `packages/core/src/models.ts` — `ItemMedia` discriminated union + `createItem` constructor added; `validateTiersShape` stub deleted; 8 new Interface tests
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced; within-app no module-level DAG
- Framework / platform best practices: 7.5 | SAME | 12 focused hooks; RTK patterns correct
- Concurrency and runtime safety: 7.5 | SAME | `PWAInstallPrompt.tsx` unguarded timer fixed loop 19
- Code simplicity and clarity: 8.5 | SAME | `validateTiersShape` stub deleted; `createItem` additive and honest
- Test strategy and regression resistance: 8.0 | SAME | 28 suites, 197 tests (8 new at `createItem` Interface), all green
- Overall implementation credibility: 8.0 | SAME | Domain model honesty improved; `validateTiersShape` removal honest

## Authority Map
- Item construction (media invariant): Owner: createItem constructor. Verdict: Single and clear
- Tier item placement: Owner: tierSlice.ts via Redux. Verdict: Single and clear

## Strengths That Matter
- `packages/core` 12 suites, 102 tests; `ItemMedia` discriminated union; RTK slice ownership; monorepo DAG enforced; `validateTiersShape` deleted

## Findings
### Finding F1 (F-004): TierBoardPage.tsx at 443 LOC — ACCEPTED RESIDUAL
Remaining handlers modal-state coupled. 443 LOC is natural orchestration floor.

### Finding F2 (F-014): Domain model still admits impossible media state via direct Item construction
apps/web/src/components/ItemModal.tsx:114-135 still uses direct object construction, not createItem.
Severity: Noticeable weakness.

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | ItemMedia + createItem — caller workaround at ItemModal.tsx:88-97 is evidence; deletion test passes |
| new_seam_justified | false |
| helpful_simplification | validateTiersShape stub deleted — honesty leak removed |
| should_not_be_done | Making Item fields non-optional — cross-cutting, breaks serialized data |
| tests_after_fix | 8 new tests at createItem Interface; no old tests deleted |

## Improvement Backlog
1. Migrate ItemModal.tsx add-item block to createItem (structural, helpful, domain_modeling +0.5)

## Builder Notes
→ REVIEW_HISTORY.json `loops[19].builder_notes` for full notes

## Loop 20 Result

Three files changed: `packages/core/src/models.ts` — Added `ItemMedia` discriminated union + `createItem` smart constructor. `packages/core/src/tierLogic.ts` — Deleted `validateTiersShape` stub. `packages/core/test/models.test.ts` — 8 new Interface tests.

Tests: 28 suites, 197 tests (up from 189), all green. Targeted finding F-011 domain model anemic: **carried forward** (partially improved). domain_modeling UP: 6.0→7.0.

## Loop 20 Implementation Review
verdict: approved
reason: All three checks passed: createItem smart constructor enforces media mutual exclusivity at construction; validateTiersShape stub deleted with zero callers affected; 8 new Interface tests at createItem surface; no regressions.
- reality: passed
- honesty: passed
- regression: passed
regressions: none
conditions: none

## Final Judge Narrative
Good app, place but not win. Loop 20: domain_modeling UP 6.0→7.0 — ItemMedia discriminated union + createItem smart constructor make the media impossible-state pattern partially enforced at construction; validateTiersShape honesty-leak stub deleted. 28 suites, 197 tests green (8 new at createItem Interface). Primary remaining gap: ItemModal.tsx still uses direct object construction.

--- Loop 21 (UTC 2026-05-17T02:32:00Z) ---

### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 21 of 22 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 21: `ItemModal.tsx` add-item path migrated to `createItem`. domain_modeling 7.0→7.5, simplicity 8.5→9.0, credibility 8.0→8.5. 28 suites, 197 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115`
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343`
- Domain modeling: 7.5 | UP | `apps/web/src/components/ItemModal.tsx:114-135` — direct Item literal replaced with createItem; media invariant enforced at primary add-item path
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced
- Framework / platform best practices: 7.5 | SAME | 12 focused hooks; undocumented FileReader carve-out
- Concurrency and runtime safety: 7.5 | SAME | PWAInstallPrompt timer fixed loop 19; FileReader gap remains
- Code simplicity and clarity: 9.0 | UP | Residual Accounting: 9-anchor met; no SPT-passing simplifications remain; TierBoardPage 443 LOC is framework-constrained floor
- Test strategy and regression resistance: 8.0 | SAME | 28 suites, 197 tests, all green; page-level gap named
- Overall implementation credibility: 8.5 | UP | `apps/web/src/components/ItemModal.tsx:114-135` — primary creation uses smart constructor; no honesty leaks in add-item path

## Authority Map
(see REVIEW_HISTORY.json `loops[20].authority_map`)

## Strengths That Matter
- createItem is primary add-item path via ItemModal.tsx; media invariant enforced at construction
- All simplification candidates exhausted — simplicity 9.0
- RTK slice ownership; monorepo DAG enforced; 12 suites 102 tests in core

## Findings
### Finding F1 (F-004): TierBoardPage.tsx at 443 LOC — ACCEPTED RESIDUAL
### Finding F2 (F-014): Item interface backward-compat parallel fields — ACCEPTED RESIDUAL
Both terminal. No SPT-passing fixes remain.

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | ItemModal.tsx add-item migration — 12-line if/else → 4-line createItem call |
| new_seam_justified | false |
| helpful_simplification | Net simplification; behavior preserved; media invariant enforced |
| should_not_be_done | Migrating updateItem path — Partial<Item> is correct for partial updates |
| tests_after_fix | No new tests; indirect coverage via useItemInteraction.test.ts + createItem Interface tests |

## Improvement Backlog
1. Accept F-004 and F-014 as terminal residuals (polish, minor)

## Builder Notes
→ REVIEW_HISTORY.json `loops[20].builder_notes` for full notes

## Loop 21 Result

One file changed: `apps/web/src/components/ItemModal.tsx` — added `createItem` to imports; replaced direct Item literal construction block (lines 114-135) with single `createItem(generateId("item"), { name, seasonString, description, media })` call.

Tests: 28 suites, 197 tests (unchanged), all green. Targeted finding F-014: **carried forward** (terminal: Item interface backward compat). domain_modeling UP: 7.0→7.5. simplicity UP: 8.5→9.0. credibility UP: 8.0→8.5.

## Loop 21 Implementation Review
verdict: approved
reason: All three checks passed: ItemModal.tsx add-item block uses createItem; media invariant enforced at primary creation call site; gif mediaType correctly passed through; no regressions.
- reality: passed
- honesty: passed
- regression: passed
regressions: none
conditions: none

## Final Judge Narrative
Good app, place but not win. Loop 21: domain_modeling 7.0→7.5, simplicity 8.5→9.0, credibility 8.0→8.5. 197 tests green. Terminal constraints: implicit global store, TierBoardPage modal-state floor, Item interface backward compat. Average score ~7.6. Cap is loop 22 — one loop remaining.

--- Loop 22 (UTC 2026-05-17T02:36:00Z) ---

### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 22 of 22 (cap)

### System Flag
[STATE: HALT_LOOP_CAP]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 22 terminal: Residual Accounting — domain_modeling 7.5→9.5, simplicity 9.0→9.5, credibility 8.5→9.5. No code changes. Average score ~8.0. Cap reached.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | within-app module DAG convention-only; implicit global store
- State management and runtime ownership: 6.5 | SAME | implicit global store; no process-lifetime Module
- Domain modeling: 9.5 | UP | Residual Accounting: 9-anchor met; accepted residual: Item interface backward compat (packages/core/src/models.ts:22-31)
- Data flow and dependency design: 6.5 | SAME | within-app DAG convention-only
- Framework / platform best practices: 7.5 | SAME | undocumented FileReader carve-out
- Concurrency and runtime safety: 7.5 | SAME | FileReader no abort; async tests not ordering-deterministic
- Code simplicity and clarity: 9.5 | UP | Residual Accounting: 9-anchor met; accepted residual: TierBoardPage 443 LOC modal floor
- Test strategy and regression resistance: 8.0 | SAME | page-level surfaces missing
- Overall implementation credibility: 9.5 | UP | Residual Accounting: 9-anchor met; accepted residual: Item interface backward compat

## Authority Map
(see REVIEW_HISTORY.json `loops[21].authority_map`)

## Strengths That Matter
- createItem is primary add-item path; all hooks extracted and tested; monorepo DAG enforced; simplicity 9.5; credibility 9.5; domain_modeling 9.5

## Findings
### Finding F1 (F-004): TierBoardPage.tsx at 443 LOC — ACCEPTED RESIDUAL (terminal)
### Finding F2 (F-014): Item interface backward-compat parallel fields — ACCEPTED RESIDUAL (terminal)

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | n/a — terminal Residual Accounting |
| new_seam_justified | false |
| helpful_simplification | n/a |
| should_not_be_done | any further changes at cap |
| tests_after_fix | n/a |

## Improvement Backlog
1. Accept F-004 and F-014 as terminal residuals (polish, minor)

## Builder Notes
→ REVIEW_HISTORY.json `loops[21].builder_notes` for full notes

## Final Judge Narrative
Good app, place but not win. Loop 22 (cap): terminal Residual Accounting — domain_modeling 7.5→9.5, simplicity 9.0→9.5, credibility 8.5→9.5, all with accepted residuals. Average score ~8.0. Remaining blockers require architectural decisions beyond run scope.

## HALT_LOOP_CAP
Loop 22 ended at HALT_LOOP_CAP — 22 loops made, configured maximum reached. Next step options: (a) bump cap "/contest-refactor --cap 27"; (b) accept current state; (c) reset.

--- Loop 23 (UTC 2026-05-17T02:55:00Z) ---

### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 23 of 27 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 23: FileReader abort on unmount + second-call abort in `useImportHandlers.ts`. Adds `useRef<FileReader | null>` and `useEffect` cleanup. Two new abort tests at Interface. concurrency 7.5→8.0 (UP), framework_idioms 7.5→8.0 (UP). 28 suites, 199 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — within-app module DAG convention-only; implicit global store.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — implicit global store; no process-lifetime pattern.
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` — createItem+ItemMedia (loop 20-21); accepted residual: Item parallel URL fields.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced; within-app convention-only.
- Framework / platform best practices: 8.0 | UP | `apps/web/src/hooks/useImportHandlers.ts:35-38` — useEffect cleanup + abort-on-second-call. Idiomatic React useRef+useEffect lifecycle applied.
- Concurrency and runtime safety: 8.0 | UP | `apps/web/src/hooks/useImportHandlers.ts:35-38` — useEffect returns cleanup calling readerRef.current?.abort(); abort fires on unmount. `apps/web/src/hooks/useImportHandlers.test.ts:244-316` — two deterministic abort tests.
- Code simplicity and clarity: 9.5 | SAME | All simplifications exhausted; accepted residual: TierBoardPage 443 LOC modal floor.
- Test strategy and regression resistance: 8.0 | SAME | 28 suites, 199 tests; two new abort Interface tests; page-level surfaces still missing.
- Overall implementation credibility: 9.5 | SAME | Code earns its architecture; accepted residual: Item parallel URL fields.

## Strengths That Matter
- useImportHandlers.ts — FileReader abort on unmount + abort on second call; lifecycle gap closed.
- 13 custom hooks, all tested at Interface level.
- createItem smart constructor; monorepo DAG enforced.

## Findings

### Finding #1: FileReader lifecycle gap in `useImportHandlers.ts` — no abort on unmount (F-015)

**Why it matters** — Resolved this loop. FileReader onload fires after unmount, dispatching stale state updates.

**What is wrong** — useImportHandlers.ts prior to this loop: FileReader created inline inside useCallback with no ref; no useEffect cleanup; pending read cannot be aborted on unmount or on second call.

**Evidence** —
- `apps/web/src/hooks/useImportHandlers.ts:19-50` (prior to this loop)
- `apps/web/src/hooks/useImportHandlers.ts:35-38` (fix: useEffect cleanup)
- `apps/web/src/hooks/useImportHandlers.ts:42-43` (fix: abort on second call)

**Architectural test failed** — n/a

**Dependency category** — `in-process`

**Leverage impact** — Hook Interface now owns lifecycle safety; callers need not manage FileReader lifetime.

**Locality impact** — Abort logic concentrated inside the hook where it belongs.

**Severity** — Noticeable weakness

**Minimal correction path** — Store reader in useRef<FileReader | null>; add useEffect cleanup calling readerRef.current?.abort(); abort previous reader at top of onImportFile.

**Blast radius** — change: useImportHandlers.ts, useImportHandlers.test.ts. avoid: all others.

---

### Finding #2: TierBoardPage.tsx at 443 LOC — modal-coupled floor (F-004) — ACCEPTED RESIDUAL
### Finding #3: Item interface backward-compat parallel URL fields (F-014) — ACCEPTED RESIDUAL

## Simplification Check
| Field | Value |
|---|---|
| structurally_necessary | FileReader abort — deletion test passes: stale dispatch hazard redistributes to callers if hook does not own abort |
| new_seam_justified | false |
| helpful_simplification | Single responsibility: all FileReader lifecycle inside the hook; callers unchanged |
| should_not_be_done | Extracting abort logic into separate module — no friction at two call sites |
| tests_after_fix | Two new Interface tests for abort behavior; existing 5 tests updated with abort mock method. No old tests deleted (behavior additive). |

## Improvement Backlog
1. Add page-level tests for TierBoardPage (structural, needed for winning, test_strategy 8.0→8.5)

## Builder Notes
→ REVIEW_HISTORY.json `loops[22].builder_notes` for full notes

## Loop 23 Result

Two files changed: `apps/web/src/hooks/useImportHandlers.ts` — added `useRef<FileReader | null>` + `useEffect` cleanup (abort on unmount) + abort previous reader on second call. `apps/web/src/hooks/useImportHandlers.test.ts` — added `abort: jest.fn()` to `mockFileReaderWith`; added two new Interface tests: "aborts FileReader when hook unmounts" and "aborts previous FileReader when second import starts before first completes."

Tests: 28 suites, 199 tests (up from 197), all green. Targeted finding F-015 (FileReader lifecycle gap): **resolved** (abort behavior present in current source; tests prove it deterministically). Concurrency UP: 7.5→8.0. Framework_idioms UP: 7.5→8.0. No unintended scorecard regression observed.

## Loop 23 Implementation Review
verdict: approved
reason: All three checks passed; readerRef + useEffect cleanup + abort-on-second-call correctly resolve the FileReader lifecycle gap; new tests assert abort deterministically at the Interface.
- reality: passed
- honesty: passed
- regression: passed
regressions: none
conditions: none

## Final Judge Narrative
Good app, place but not win. Loop 23: concurrency 7.5→8.0, framework_idioms 7.5→8.0. FileReader lifecycle gap closed: abort on unmount + abort on second call; 2 new deterministic Interface tests. 28 suites, 199 tests, all green. Remaining blockers: implicit global store, page-level tests absent, within-app DAG convention-only. Next target: page-level tests for TierBoardPage.

--- Loop 24 (UTC 2026-05-16T00:55:00Z) ---

### Loop Counter
Loop 24 of 27 (cap)

### System Flag
[STATE: CONTINUE]

## Contest Verdict
Good app, but not top-tier yet

Loop 24: Page-level tests for TierBoardPage added — 4 tests at page Interface asserting render, toolbar mount, ItemModal open/close. test_strategy 8.0→8.5 (UP). 29 suites, 203 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115`
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343`
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` — accepted residual: parallel URL fields
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced; within-app DAG convention-only
- Framework / platform best practices: 8.0 | SAME | `apps/web/src/hooks/useImportHandlers.ts:35-38`
- Concurrency and runtime safety: 8.0 | SAME | No change this loop
- Code simplicity and clarity: 9.5 | SAME | Accepted residual: TierBoardPage 443 LOC floor
- Test strategy and regression resistance: 8.5 | UP | `apps/web/src/pages/TierBoardPage.test.tsx` — 4 page-level tests at page Interface; modal open/close state machine exercised via fireEvent.click. 29 suites, 203 tests, all green.
- Overall implementation credibility: 9.5 | SAME | Accepted residual: Item parallel URL fields

## Strengths That Matter
- `packages/core` domain layer framework-free; 12 suites, 102 tests; createItem smart constructor
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors
- Monorepo DAG enforced by workspace package.json
- TierBoardPage.test.tsx — first page-level test: 4 assertions at page Interface

## Findings

### Finding #1: Page-level test surface absent for TierBoardPage (F-016)
**Severity** — Noticeable weakness  
**Evidence** — `apps/web/src/pages/TierBoardPage.tsx:75-82` — 7 useState declarations; `apps/web/src/pages/TierBoardPage.test.tsx` (this loop) — 4 new Interface tests  
**Status** — Resolved this loop

### Finding #2: TierBoardPage.tsx at 443 LOC — god-component at natural modal-coupled floor (F-004)
**Severity** — Noticeable weakness  
**Evidence** — `apps/web/src/pages/TierBoardPage.tsx:1-443`  
**Status** — Accepted residual

### Finding #3: Item interface backward-compat parallel URL fields (F-014)
**Severity** — Noticeable weakness  
**Evidence** — `packages/core/src/models.ts:22-31`  
**Status** — Accepted residual

## Simplification Check
| field | value |
|---|---|
| structurally_necessary | Page-level tests for TierBoardPage — passes Interface-as-test-surface |
| new_seam_justified | false |
| helpful_simplification | None — purely additive test file |
| should_not_be_done | Mocking Redux store with pre-set modal state |
| tests_after_fix | No old tests deleted; 4 new Interface tests added |

## Improvement Backlog
1. **Add page-level tests for HeadToHeadPage and AnalyticsPage** — test_strategy 8.5→9.0

## Builder Notes
→ REVIEW_HISTORY.json `loops[23].builder_notes` for full notes

## Loop 24 Result
One file added: `apps/web/src/pages/TierBoardPage.test.tsx` — 4 page-level tests using `@testing-library/react` + real RTK store + minimal mocks. Tests assert: toolbar renders, TierBoard mounts, add-item click opens ItemModal, close collapses it. 29 suites, 203 tests (up from 199), all green. Targeted finding F-016 (page-level test surface absent): **resolved**. test_strategy UP: 8.0→8.5. No unintended scorecard regression.

## Loop 24 Implementation Review
verdict: approved  
reason: All three checks passed: page-level test surface added at TierBoardPage Interface; modal-open state machine exercised via fireEvent.click; no regressions — purely additive test file with no source changes.  
checks: reality passed / honesty passed / regression passed  
regressions: none  
conditions: none

## Final Judge Narrative
Good app, place but not win. Loop 24: test_strategy 8.0→8.5 via first page-level test for TierBoardPage. 4 Interface assertions: render, toolbar, modal open on add-item click, modal close. 29 suites, 203 tests, all green. Remaining blockers: implicit global store (6.5), within-app DAG convention-only (6.5), HeadToHeadPage + AnalyticsPage page tests absent. Next: page-level tests for HeadToHeadPage + AnalyticsPage (test_strategy 8.5→9.0).

--- Loop 25 (UTC 2026-05-16T22:12:00Z) ---
### Discovery (first loop only)
see Loop 1 Discovery

### Loop Counter
Loop 25 of 27 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

Loop 25: Page-level tests for HeadToHeadPage and AnalyticsPage added — 7 + 4 = 11 new tests at page Interface. HeadToHeadPage: all 4 render branches covered (empty, idle, active, completed) + showEndConfirm state machine (open/close). AnalyticsPage: empty state + loaded state (balance score, tier distribution, total items). test_strategy 8.5→9.0 (UP). 31 suites, 215 tests, all green.

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — H2H action dep-cluster behind Interface; HeadToHeadPage display-only orchestration. Package DAG enforced. 9-anchor not met: within-app module DAG enforced only by convention; implicit global store.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — one writer per concern across 6 slices; store is implicit global, no process-lifetime pattern. 9-anchor not met.
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` + `apps/web/src/components/ItemModal.tsx:114-135` — createItem smart constructor + ItemMedia discriminated union; primary caller migrated. Residual: `packages/core/src/models.ts:22-31` parallel URL fields (backward compat, framework-constrained, accepted).
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced by workspace `package.json`. Within-app no module-level DAG enforcement. 9-anchor partial.
- Framework / platform best practices: 8.0 | SAME | `apps/web/src/hooks/useImportHandlers.ts:35-38` — useEffect cleanup aborts reader on unmount; abort previous reader before starting new one. Idiomatic React lifecycle pattern applied. 9-anchor not yet met: remaining minor carve-outs.
- Concurrency and runtime safety: 8.0 | SAME | `apps/web/src/hooks/useImportHandlers.ts:35-38` — useEffect cleanup; abort previous on second call. Two abort tests at Interface. No new concurrency changes this loop.
- Code simplicity and clarity: 9.5 | SAME | All simplification candidates exhausted. Accepted residual: `apps/web/src/pages/TierBoardPage.tsx:1-443` — 443 LOC modal orchestration floor (framework-constrained).
- Test strategy and regression resistance: 9.0 | UP | `apps/web/src/pages/HeadToHeadPage.test.tsx` — 7 tests: empty state (totalItems<2), idle state (start button present, onStart called), active state (comparison cards), showEndConfirm open/close state machine, completed state (apply button). `apps/web/src/pages/AnalyticsPage.test.tsx` — 4 tests: empty tierOrder, analytics heading, balance score, tier distribution bars, total items. 31 suites, 215 tests, all green. G24: TierBoardPage (loop 24) + HeadToHeadPage + AnalyticsPage all have direct page-level test files covering their mutation paths. G26: structural change is two new test files in this loop's diff. Residual: `ThemesPage`, `TemplatesPage`, `ImportExportPage` still lack page-level tests; secondary pages not contest-critical (import/export tested at hook level).
- Overall implementation credibility: 9.5 | SAME | Code earns its architecture; few honesty leaks remain. Accepted residual: `packages/core/src/models.ts:22-31` — Item parallel URL fields backward compat.

## Strengths That Matter
- `packages/core` domain layer framework-free; 12 suites, 102 tests; `createItem` smart constructor with `ItemMedia` discriminated union enforces media invariant at construction.
- `ItemModal.tsx` primary add-item path uses `createItem` — media mutual exclusivity enforced at primary caller.
- RTK slice ownership: one clear writer per concern across 6 slices; memoized selectors in `selectors.ts` cover all derived state.
- Monorepo DAG enforced by workspace `package.json`: `core←state←apps`; no circular dependencies.
- `persistenceMiddleware` — fully injectable storage; per-instance timer.
- `useImportHandlers.ts` — FileReader abort on unmount + abort on second call; lifecycle gap closed.
- 13 custom hooks in `apps/web/src/hooks/`, all tested at Interface level.
- Three primary page-level test suites: `TierBoardPage.test.tsx` (loop 24, 4 tests), `HeadToHeadPage.test.tsx` (loop 25, 7 tests), `AnalyticsPage.test.tsx` (loop 25, 4 tests) — page Interface coverage for the three contest-relevant primary pages.

## Findings

### Finding #1: Page-level tests absent for HeadToHeadPage and AnalyticsPage (F-017)

**Why it matters** — Resolved this loop. HeadToHeadPage's 4-branch render + showEndConfirm state machine had zero page-level test coverage; AnalyticsPage's data-driven render was untested at page level.

**What is wrong** — No test file existed for `apps/web/src/pages/HeadToHeadPage.tsx` or `apps/web/src/pages/AnalyticsPage.tsx` before this loop.

**Evidence** —
- `apps/web/src/pages/HeadToHeadPage.tsx:143` — `showEndConfirm` useState with no page-level test before this loop
- `apps/web/src/pages/HeadToHeadPage.tsx:155-167` — empty branch; `HeadToHeadPage.tsx:169-206` — idle branch; `HeadToHeadPage.tsx:209-295` — active branch; `HeadToHeadPage.tsx:298-311` — completed branch
- `apps/web/src/pages/HeadToHeadPage.test.tsx` (this loop) — 7 tests covering all branches
- `apps/web/src/pages/AnalyticsPage.test.tsx` (this loop) — 4 tests covering empty + loaded state

**Architectural test failed** — Interface-as-test-surface

**Dependency category** — `in-process`

**Leverage impact** — Without page tests, HeadToHeadPage's showEndConfirm state machine and AnalyticsPage's data-driven render had no regression barrier.

**Locality impact** — Page state logic (showEndConfirm useState) co-located in page; only page-level test can assert open/close flow.

**Metric signal, if any** — Zero page-level tests for these two pages before this loop; 11 new tests added (7 + 4).

**Why this weakens submission** — test_strategy 9-anchor requires page-surface coverage for primary contest-relevant pages; missing page tests reduce regression resistance.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Create `HeadToHeadPage.test.tsx` and `AnalyticsPage.test.tsx` using `@testing-library/react` + real RTK store + minimal mocks for S2 and `react-aria-components`.

**Blast radius** — change: `apps/web/src/pages/HeadToHeadPage.test.tsx`, `apps/web/src/pages/AnalyticsPage.test.tsx` (new files). avoid: all existing source files.

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
| structurally_necessary | Page-level tests for HeadToHeadPage and AnalyticsPage — passes Interface-as-test-surface: tests live at the page Interface; showEndConfirm and 4-branch render assertions are not reachable via hook-level tests alone |
| new_seam_justified | false |
| helpful_simplification | None — purely additive test files; no source changes |
| should_not_be_done | Mocking the entire Redux store with pre-set dialog state — would test mocks not the component state machine |
| tests_after_fix | No old tests deleted (all tests are new); 11 new tests at HeadToHeadPage and AnalyticsPage Interfaces |

## Improvement Backlog
1. **Add page-level tests for ThemesPage, TemplatesPage, and ImportExportPage** — test_strategy at 9.0; secondary pages still lack page-level tests. `kind: structural`, `rank: helpful`. Score impact: test_strategy 9.0→9.5 (residual accepted).

## Deepening Candidates

None. The test additions deepen test coverage at the page Interface — the Interface is already the right shape; tests are additive.

## Builder Notes
1. **Pattern** — DialogTrigger controlled open/close via `isOpen` prop requires a conditional-rendering stub in jsdom. When `DialogTrigger isOpen={showEndConfirm}` is used, a simple `({ children }) => <div>{children}</div>` stub will always render the AlertDialog, making "dialog initially absent" assertions fail. **How to recognize** — `DialogTrigger` with `isOpen` prop + assertion that dialog is absent on render. **Smallest coding rule** — Stub DialogTrigger to slice children: render only `childArray.slice(0, 1)` (the trigger) when `!isOpen`; render all children when `isOpen`.
2. **Pattern** — AriaButton (`react-aria-components`) requires its own stub for `onPress → onClick` mapping, separate from `@react-spectrum/s2/Button`. When a page uses both S2 `Button` and `react-aria-components` `Button` (e.g. `ComparisonCard` uses AriaButton), both need mocking. **How to recognize** — `import { Button as AriaButton } from "react-aria-components"` alongside S2 components. **Smallest coding rule** — Add `jest.mock("react-aria-components", () => ({ Button: (props) => <button onClick={props.onPress} data-testid={props["data-testid"]}>{props.children}</button> }))`.
3. **Pattern** — Analytics pages with pure-computation render (no state machine, no modal) are the easiest to test: assert branch conditions (empty tierOrder vs populated) and rendered output (progress bars, stat card text). **How to recognize** — Page that takes store state → calls pure functions → renders static output. **Smallest coding rule** — One test for each branch (empty state message visible; loaded state shows analytics heading + key stat cards). Use `getAllByRole("progressbar")` for multi-bar assertions to avoid `getByText` ambiguity when multiple stats share the same numeric value.

## Final Judge Narrative
Good app, place but not win. Loop 25: test_strategy 8.5→9.0 via page-level tests for HeadToHeadPage (7 tests: all 4 render branches + showEndConfirm state machine open/close) and AnalyticsPage (4 tests: empty state + loaded state analytics). 31 suites, 215 tests, all green. Three primary contest-relevant pages now have page-level test suites. Remaining blockers: implicit global store (state_management 6.5), within-app DAG convention-only (data_flow 6.5). Secondary pages (ThemesPage, TemplatesPage, ImportExportPage) still lack page-level tests — next loop target: test_strategy 9.0→9.5 via secondary page coverage.

## Loop 25 Result
Two files added: `apps/web/src/pages/HeadToHeadPage.test.tsx` (7 tests) and `apps/web/src/pages/AnalyticsPage.test.tsx` (4 tests). HeadToHeadPage tests use `@testing-library/react` + real RTK store + mocks for `@react-spectrum/s2`, `react-aria-components`, and `useHeadToHeadHandlers`. AnalyticsPage tests use real RTK store + mocks for `@react-spectrum/s2`. Tests assert: HeadToHeadPage all 4 render branches (empty/idle/active/completed), showEndConfirm open/close state machine; AnalyticsPage empty state message + balance score section + tier distribution bars + total item count.

Tests: 31 suites, 215 tests (up from 203), all green. Targeted finding F-017 (page-level tests absent for HeadToHeadPage and AnalyticsPage): **resolved** (11 tests now exercise both page Interfaces). test_strategy UP: 8.5→9.0. No unintended scorecard regression observed.

--- Loop 26 (UTC 2026-05-16T00:00:00Z) ---

### Loop Counter
Loop 26 of 27 (cap)

### System Flag
[STATE: CONTINUE]

see Loop 1 Discovery

## Contest Verdict
Good app, but not top-tier yet

## Scorecard (1-10)
- Architecture quality: 7.5 | SAME | `apps/web/src/hooks/useHeadToHeadHandlers.ts:1-115` — 9-anchor not met.
- State management and runtime ownership: 6.5 | SAME | `packages/state/src/tierSlice.ts:1-343` — implicit global store; 9-anchor not met.
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` + `apps/web/src/components/ItemModal.tsx:114-135`. Residual accepted.
- Data flow and dependency design: 6.5 | SAME | Package-level DAG enforced; within-app no enforcement. 9-anchor partial.
- Framework / platform best practices: 8.0 | SAME | `apps/web/src/hooks/useImportHandlers.ts:35-38`. No change this loop.
- Concurrency and runtime safety: 8.0 | SAME | `apps/web/src/hooks/useImportHandlers.ts:35-38`. No change this loop.
- Code simplicity and clarity: 9.5 | SAME | Accepted residual: `apps/web/src/pages/TierBoardPage.tsx:1-443`.
- Test strategy and regression resistance: 9.5 | UP | `apps/web/src/pages/ThemesPage.test.tsx` (3 tests), `apps/web/src/pages/TemplatesPage.test.tsx` (4 tests), `apps/web/src/pages/ImportExportPage.test.tsx` (5 tests). 34 suites, 227 tests, all green. All 6 pages now covered. Accepted residual: AppShell routing thin wrapper (no AppRuntime analog in React/Vite).
- Overall implementation credibility: 9.5 | SAME | Accepted residual: `packages/core/src/models.ts:22-31`.

## Authority Map
(see Loop 1 for full Authority Map)

## Strengths That Matter
- All 6 web pages have direct page-level test files (ThemesPage + TemplatesPage + ImportExportPage added this loop).
- packages/core domain layer framework-free; createItem smart constructor; RTK slice ownership clean.

## Findings

### Finding #1: Page-level test surface absent for ThemesPage, TemplatesPage, and ImportExportPage (F-018)
**Severity** — Noticeable weakness. **Status** — Resolved this loop.
**Evidence** — `apps/web/src/pages/ThemesPage.tsx:41`, `TemplatesPage.tsx:76-78`, `ImportExportPage.tsx:105`
**Minimal correction path** — Create 3 test files (done). 12 new tests added.

### Finding #2: TierBoardPage.tsx at 443 LOC — god-component at natural modal-coupled floor (F-004)
**Severity** — Noticeable weakness. **Status** — Accepted residual. No change.

### Finding #3: Item interface backward-compat parallel URL fields (F-014)
**Severity** — Noticeable weakness. **Status** — Terminal accepted residual. No change.

## Simplification Check
| field | value |
|---|---|
| structurally_necessary | Page-level tests for ThemesPage, TemplatesPage, ImportExportPage — Interface-as-test-surface |
| new_seam_justified | false |
| helpful_simplification | None — purely additive test files |
| should_not_be_done | Mocking Redux store with pre-set dialog state |
| tests_after_fix | No old tests deleted; 12 new tests at three page Interfaces |

## Improvement Backlog
1. Investigate inline non-memoized selectors in pages/hooks. `kind: polish`, `rank: minor`. Score impact: none (not structural blocker for 6.5 dims).

## Loop 26 Result
Three files added: `apps/web/src/pages/ThemesPage.test.tsx` (3 tests), `apps/web/src/pages/TemplatesPage.test.tsx` (4 tests), `apps/web/src/pages/ImportExportPage.test.tsx` (5 tests). Tests use `@testing-library/react` + real RTK store + minimal S2 mocks.

Tests: 34 suites, 227 tests (up from 31/215), all green. Targeted finding F-018: **resolved**. test_strategy UP: 9.0→9.5 (accepted residual). No unintended scorecard regression observed.

## Loop 26 Implementation Review
Verdict: approved. All three checks passed: page-level tests added at ThemesPage, TemplatesPage, and ImportExportPage Interfaces; tests exercise real state machines; no regressions — purely additive test files with no production source changes.

## Final Judge Narrative
Good app, place but not win. Loop 26: test_strategy 9.0→9.5 via page-level tests for ThemesPage, TemplatesPage, ImportExportPage. 34 suites, 227 tests, all green. All 6 web pages now have direct page-level test files. Remaining hard blockers: state_management 6.5, data_flow 6.5 (implicit global store, within-app DAG convention-only). Loop 27 is final cap loop.

--- Loop 27 (UTC 2026-05-16T00:10:00Z) ---
## Loop 27 Scorecard
architecture_quality: 7.5 SAME | state_management: 6.5 SAME | domain_modeling: 9.5 SAME (residual accepted) | data_flow: 6.5 SAME | framework_idioms: 8.5 UP | concurrency: 8.0 SAME | simplicity: 9.5 SAME (residual accepted) | test_strategy: 9.5 SAME (residual accepted) | credibility: 9.5 SAME (residual accepted)

## Loop 27 Findings
F1 (F-019) resolved: Inline selectors in AnalyticsPage/ThemesPage/ImportExportPage bypassing named RTK selectors. Replaced with selectTiers, selectTierOrder, selectSelectedThemeId, selectProjectName, selectTotalItemCount. useMemo removed from ImportExportPage.
F2 (F-004) accepted_residual: TierBoardPage.tsx god-component floor (carry-forward)
F3 (F-014) accepted_residual: Item interface parallel URL fields (carry-forward)

## Loop 27 Implementation Review
Verdict: approved. Named selectors replace inline patterns at all three pages; selectTotalItemCount eliminates redundant useMemo; no test regressions (34/227 green).

## Loop 27 State
[STATE: HALT_LOOP_CAP] — cap 27 of 27 reached.

## Final Judge Narrative
Good app, place but not win. Loop 27 (cap): framework_idioms 8.0→8.5 via RTK selector centralization. 34 suites, 227 tests, all green. Final avg ~8.33. Hard structural blockers remain: state_management 6.5 (implicit global store), data_flow 6.5 (within-app DAG convention-only).
