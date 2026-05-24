### Loop Counter
Loop 3 of 10 (cap)

### System Flag
[STATE: CONTINUE]

---

## Contest Verdict
Good app, but not top-tier yet

The branch drifted after the prior HALT_SUCCESS, so this loop re-derived the scorecard from current source instead of trusting the old halt. The biggest structural deduction was that the bundled theme catalog had three authorities at once: Redux state stored it, persistence serialized it, and runtime readers also bypassed state via `@tiercade/theme` helpers and constants.

## Scorecard (1-10)
Format: `[Score] | [Delta: UP/DOWN/SAME vs prev loop] | [Concrete proof: file:line or symbol]`

- Architecture quality: 9.0 | DOWN | `packages/state/src/themeSlice.ts` + `apps/web/src/hooks/useTierDisplay.ts` + `apps/web/src/pages/ThemesPage.tsx` split the same theme catalog across Redux and package-level constants.
- State management and runtime ownership: 9.0 | DOWN | `packages/state/src/themeSlice.ts:3-10` stored `availableThemes` inside Redux even though reducers only own `selectedThemeId`.
- Domain modeling: 9.5 | SAME | `packages/core/src/models.ts` keeps `media?: ItemMedia`, so impossible multi-URL states remain unrepresentable. Accepted residual: `Item.status` stays a plain string label.
- Data flow and dependency design: 9.0 | DOWN | `packages/state/src/persistenceMiddleware.ts:45-49` persisted the static theme catalog; `packages/state/src/store.ts:60-63` restored it back into runtime state.
- Framework / platform best practices: 9.5 | SAME | Reducers stay pure, selectors remain memoized, and React/Redux usage is idiomatic across the repo. Accepted residual: `apps/web/src/components/ItemModal.tsx` keeps a controlled-input cast for `mediaType`.
- Concurrency and runtime safety: 10 | SAME | The app still has explicit timeout cleanup and no source-backed concurrency hazard. No behavior-preserving improvement is identifiable from current source.
- Code simplicity and clarity: 9.0 | DOWN | `selectAvailableThemes` and `selectCurrentTheme` routed through Redux for a static catalog that callers also accessed directly from `@tiercade/theme`.
- Test strategy and regression resistance: 9.5 | SAME | The full contest gate remains green and direct state-package tests cover persistence, selectors, and slice behavior. Accepted residual: no Playwright path specifically exercises ItemMedia rendering.
- Overall implementation credibility: 9.0 | DOWN | The duplicated theme authority made the codebase claim Redux ownership over data it did not actually own.

## Authority Map
**Theme selection**
- Owner: `themeSlice.selectedThemeId`
- Allowed writers: `themeSlice.actions.selectTheme`, `themeSlice.actions.clearTheme`
- Observers / readers: `TierBoardPage`, `ThemesPage`, `useTierDisplay`, native `TierBoardScreen`
- Persistence seam: `createPersistenceMiddleware`
- Async mutation entry points: none
- Verdict: Single and clear

**Bundled theme catalog**
- Owner: split between `themeSlice.availableThemes`, `BUNDLED_THEMES`, and `findThemeById`
- Allowed writers: none (static data), but multiple readers bypassed each other
- Observers / readers: `selectCurrentTheme`, `ThemesPage`, `useTierDisplay`
- Persistence seam: `createPersistenceMiddleware` serialized the Redux copy
- Async mutation entry points: none
- Verdict: Split and ambiguous

## Strengths That Matter
- `packages/core/src/headToHead.ts` still provides real algorithmic depth behind a bounded interface.
- `packages/state/src/persistenceMiddleware.ts` remains an injectable Storage seam with direct tests.
- `packages/core/src/models.ts` keeps the `ItemMedia` discriminated union, so media invariants stay type-level.
- `packages/core/test/dag.test.ts` still enforces the monorepo import DAG structurally, not by convention.

## Findings
### Finding F1: Bundled theme catalog is duplicated across Redux state and package constants

