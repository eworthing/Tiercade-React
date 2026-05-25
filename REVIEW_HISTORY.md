# Review History

## Loop 1 Archive

**Commit:** 5ab6270
**State:** CONTINUE
**Verdict:** Good app, but not top-tier yet

### Scorecard (pre-fix baseline)

| Dimension | Score | Delta |
|---|---|---|
| Architecture quality | 8.5 | SAME |
| State management | 8.5 | SAME |
| Domain modeling | 8.5 | SAME |
| Data flow | 8.5 | SAME |
| Framework practices | 8.5 | SAME |
| Concurrency | 9.5 | SAME |
| Simplicity | 8.5 | SAME |
| Test strategy | 8.5 | SAME |
| Credibility | 8.0 | SAME |

### Findings

| ID | Stable ID | Title | Severity | Status |
|---|---|---|---|---|
| F1 | F-001 | onboardingSlice reducer-body localStorage I/O | Serious deduction | resolved (loop 1) |
| F2 | F-002 | dynamic require() for vote; unused clearDeferredPairs import | Noticeable weakness | resolved (loop 1) |
| F3 | F-003 | Item allows impossible multi-URL combinations | Noticeable weakness | open |

### Loop 1 Fix Summary

- Removed `loadInitialState()`, `STORAGE_KEY`, and all `localStorage.*` calls from `onboardingSlice.ts` reducer bodies. Reducers now pure.
- Extended `createPersistenceMiddleware` to persist `state.onboarding`. Extended `PersistedState` interface with `onboarding?: OnboardingState`.
- Extended `createAppStore` production restore path to rehydrate `onboarding` from `loadPersistedState()`.
- Added persistence test for `completeOnboarding` via fakeStorage seam.
- Replaced `require("@tiercade/core")` with static `import { vote }` at line 5 of `headToHeadThunks.ts`. Removed unused `clearDeferredPairs` import.
- Tests: 238 → 239 (36 suites). All pass.

### Implementation Reviewer

- Verdict: approved (inline — subagent spawn unavailable, loop subagent performed checks)
- Reality: passed
- Honesty: passed
- Regression: passed

---

## Loop 2 Archive (UTC 2026-05-17T09:30:00Z)

**State:** HALT_SUCCESS
**Verdict:** Strong contender

### Scorecard (post-fix)

| Dimension | Score | Delta |
|---|---|---|
| Architecture quality | 9.5 | UP |
| State management | 9.5 | UP |
| Domain modeling | 9.5 | UP |
| Data flow | 9.5 | UP |
| Framework idioms | 9.5 | UP |
| Concurrency | 9.5 | SAME |
| Simplicity | 9.5 | UP |
| Test strategy | 9.5 | UP |
| Credibility | 9.5 | UP |

### Findings

| ID | Stable ID | Title | Severity | Status |
|---|---|---|---|---|
| F1 | F-003 | Item allows impossible multi-URL combinations | Noticeable weakness | resolved (loop 2) |

### Loop 2 Fix Summary

- Removed `imageUrl?`, `videoUrl?`, `audioUrl?`, `mediaType?` from `Item` interface; replaced with `media?: ItemMedia` discriminated union.
- `createItem` factory: 12 lines → 6 lines (direct `item.media = options.media`).
- `getItemMediaType`: 10-line switch/case → 1 line (`return item.media?.type ?? null`).
- `itemHasMedia`: 3 lines → 1 line (`return item.media !== undefined`).
- Updated 12 source reader/writer sites: `TierRow.tsx`, `TierBoard.tsx`, `StreamingOverlay.tsx`, `useItemForm.ts`, `useItemInteraction.ts`, `ItemModal.tsx`, `useExportHandlers.ts`, `urlSharing.ts`, `HeadToHeadPage.tsx`, `modelResolver.ts`, `filtering.ts`, `models.ts`.
- Updated 6 test files to assert on `item.media?.type` / `item.media?.url`.
- Tests: 239/239 pass. Net deletion across 18 files.

### Implementation Reviewer

- Verdict: approved (inline fallback — retry_count: 2, retry_cause: spawn_error)
- Reality: passed — F-003 fields absent from models.ts; `media?: ItemMedia` present
- Honesty: passed — 239/239 tests pass; no assertions on old fields
- Regression: passed — no pre-existing test broke; no new skips

---

## Loop 3 Archive (UTC 2026-05-24T23:20:00Z)

**State:** CONTINUE
**Verdict:** Good app, but not top-tier yet

### Scorecard

| Dimension | Score | Delta |
|---|---|---|
| Architecture quality | 9.0 | DOWN |
| State management | 9.0 | DOWN |
| Domain modeling | 9.5 | SAME |
| Data flow | 9.0 | DOWN |
| Framework idioms | 9.5 | SAME |
| Concurrency | 10 | SAME |
| Simplicity | 9.0 | DOWN |
| Test strategy | 9.5 | SAME |
| Credibility | 9.0 | DOWN |

### Findings

| ID | Stable ID | Title | Severity | Status |
|---|---|---|---|---|
| F1 | F-004 | Bundled theme catalog is duplicated across Redux state and package constants | Noticeable weakness | resolved (loop 3) |

### Loop 3 Fix Summary

- Removed `availableThemes` from `ThemeState`; Redux now stores only `selectedThemeId`.
- Kept `selectAvailableThemes` / `selectCurrentTheme` as public selectors, but they now derive from `@tiercade/theme`.
- Tightened state-package tests so persistence serializes only `{ selectedThemeId }` and selector tests cover bundled theme resolution directly.
- Tests: `test:core` 109/109, `test:state` 64/64, `test:ui` 5/5, `test:hooks` 65/65. All pass.