**Why it matters** — Static catalog data should have one authority. Duplicating it across runtime state, persistence, and package constants widens the state surface without adding leverage.

**What is wrong** — Before this loop's refactor, `themeSlice` stored `availableThemes`, persistence serialized that field, and runtime readers still bypassed Redux by reading `BUNDLED_THEMES` and `findThemeById` directly.

**Evidence**
- `packages/state/src/themeSlice.ts` (pre-loop-3) stored `availableThemes: BUNDLED_THEMES`
- `packages/state/src/selectors.ts` (pre-loop-3) read the catalog back out via `selectAvailableThemes`
- `packages/state/src/persistenceMiddleware.ts:45-49` persisted `state.theme`
- `packages/state/src/store.ts:60-63` restored persisted theme state
- `apps/web/src/pages/ThemesPage.tsx:59` rendered `BUNDLED_THEMES` directly
- `apps/web/src/hooks/useTierDisplay.ts:31-33` resolved themes via `findThemeById`

**Architectural test failed** — Deletion test

**Dependency category** — `in-process`

**Leverage impact** — Callers had to learn which authority to trust for the same bundled catalog.

**Locality impact** — A catalog change leaked across slice state, selectors, persistence, and UI readers.

**Metric signal, if any** — none

**Why this weakens submission** — It makes Redux look like the owner of bundled theme data when it is really only the owner of the selected theme ID.

**Severity** — Noticeable weakness

**ADR conflicts** — none

**Minimal correction path** — Keep only `selectedThemeId` in Redux, derive the bundled catalog from `@tiercade/theme`, and persist only the selected ID.

**Blast radius**
- changed: `packages/state/src/themeSlice.ts`, `packages/state/src/selectors.ts`, `packages/state/test/selectors.test.ts`, `packages/state/test/themeSlice.test.ts`, `packages/state/test/persistenceMiddleware.test.ts`
- avoided: `apps/*`, `packages/core/*`, `packages/ui/*`

## Simplification Check
- Structurally necessary: Removes false Redux ownership over bundled theme data and passes the deletion test for the extra slice field.
- New seam justified: No new seam created.
- Helpful simplification: State now owns only the mutable choice (`selectedThemeId`) instead of a duplicated static catalog.
- Should NOT be done: Do not add a theme repository or another theme adapter layer.
- Tests after fix: Selector tests cover the bundled catalog interface directly; persistence test asserts only the selected theme ID is serialized.

## Improvement Backlog
1. Re-score after collapsing duplicated theme authority — structural — needed for winning — proves whether architecture/state/data-flow/credibility lift back to 9.5.

## Deepening Candidates
None. This loop is subtractive, not a seam-creation refactor.

## Builder Notes
- Static catalog in Redux is a smell when reducers only mutate the selection, not the catalog itself.
- Persisting immutable bundled data widens restore logic and makes ownership look broader than it is.
- Preserve public selectors when simplifying internals: move the authority, not the calling code.

## Final Judge Narrative
Still a strong codebase, but not contest-finished at the start of loop 3. Simplification helped: the branch had one shallow ownership lie around themes, and this loop removed it without widening the interface.

## Loop 3 Result
Removed `availableThemes` from `ThemeState`, made `selectAvailableThemes` derive from `BUNDLED_THEMES`, kept `selectCurrentTheme` as a derived selector, and tightened persistence/theme tests so saved theme state is only `{ selectedThemeId }`. The full contest gate passed (`test:core` 109/109, `test:state` 64/64, `test:ui` 5/5, `test:hooks` 65/65). The targeted finding is **resolved** with no observed regression.

## Loop 3 Implementation Review
- Verdict: approved (inline reviewer; manually confirmed)
- Reality: passed — Redux no longer stores the bundled catalog.
- Honesty: passed — selectors still expose the catalog/current theme through the public state interface.
- Regression: passed — the full contest gate remained green.