### Implementation Reviewer

- Verdict: approved (inline reviewer)
- Reality: passed — Redux no longer stores the bundled catalog
- Honesty: passed — selector interface still exposes the current theme/bundled catalog
- Regression: passed — full contest gate stayed green

---

## Loop 4 Archive (UTC 2026-05-24T23:35:00Z)

**State:** HALT_SUCCESS
**Verdict:** Strong contender

### Scorecard

| Dimension | Score | Delta |
|---|---|---|
| Architecture quality | 9.5 | UP |
| State management | 9.5 | UP |
| Domain modeling | 9.5 | SAME |
| Data flow | 9.5 | UP |
| Framework idioms | 9.5 | SAME |
| Concurrency | 10 | SAME |
| Simplicity | 9.5 | UP |
| Test strategy | 9.5 | SAME |
| Credibility | 9.5 | UP |

### Findings

None.

### Halt Summary

- Loop 4 re-ran the critic from loop-3 commit `baa7392`.
- The duplicated theme-authority finding did not persist in current source.
- Full contest gate passed again: `test:core` 109/109, `test:state` 64/64, `test:ui` 5/5, `test:hooks` 65/65.
- Result: HALT_SUCCESS with accepted residuals only.

--- HALT_SUCCESS reset by user (UTC 2026-05-25T02:17:45Z) ---

### Loop Counter
Loop 4 of 10 (cap)

### System Flag
[STATE: HALT_SUCCESS]

---

## Contest Verdict
Strong contender

Loop 4 re-ran the critic from the loop-3 commit and the duplicated theme-authority finding did not persist in current source. The branch is back at the contest target: every scorecard dimension is 10 or 9.5 with an accepted residual, and the full gate passed again from current HEAD.

## Scorecard (1-10)
Format: `[Score] | [Delta: UP/DOWN/SAME vs prev loop] | [Concrete proof: file:line or symbol]`

- Architecture quality: 9.5 | UP | `baa7392` removes bundled-theme duplication from `packages/state/src/themeSlice.ts` and keeps catalog lookup derived from `@tiercade/theme`. Accepted residual: `apps/web/src/pages/HeadToHeadPage.tsx` remains a page-level orchestrator of substantive size.
- State management and runtime ownership: 9.5 | UP | `packages/state/src/themeSlice.ts:3-9` now owns only `selectedThemeId`; `packages/state/test/persistenceMiddleware.test.ts:89-91` proves persistence serializes only that mutable choice. Accepted residual: undo history remains capped at 20 snapshots by product design.
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` keeps `media?: ItemMedia`, so impossible multi-URL states stay unrepresentable. Accepted residual: `Item.status` remains a user-defined string label.
- Data flow and dependency design: 9.5 | UP | `packages/state/src/selectors.ts:106-116` derives the bundled catalog from `@tiercade/theme`, and `packages/state/src/persistenceMiddleware.ts` no longer carries duplicated theme data. Accepted residual: `apps/web/src/utils/urlSharing.ts` still uses a lossy compact share format for URL length.
- Framework / platform best practices: 9.5 | SAME | Reducers remain pure, selectors stay memoized, and the React/Redux integration remains idiomatic. Accepted residual: `apps/web/src/components/ItemModal.tsx` keeps a controlled-input cast for `mediaType`.
- Concurrency and runtime safety: 10 | SAME | The runtime still has explicit cleanup and no source-backed concurrency hazard. No behavior-preserving improvement is identifiable.
- Code simplicity and clarity: 9.5 | UP | Loop 3 deleted the redundant Redux catalog field instead of layering a new seam; selector callers kept the same interface. Accepted residual: `packages/core/src/headToHead.ts` remains long because the algorithm is substantive, not ceremonial.
- Test strategy and regression resistance: 9.5 | SAME | The full contest gate passed from current HEAD: core 109/109, state 64/64, ui 5/5, hooks 65/65. Accepted residual: no dedicated Playwright path targets ItemMedia rendering specifically.
- Overall implementation credibility: 9.5 | UP | The loop-3 refactor aligned the code’s ownership story with the actual runtime authority for themes. Accepted residual: `apps/web/src/hooks/useItemForm.ts` still keeps a UI-local `mediaType` string default.

## Strengths That Matter
- `headToHead.ts` still provides real algorithmic leverage rather than scaffolding.
- `createPersistenceMiddleware` remains a single injectable persistence seam across slices.
- `ItemMedia` continues to encode media invariants at the type level.
- `packages/core/test/dag.test.ts` keeps the monorepo layering rules enforced by source.

## Findings
None. The fresh critic pass did not find a remaining Noticeable-or-worse issue that passes the Simplify Pressure Test.

## Simplification Check
- Structurally necessary: Loop 3 removed the only fresh drift-era ownership split.
- New seam justified: No new seam was needed.
- Helpful simplification: Theme selection remains in Redux while the bundled catalog lives only in `@tiercade/theme`.
- Should NOT be done: Do not add another theme abstraction just to replace the removed field.
- Tests after fix: The full contest gate plus direct selector/persistence tests cover the simplified theme interface.

## Improvement Backlog
All findings resolved. Residual accounting leaves only accepted residuals.

## Deepening Candidates
None.

## Builder Notes
- Bundled data should stay with the module that defines it unless runtime policy truly needs to own it.
- A slice should own mutable choices, not static catalogs.
- The best refactor here was subtractive: delete the shallow ownership lie and keep the caller interface intact.

## Final Judge Narrative
Win. Simplification helped, runtime ownership is trustworthy again, concurrency remains trustworthy, the tests reduce regressions, and the remaining work would risk overengineering rather than improve the contest score.
